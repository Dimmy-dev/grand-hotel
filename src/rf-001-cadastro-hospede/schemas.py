"""
SCHEMAS PYDANTIC V2 E VALIDAÇÃO DE BORDA
Sistema Grand Plaza Hotel Management — RF-001
Diretrizes: regras/back.md e OWASP Top 10

Contratos de dados de entrada e saída com validação estrita:
- Algoritmo matemático oficial do Módulo 11 para validação de CPF
- Sanitização de strings contra XSS via html.escape
- Validação de RFC 5322 para e-mails corporativos
- Envelope Pattern padronizado para respostas da API
"""

import re
import html
from datetime import date, datetime
from typing import Optional, List, Any, Generic, TypeVar
from pydantic import BaseModel, EmailStr, Field, field_validator

T = TypeVar("T")

def validar_cpf_modulo11(cpf_str: str) -> bool:
    """
    Executa a validação matemática oficial do Cadastro de Pessoas Físicas (CPF)
    utilizando o algoritmo Módulo 11 da Receita Federal do Brasil.
    
    Etapas:
    1. Remove quaisquer caracteres não-numéricos (pontos e traços).
    2. Rejeita CPFs que não tenham exatamente 11 dígitos.
    3. Rejeita números com todos os dígitos repetidos (ex: 111.111.111-11).
    4. Calcula e valida o 1º dígito verificador.
    5. Calcula e valida o 2º dígito verificador.
    """
    # 1. Limpeza de formatação
    cpf_limpo = re.sub(r"\D", "", cpf_str)

    # 2. Checagem de tamanho exato de 11 caracteres
    if len(cpf_limpo) != 11:
        return False

    # 3. Eliminação de números com dígitos repetidos conhecidos
    if len(set(cpf_limpo)) == 1:
        return False

    # 4. Cálculo do 1º dígito verificador (pesos de 10 a 2)
    soma_primeiro = sum(int(cpf_limpo[i]) * (10 - i) for i in range(9))
    resto_primeiro = (soma_primeiro * 10) % 11
    digito1 = 0 if resto_primeiro == 10 else resto_primeiro

    if int(cpf_limpo[9]) != digito1:
        return False

    # 5. Cálculo do 2º dígito verificador (pesos de 11 a 2)
    soma_segundo = sum(int(cpf_limpo[i]) * (11 - i) for i in range(10))
    resto_segundo = (soma_segundo * 10) % 11
    digito2 = 0 if resto_segundo == 10 else resto_segundo

    return int(cpf_limpo[10]) == digito2


# ----------------------------------------------------------------------------
# DTOs DE ENTRADA (REQUESTS)
# ----------------------------------------------------------------------------

class LoginSchema(BaseModel):
    """
    Payload de entrada para o endpoint de autenticação do operador.
    """
    email: EmailStr = Field(..., description="E-mail institucional do operador")
    senha: str = Field(..., min_length=6, max_length=100, description="Senha de acesso em texto puro para conferência do hash")


class HospedeCreateSchema(BaseModel):
    """
    Payload de entrada para o cadastro de hóspedes (RF-001).
    Contém validação algorítmica e sanitização anti-XSS.
    """
    nome: str = Field(..., min_length=3, max_length=150, description="Nome completo do hóspede")
    email: EmailStr = Field(..., description="E-mail corporativo ou pessoal válido (RFC 5322)")
    cpf: str = Field(..., description="CPF válido de 11 dígitos numéricos com ou sem pontuação")
    telefone: str = Field(..., min_length=10, max_length=20, description="Telefone com código de área (DDD)")
    data_nascimento: date = Field(..., description="Data de nascimento no formato AAAA-MM-DD")
    observacoes: Optional[str] = Field(None, max_length=1000, description="Observações opcionais ou preferências de quarto")

    @field_validator("nome")
    @classmethod
    def sanitizar_nome(cls, v: str) -> str:
        """Remove espaços excessivos e tags HTML para proteção anti-XSS."""
        texto_limpo = html.escape(v.strip())
        if len(texto_limpo) < 3:
            raise ValueError("O nome do hóspede deve conter no mínimo 3 caracteres válidos.")
        return texto_limpo

    @field_validator("observacoes")
    @classmethod
    def sanitizar_observacoes(cls, v: Optional[str]) -> Optional[str]:
        """Aplica escape de caracteres especiais nas observações."""
        if v:
            return html.escape(v.strip())
        return v

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        """Validação estrita pelo algoritmo do Módulo 11 da Receita Federal."""
        cpf_numeros = re.sub(r"\D", "", v)
        if not validar_cpf_modulo11(cpf_numeros):
            raise ValueError("CPF inválido segundo o algoritmo módulo 11.")
        return cpf_numeros # Retorna apenas os 11 dígitos numéricos

    @field_validator("telefone")
    @classmethod
    def sanitizar_telefone(cls, v: str) -> str:
        """Garante que o telefone possua no mínimo 10 dígitos com DDD."""
        numeros = re.sub(r"\D", "", v)
        if len(numeros) < 10 or len(numeros) > 15:
            raise ValueError("O telefone deve conter DDD e entre 10 e 15 dígitos numéricos.")
        return v.strip()

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, v: date) -> date:
        """Impede datas futuras e datas anteriores a 01/01/1900 (RN-03)."""
        hoje = date.today()
        if v > hoje:
            raise ValueError("A data de nascimento não pode ser futura.")
        if v.year < 1900:
            raise ValueError("Data de nascimento inválida (anterior ao limite operacional de 1900).")
        return v


# ----------------------------------------------------------------------------
# DTOs DE SAÍDA (RESPONSES)
# ----------------------------------------------------------------------------

class OperadorResponseSchema(BaseModel):
    """Dados públicos do operador retornado após login bem-sucedido."""
    uuid: str = Field(..., alias="uuid_publico")
    nome: str
    email: str
    cargo: str

    class Config:
        from_attributes = True
        populate_by_name = True


class HospedeResponseSchema(BaseModel):
    """Dados formatados do hóspede expostos externamente na API REST."""
    uuid: str = Field(..., alias="uuid_publico")
    nome: str
    email: str
    cpf: str
    telefone: str
    data_nascimento: date
    observacoes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


# ----------------------------------------------------------------------------
# ENVELOPE PATTERN (PADRÃO UNIFICADO DE RESPOSTA HTTP)
# ----------------------------------------------------------------------------

class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None

class EnvelopeResponse(BaseModel, Generic[T]):
    """Padrão uniforme de envelope para respostas da API (200, 201, 4xx, 5xx)."""
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None
