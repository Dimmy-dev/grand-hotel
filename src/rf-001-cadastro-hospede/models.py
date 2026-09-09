"""
MODELOS ORM SQLALCHEMY
Sistema Grand Plaza Hotel Management — RF-001
Diretrizes: regras/DB.md, regras/back.md e OWASP Top 10

Mapeamento relacional estrito das tabelas:
- OperadorModel: Funcionários autorizados para login
- SessaoModel: Controle de tokens de sessão com hash SHA-256
- HospedeModel: Cadastro de hóspedes com chaves públicas UUID
- AuditLogModel: Trilha de auditoria e conformidade LGPD
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class OperadorModel(Base):
    """
    Representa os funcionários do hotel que operam o sistema.
    As senhas são armazenadas exclusivamente através de hash Bcrypt de 12 rounds.
    """
    __tablename__ = "tb_operadores"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    uuid_publico = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    nome = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    cargo = Column(String(50), nullable=False) # 'RECEPCIONISTA', 'GERENTE', 'ADMIN'
    is_ativo = Column(Integer, nullable=False, default=1) # 1 = Ativo, 0 = Inativo
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamento de 1 para N com sessões e logs de auditoria
    sessoes = relationship("SessaoModel", back_populates="operador", cascade="all, delete-orphan")
    logs = relationship("AuditLogModel", back_populates="operador")

    def __repr__(self):
        return f"<Operador {self.email} ({self.cargo})>"


class SessaoModel(Base):
    """
    Representa a sessão ativa do operador autenticado.
    Armazena exclusivamente o HASH SHA-256 do token do cookie (OWASP A07).
    """
    __tablename__ = "tb_sessoes"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    id_operador = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("tb_operadores.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    ip_origem = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime, nullable=True)
    is_active = Column(Integer, nullable=False, default=1) # 1 = Válida, 0 = Revogada
    created_at = Column(DateTime, default=datetime.utcnow)

    operador = relationship("OperadorModel", back_populates="sessoes")

    def __repr__(self):
        return f"<Sessao {self.id_operador} - Ativa: {self.is_active}>"


class HospedeModel(Base):
    """
    Representa o hóspede cadastrado no sistema (Domínio central do RF-001).
    Garante integridade e unicidade de CPF e e-mail.
    """
    __tablename__ = "tb_hospedes"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    uuid_publico = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    nome = Column(String(150), nullable=False)
    email = Column(String(180), unique=True, nullable=False, index=True)
    cpf = Column(String(11), unique=True, nullable=False, index=True)
    telefone = Column(String(20), nullable=False)
    data_nascimento = Column(Date, nullable=False)
    observacoes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Hospede {self.nome} ({self.cpf})>"


class AuditLogModel(Base):
    """
    Trilha de auditoria obrigatória para conformidade legal (LGPD e Embratur).
    Registra toda ação crítica com IP e timestamp UTC.
    """
    __tablename__ = "tb_audit_logs"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    id_operador = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("tb_operadores.id", ondelete="SET NULL"), nullable=True)
    acao = Column(String(50), nullable=False, index=True) # Ex: 'CADASTRO_HOSPEDE', 'LOGIN'
    tabela_afetada = Column(String(50), nullable=False)
    registro_id = Column(BigInteger().with_variant(Integer, "sqlite"), nullable=True)
    dados_novos = Column(Text, nullable=True) # Snapshot JSON dos dados
    ip_origem = Column(String(45), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    operador = relationship("OperadorModel", back_populates="logs")

    def __repr__(self):
        return f"<AuditLog {self.acao} em {self.tabela_afetada}>"
