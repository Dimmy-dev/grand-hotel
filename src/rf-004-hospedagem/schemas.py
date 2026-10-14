"""
ESQUEMAS PYDANTIC V2 (VALIDAÇÃO E CONTRATOS REST)
Sistema Grand Plaza Hotel Management — RF-004 (Sistema de Hospedagem, Check-in, Check-out e Rack Hoteleiro)
Diretrizes: regras/back.md e OWASP Top 10
"""

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

# 2. ESQUEMAS DE AUTENTICAÇÃO E OPERADORES
class LoginSchema(BaseModel):
    email: EmailStr = Field(..., example="recepcao@grandplaza.com")
    senha: str = Field(..., min_length=6, max_length=128)

class OperadorResponseSchema(BaseModel):
    uuid_publico: str
    nome: str
    email: EmailStr
    cargo: str
    is_ativo: int
    created_at: datetime

    class Config:
        from_attributes = True

# 3. ESQUEMAS DE HÓSPEDE (Para visualização e seleção no Check-in)
class HospedeSimpleSchema(BaseModel):
    uuid_publico: str
    nome: str
    cpf: str
    email: str
    telefone: str
    is_ativo: int

    class Config:
        from_attributes = True

# 4. ESQUEMAS DE ACOMODAÇÃO (RACK HOTELEIRO)
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

# 5. ESQUEMAS DE HOSPEDAGEM (CHECK-IN E CHECK-OUT)
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
    hospede: HospedeSimpleSchema
    acomodacao: AcomodacaoResponseSchema
    operador_nome: Optional[str] = None
    data_checkin: datetime
    data_prevista_checkout: datetime
    data_checkout: Optional[datetime] = None
    status: str
    num_diarias: Optional[int] = None
    tarifa_diaria_aplicada: Decimal
    valor_total: Optional[Decimal] = None
    acompanhantes: List[str] = []
    observacoes: Optional[str] = None

    class Config:
        from_attributes = True
