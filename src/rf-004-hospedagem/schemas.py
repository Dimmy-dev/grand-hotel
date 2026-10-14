"""
ESQUEMAS PYDANTIC V2 UNIFICADOS (VALIDAÇÃO E CONTRATOS REST)
Sistema Grand Plaza Hotel Management — Portal Integrado (RF-001, RF-002, RF-003 e RF-004)
Diretrizes: regras/back.md e OWASP Top 10
"""

import re
import html
from enum import Enum
from datetime import datetime, date
from typing import Optional, List, Generic, TypeVar, Any
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

T = TypeVar("T")

# 1. ENVELOPE PADRÃO REST
class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None

class EnvelopeResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[ErrorDetail] = None

# 2. ENUM DE CARGOS DO SISTEMA
class CargoEnum(str, Enum):
    ADMIN = "ADMIN"
    GERENTE = "GERENTE"
    FUNCIONARIO = "FUNCIONARIO"

# 3. AUTENTICAÇÃO E OPERADORES (RF-003)
class LoginSchema(BaseModel):
    email: EmailStr = Field(..., example="recepcao@grandplaza.com")
    senha: str = Field(..., min_length=6, max_length=128)

class OperadorCreateSchema(BaseModel):
    nome: str = Field(..., min_length=3, max_length=120)
    email: EmailStr
    senha: str = Field(..., min_length=6, max_length=100)
    confirmacao_senha: str = Field(..., min_length=6, max_length=100)
    cargo: CargoEnum = Field(default=CargoEnum.FUNCIONARIO)

    @field_validator("nome")
    @classmethod
    def sanitizar_nome(cls, v: str) -> str:
        texto = html.escape(v.strip())
        if len(texto) < 3:
            raise ValueError("O nome do operador deve conter no mínimo 3 caracteres.")
        return texto

    @model_validator(mode="after")
    def validar_senhas(self):
        if self.senha != self.confirmacao_senha:
            raise ValueError("A senha e a confirmação de senha não coincidem.")
        return self

class OperadorUpdateSchema(BaseModel):
    nome: str = Field(..., min_length=3, max_length=120)
    email: EmailStr
    cargo: CargoEnum
    senha: Optional[str] = Field(None, min_length=6, max_length=100)
    confirmacao_senha: Optional[str] = Field(None, min_length=6, max_length=100)

    @field_validator("nome")
    @classmethod
    def sanitizar_nome(cls, v: str) -> str:
        return html.escape(v.strip())

    @model_validator(mode="after")
    def validar_novas_senhas(self):
        if self.senha or self.confirmacao_senha:
            if self.senha != self.confirmacao_senha:
                raise ValueError("A nova senha e a confirmação não coincidem.")
        return self

class OperadorStatusSchema(BaseModel):
    is_ativo: int = Field(..., ge=0, le=1)

class OperadorResponseSchema(BaseModel):
    uuid: str = Field(..., alias="uuid_publico")
    nome: str
    email: EmailStr
    cargo: str
    is_ativo: int
    is_online: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True

# 4. HÓSPEDES (RF-001 & RF-002)
def validar_cpf_modulo11(cpf_str: str) -> bool:
    """Validação matemática estrita de CPF pelo algoritmo Módulo 11 da Receita Federal."""
    cpf_limpo = re.sub(r"\D", "", cpf_str)
    if len(cpf_limpo) != 11 or len(set(cpf_limpo)) == 1:
        return False
    soma1 = sum(int(cpf_limpo[i]) * (10 - i) for i in range(9))
    resto1 = (soma1 * 10) % 11
    digito1 = 0 if resto1 == 10 else resto1
    if int(cpf_limpo[9]) != digito1:
        return False
    soma2 = sum(int(cpf_limpo[i]) * (11 - i) for i in range(10))
    resto2 = (soma2 * 10) % 11
    digito2 = 0 if resto2 == 10 else resto2
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
        return html.escape(v.strip()) if v else v

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        cpf_num = re.sub(r"\D", "", v)
        if not validar_cpf_modulo11(cpf_num):
            raise ValueError("CPF inválido segundo o algoritmo módulo 11.")
        return cpf_num

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nasc(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("A data de nascimento não pode ser futura.")
        return v

class HospedeUpdateSchema(BaseModel):
    nome: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    telefone: str = Field(..., min_length=10, max_length=20)
    observacoes: Optional[str] = Field(None, max_length=1000)

    @field_validator("nome", "observacoes")
    @classmethod
    def sanitizar_texto(cls, v: Optional[str]) -> Optional[str]:
        return html.escape(v.strip()) if v else v

class HospedeStatusSchema(BaseModel):
    is_ativo: int = Field(..., ge=0, le=1)

class HospedeResponseSchema(BaseModel):
    uuid: str = Field(..., alias="uuid_publico")
    nome: str
    cpf: str
    email: str
    telefone: str
    data_nascimento: Optional[date] = None
    observacoes: Optional[str] = None
    is_ativo: int = 1
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True

HospedeSimpleSchema = HospedeResponseSchema

# 5. ACOMODAÇÕES E RACK (RF-004)
class AcomodacaoResponseSchema(BaseModel):
    uuid_publico: str
    numero: str
    categoria: str
    capacidade: int
    tarifa_base: Decimal
    status: str
    andar: int
    descricao: Optional[str] = None
    hospedagem_ativa: Optional[dict] = None

    class Config:
        from_attributes = True

class AcomodacaoStatusUpdateSchema(BaseModel):
    status: str = Field(..., description="Novo status: DISPONIVEL, OCUPADO, MANUTENCAO, LIMPEZA")

    @field_validator("status")
    @classmethod
    def validar_status(cls, v: str) -> str:
        status_limpo = v.strip().upper()
        permitidos = {"DISPONIVEL", "OCUPADO", "MANUTENCAO", "LIMPEZA"}
        if status_limpo not in permitidos:
            raise ValueError(f"Status inválido. Escolha entre: {', '.join(sorted(permitidos))}")
        return status_limpo

# 6. HOSPEDAGENS (CHECK-IN E CHECK-OUT)
class CheckinRequestSchema(BaseModel):
    uuid_hospede: str = Field(..., description="UUID público do hóspede cadastrado")
    uuid_acomodacao: str = Field(..., description="UUID público do quarto a ser ocupado")
    data_prevista_checkout: datetime = Field(..., description="Data e hora prevista para saída")
    acompanhantes: Optional[List[str]] = Field(default_factory=list, description="Nomes dos acompanhantes")
    observacoes: Optional[str] = Field(None, max_length=500, description="Observações especiais da estadia")

    @field_validator("uuid_hospede", "uuid_acomodacao")
    @classmethod
    def validar_uuid(cls, v: str) -> str:
        v_limpo = v.strip()
        if len(v_limpo) < 32:
            raise ValueError("UUID público inválido.")
        return v_limpo

    @field_validator("data_prevista_checkout")
    @classmethod
    def validar_data_saida(cls, v: datetime) -> datetime:
        agora = datetime.utcnow()
        if v.replace(tzinfo=None) <= agora:
            raise ValueError("A data prevista de checkout deve ser no futuro.")
        return v

class CheckoutResponseSchema(BaseModel):
    uuid_publico: str
    hospede_nome: str
    hospede_cpf: str
    acomodacao_numero: str
    acomodacao_categoria: str
    data_checkin: datetime
    data_checkout: datetime
    num_diarias: int
    tarifa_diaria_aplicada: Decimal
    valor_total: Decimal
    status: str
    quarto_status_atual: str = "LIMPEZA"

    class Config:
        from_attributes = True

class HospedagemDetalheSchema(BaseModel):
    uuid_publico: str
    quarto_numero: str
    quarto_categoria: str
    hospede_nome: str
    hospede_cpf: str
    data_checkin: datetime
    data_prevista_checkout: datetime
    tarifa_diaria_aplicada: Decimal
    status: str

    class Config:
        from_attributes = True
