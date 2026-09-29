"""
MODELOS ORM SQLALCHEMY
Sistema Grand Plaza Hotel Management — RF-003 (Gestão e Cadastro de Usuários do Sistema)
Diretrizes: regras/DB.md, regras/back.md e OWASP Top 10

Mapeamento relacional estrito das entidades:
- OperadorModel: Usuários e operadores do sistema hoteleiro (Admin, Gerente, Funcionário).
- SessaoModel: Controle de tokens de sessão criptografados com SHA-256 e HttpOnly Cookies.
- HospedeModel: Cadastro de hóspedes com chaves públicas UUID (mantido para compatibilidade integrada).
- AuditLogModel: Trilha de auditoria imutável para conformidade LGPD e segurança da informação.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, String, Text, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class OperadorModel(Base):
    """
    Representa os usuários e funcionários que operam o sistema corporativo do hotel.
    
    Cargos permitidos:
    - 'ADMIN': Administrador do sistema com permissão total para criar e gerenciar operadores.
    - 'GERENTE': Gerente operacional com supervisão e relatórios.
    - 'FUNCIONARIO': Funcionário de atendimento/recepção para gestão de hóspedes.
    
    Segurança:
    - Senhas são armazenadas exclusivamente através de hash Bcrypt com 12 rounds de salt.
    """
    __tablename__ = "tb_operadores"

    # Chave primária surrogate interna para indexação B-Tree de alta performance
    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    
    # Identificador universal público exposto externamente em APIs REST e URLs
    uuid_publico = Column(String(36), unique=True, nullable=False, default=lambda: str(uuid.uuid4()), index=True)
    
    # Nome completo do colaborador ou operador do hotel
    nome = Column(String(120), nullable=False)
    
    # E-mail institucional único utilizado como identificador no login (chave única)
    email = Column(String(150), unique=True, nullable=False, index=True)
    
    # Hash Bcrypt da senha (OWASP A07 - nunca armazenar em texto claro)
    senha_hash = Column(String(255), nullable=False)
    
    # Nível hierárquico / papel do usuário no sistema
    cargo = Column(String(50), nullable=False, default="FUNCIONARIO", index=True)
    
    # Indicador de ativação lógica (1 = Ativo, 0 = Inativo/Desativado por Soft Delete)
    is_ativo = Column(Integer, nullable=False, default=1, index=True)
    
    # Data e hora UTC do registro inicial
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Data e hora UTC da última modificação cadastral
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relacionamento de 1 para N com sessões de autenticação e logs de auditoria
    sessoes = relationship("SessaoModel", back_populates="operador", cascade="all, delete-orphan")
    logs = relationship("AuditLogModel", back_populates="operador")

    def __repr__(self):
        return f"<Operador {self.nome} - Cargo: {self.cargo} ({'Ativo' if self.is_ativo == 1 else 'Inativo'})>"


class SessaoModel(Base):
    """
    Representa a sessão ativa do operador autenticado no sistema.
    Armazena exclusivamente o HASH SHA-256 do token criptográfico transmitido via cookie HttpOnly.
    """
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

    def __repr__(self):
        return f"<Sessao Operador ID={self.id_operador} - Ativa: {self.is_active}>"


class HospedeModel(Base):
    """
    Representa os hóspedes do hotel (mantido para coexistência harmônica dos requisitos RF-001 e RF-002).
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
    is_ativo = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Hospede {self.nome} ({self.cpf})>"


class AuditLogModel(Base):
    """
    Trilha de auditoria legal imutável em conformidade com a LGPD e o padrão de governança técnica.
    Registra toda ação sensível (Criação de operador, alteração de status, login e logout).
    """
    __tablename__ = "tb_audit_logs"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    id_operador = Column(BigInteger().with_variant(Integer, "sqlite"), ForeignKey("tb_operadores.id", ondelete="SET NULL"), nullable=True)
    acao = Column(String(50), nullable=False, index=True)
    tabela_afetada = Column(String(50), nullable=False)
    registro_id = Column(BigInteger().with_variant(Integer, "sqlite"), nullable=True)
    dados_novos = Column(Text, nullable=True)
    ip_origem = Column(String(45), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    operador = relationship("OperadorModel", back_populates="logs")

    def __repr__(self):
        return f"<AuditLog {self.acao} em {self.tabela_afetada}>"
