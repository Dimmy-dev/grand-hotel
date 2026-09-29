"""
SCHEMAS PYDANTIC V2 E VALIDAÇÃO DE BORDA
Sistema Grand Plaza Hotel Management — RF-003 (Gestão e Cadastro de Usuários do Sistema)
Diretrizes: regras/back.md e OWASP Top 10

Contratos de dados de entrada e saída com validação estrita:
- Validação de cargos com Enum ('ADMIN', 'GERENTE', 'FUNCIONARIO')
- Validação de confirmação de senha e comprimento seguro
- Sanitização de texto livre contra ataques Stored XSS via html.escape
- Omissão categórica de campos de senha nos DTOs de saída
- Envelope Pattern padronizado para respostas da API
"""

import re
import html
from enum import Enum
from datetime import date, datetime
from typing import Optional, List, Any, Generic, TypeVar
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

T = TypeVar("T")

class CargoEnum(str, Enum):
    """
    Enumeração formal dos três níveis de privilégio permitidos no sistema.
    """
    ADMIN = "ADMIN"
    GERENTE = "GERENTE"
    FUNCIONARIO = "FUNCIONARIO"


# ----------------------------------------------------------------------------
# DTOs DE ENTRADA (REQUESTS DE OPERADORES / USUÁRIOS)
# ----------------------------------------------------------------------------

class LoginSchema(BaseModel):
    """
    Payload de entrada para o endpoint de autenticação do operador.
    """
    email: EmailStr = Field(..., description="E-mail institucional do colaborador")
    senha: str = Field(..., min_length=6, max_length=100, description="Senha de acesso em texto para validação contra o hash Bcrypt")


class OperadorCreateSchema(BaseModel):
    """
    Payload de entrada para cadastro de novos usuários do sistema (RF-003).
    Acesso restrito ao Administrador do Sistema.
    """
    nome: str = Field(..., min_length=3, max_length=120, description="Nome completo do colaborador")
    email: EmailStr = Field(..., description="E-mail corporativo institucional único (RFC 5322)")
    senha: str = Field(..., min_length=6, max_length=100, description="Senha temporária ou definitiva de acesso")
    confirmacao_senha: str = Field(..., min_length=6, max_length=100, description="Confirmação idêntica da senha")
    cargo: CargoEnum = Field(..., description="Nível de acesso hierárquico: ADMIN, GERENTE ou FUNCIONARIO")

    @field_validator("nome")
    @classmethod
    def sanitizar_nome(cls, v: str) -> str:
        """Aplica sanitização contra Stored XSS removendo tags perigosas."""
        texto_limpo = html.escape(v.strip())
        if len(texto_limpo) < 3:
            raise ValueError("O nome do operador deve conter no mínimo 3 caracteres válidos.")
        return texto_limpo

    @model_validator(mode="after")
    def validar_senhas_coincidentes(self):
        """Garante que a confirmação de senha corresponda exatamente à senha informada."""
        if self.senha != self.confirmacao_senha:
            raise ValueError("A senha e a confirmação de senha não coincidem.")
        return self


class OperadorUpdateSchema(BaseModel):
    """
    Payload de entrada para atualização de dados de operador existente.
    Acesso restrito ao Administrador.
    """
    nome: str = Field(..., min_length=3, max_length=120, description="Nome completo do colaborador")
    email: EmailStr = Field(..., description="E-mail corporativo atualizado")
    cargo: CargoEnum = Field(..., description="Nível de acesso hierárquico atualizado: ADMIN, GERENTE ou FUNCIONARIO")
    senha: Optional[str] = Field(None, min_length=6, max_length=100, description="Nova senha (opcional)")
    confirmacao_senha: Optional[str] = Field(None, min_length=6, max_length=100, description="Confirmação da nova senha")

    @field_validator("nome")
    @classmethod
    def sanitizar_nome(cls, v: str) -> str:
        texto_limpo = html.escape(v.strip())
        if len(texto_limpo) < 3:
            raise ValueError("O nome do operador deve conter no mínimo 3 caracteres válidos.")
        return texto_limpo

    @model_validator(mode="after")
    def validar_novas_senhas(self):
        if self.senha or self.confirmacao_senha:
            if self.senha != self.confirmacao_senha:
                raise ValueError("A nova senha e a confirmação de senha não coincidem.")
        return self


class OperadorStatusSchema(BaseModel):
    """
    Payload de entrada para alternância de status ativo/inativo (Soft Delete).
    """
    is_ativo: int = Field(..., ge=0, le=1, description="Status do cadastro: 1 = Ativo, 0 = Inativo (Bloqueio de acesso)")


# ----------------------------------------------------------------------------
# DTOs DE SAÍDA (RESPONSES DE OPERADORES)
# ----------------------------------------------------------------------------

class OperadorResponseSchema(BaseModel):
    """
    Dados públicos seguros do operador retornado nas APIs.
    Inclui indicador de presença em tempo real (is_online).
    Atenção: A senha em texto e o hash Bcrypt são OMITIDOS por design (OWASP A07).
    """
    uuid: str = Field(..., alias="uuid_publico")
    nome: str
    email: str
    cargo: str
    is_ativo: int = 1
    is_online: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True


# ----------------------------------------------------------------------------
# DTOs COMPATÍVEIS PARA HÓSPEDES (MÓDULOS ANTERIORES RF-001 E RF-002)
# ----------------------------------------------------------------------------

def validar_cpf_modulo11(cpf_str: str) -> bool:
    """Validação matemática oficial do CPF pelo algoritmo Módulo 11."""
    cpf_limpo = re.sub(r"\D", "", cpf_str)
    if len(cpf_limpo) != 11 or len(set(cpf_limpo)) == 1:
        return False
    soma_primeiro = sum(int(cpf_limpo[i]) * (10 - i) for i in range(9))
    resto_primeiro = (soma_primeiro * 10) % 11
    digito1 = 0 if resto_primeiro == 10 else resto_primeiro
    if int(cpf_limpo[9]) != digito1:
        return False
    soma_segundo = sum(int(cpf_limpo[i]) * (11 - i) for i in range(10))
    resto_segundo = (soma_segundo * 10) % 11
    digito2 = 0 if resto_segundo == 10 else resto_segundo
    return int(cpf_limpo[10]) == digito2


class HospedeCreateSchema(BaseModel):
    nome: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    cpf: str
    telefone: str = Field(..., min_length=10, max_length=20)
    data_nascimento: date
    observacoes: Optional[str] = Field(None, max_length=1000)

    @field_validator("nome", "observacoes")
    @classmethod
    def sanitizar_texto(cls, v: Optional[str]) -> Optional[str]:
        if v:
            return html.escape(v.strip())
        return v

    @field_validator("cpf")
    @classmethod
    def checar_cpf(cls, v: str) -> str:
        cpf_numeros = re.sub(r"\D", "", v)
        if not validar_cpf_modulo11(cpf_numeros):
            raise ValueError("CPF inválido segundo o algoritmo módulo 11.")
        return cpf_numeros


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
