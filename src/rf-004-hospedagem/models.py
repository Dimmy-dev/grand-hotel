"""
MODELOS ORM SQLALCHEMY
Sistema Grand Plaza Hotel Management — RF-004 (Sistema de Hospedagem, Check-in, Check-out e Rack Hoteleiro)
Diretrizes: regras/DB.md, regras/back.md e OWASP Top 10

Mapeamento relacional estrito das entidades:
- AcomodacaoModel: Inventário físico de quartos do hotel (Standard, Luxo, Presidencial).
- HospedagemModel: Vínculo transacional de estadias com tarifa congelada e cálculo de faturamento.
- OperadorModel: Usuários e operadores do sistema hoteleiro (Admin, Gerente, Funcionário).
- SessaoModel: Controle de tokens de sessão criptografados com SHA-256 e HttpOnly Cookies.
- HospedeModel: Cadastro de hóspedes com chaves públicas UUID e histórico de estadias.
- AuditLogModel: Trilha de auditoria imutável para conformidade LGPD e segurança da informação.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, String, Text, Date, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class OperadorModel(Base):
    """Representa os usuários e funcionários que operam o sistema corporativo do hotel."""
    __tablename__ = "tb_operadores"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    uuid_publico = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    nome = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    cargo = Column(String(50), nullable=False, default="FUNCIONARIO", index=True)
    is_ativo = Column(Integer, nullable=False, default=1, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessoes = relationship("SessaoModel", back_populates="operador", cascade="all, delete-orphan")
    logs = relationship("AuditLogModel", back_populates="operador")
    hospedagens = relationship("HospedagemModel", back_populates="operador")

    def __repr__(self):
        return f"<Operador {self.nome} - Cargo: {self.cargo} ({'Ativo' if self.is_ativo == 1 else 'Inativo'})>"


class SessaoModel(Base):
    """Representa a sessão ativa do operador autenticado no sistema via HttpOnly Cookie."""
    __tablename__ = "tb_sessoes"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    id_operador = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("tb_operadores.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    ip_origem = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    is_active = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    operador = relationship("OperadorModel", back_populates="sessoes")


class HospedeModel(Base):
    """Representa os hóspedes do hotel cadastrados nos requisitos anteriores."""
    __tablename__ = "tb_hospedes"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    uuid_publico = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(180), unique=True, nullable=False, index=True)
    cpf = Column(String(11), unique=True, nullable=False, index=True)
    telefone = Column(String(20), nullable=False)
    data_nascimento = Column(Date, nullable=False)
    observacoes = Column(Text, nullable=True)
    is_ativo = Column(Integer, nullable=False, default=1, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hospedagens = relationship("HospedagemModel", back_populates="hospede")

    def __repr__(self):
        return f"<Hospede {self.nome} - CPF: {self.cpf}>"


class AcomodacaoModel(Base):
    """
    Representa os quartos físicos do Grand Plaza Hotel.
    Categorias: 'STANDARD', 'LUXO', 'PRESIDENCIAL'.
    Status operacional: 'DISPONIVEL', 'OCUPADO', 'MANUTENCAO', 'LIMPEZA'.
    """
    __tablename__ = "tb_acomodacoes"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    uuid_publico = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    numero = Column(String(10), unique=True, nullable=False, index=True)
    categoria = Column(String(30), nullable=False, index=True)
    capacidade = Column(Integer, nullable=False, default=2)
    tarifa_base = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), nullable=False, default="DISPONIVEL", index=True)
    andar = Column(Integer, nullable=False, default=1)
    descricao = Column(String(255), nullable=True)
    is_ativo = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hospedagens = relationship("HospedagemModel", back_populates="acomodacao")

    def __repr__(self):
        return f"<Acomodacao {self.numero} - {self.categoria} ({self.status})>"


class HospedagemModel(Base):
    """
    Representa o vínculo contratual e a estadia do hóspede no hotel.
    Status: 'ATIVA', 'FINALIZADA', 'CANCELADA'.
    """
    __tablename__ = "tb_hospedagens"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    uuid_publico = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    id_hospede = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("tb_hospedes.id", ondelete="RESTRICT"), nullable=False, index=True)
    id_acomodacao = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("tb_acomodacoes.id", ondelete="RESTRICT"), nullable=False, index=True)
    id_operador = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("tb_operadores.id", ondelete="SET NULL"), nullable=True)
    
    data_checkin = Column(DateTime, nullable=False, default=datetime.utcnow)
    data_prevista_checkout = Column(DateTime, nullable=False)
    data_checkout = Column(DateTime, nullable=True)
    
    status = Column(String(20), nullable=False, default="ATIVA", index=True)
    num_diarias = Column(Integer, nullable=True)
    tarifa_diaria_aplicada = Column(Numeric(10, 2), nullable=False)
    valor_total = Column(Numeric(10, 2), nullable=True)
    acompanhantes_json = Column(Text, nullable=True)
    observacoes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    hospede = relationship("HospedeModel", back_populates="hospedagens")
    acomodacao = relationship("AcomodacaoModel", back_populates="hospedagens")
    operador = relationship("OperadorModel", back_populates="hospedagens")

    def __repr__(self):
        return f"<Hospedagem Quarto={self.id_acomodacao} Hospede={self.id_hospede} Status={self.status}>"


class AuditLogModel(Base):
    """Trilha imutável de auditoria em conformidade com a LGPD e governança corporativa."""
    __tablename__ = "tb_audit_logs"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    uuid_publico = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    id_operador = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("tb_operadores.id", ondelete="SET NULL"), nullable=True)
    acao = Column(String(50), nullable=False)
    tabela_afetada = Column(String(50), nullable=False)
    registro_id = Column(String(36), nullable=False)
    detalhes_json = Column(Text, nullable=True)
    ip_origem = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    operador = relationship("OperadorModel", back_populates="logs")
