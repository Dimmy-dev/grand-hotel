"""
PROVEDOR DE CONEXÃO E SESSÃO COM RESILIÊNCIA TRANSPARENTE
Sistema Grand Plaza Hotel Management — RF-004 (Sistema de Hospedagem, Check-in, Check-out e Rack Hoteleiro)
Diretrizes: regras/back.md e regras/DB.md

Estratégia de Resiliência:
1. Conecta primariamente ao Supabase PostgreSQL 15+ na nuvem via DATABASE_URL (PgBouncer).
2. Se a conexão falhar ou não houver internet (ex: avaliação offline do professor), 
   faz fallback automático para o SQLite local (hotel_grand_plaza.db).
3. Na primeira execução em SQLite, inicializa automaticamente as tabelas e seeds de teste.
"""

import os
import sys
import logging
from pathlib import Path
from decimal import Decimal
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

try:
    from dotenv import load_dotenv
    env_local = Path(__file__).resolve().parent / ".env"
    env_raiz = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_local.exists():
        load_dotenv(dotenv_path=env_local)
    elif env_raiz.exists():
        load_dotenv(dotenv_path=env_raiz)
except ImportError:
    pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("GrandPlazaDB")

Base = declarative_base()

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent
DB_FILE_PATH = CURRENT_DIR / "hotel_grand_plaza.db"

DB_DIAGNOSTICS = {
    "engine_type": "unknown",
    "supabase_connected": False,
    "error": None,
    "database_url_configured": False
}

def obter_engine():
    """Retorna a engine SQLAlchemy com resiliência dual."""
    global DB_DIAGNOSTICS
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        database_url = database_url.strip()
    DB_DIAGNOSTICS["database_url_configured"] = bool(database_url)
    
    # 1. Tentativa de conexão com o Supabase (PostgreSQL na nuvem)
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        if "pgbouncer=true" in database_url:
            database_url = database_url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
            
        if database_url.startswith("postgresql"):
            try:
                logger.info("Tentando conectar ao banco de dados primário (Supabase PostgreSQL)...")
                from sqlalchemy.pool import NullPool
                engine = create_engine(
                    database_url,
                    connect_args={"connect_timeout": 3},
                    poolclass=NullPool
                )
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                logger.info("Conexão com Supabase PostgreSQL estabelecida com sucesso! [PRODUÇÃO ATIVA]")
                DB_DIAGNOSTICS["engine_type"] = "Supabase PostgreSQL"
                DB_DIAGNOSTICS["supabase_connected"] = True
                DB_DIAGNOSTICS["error"] = None
                return engine
            except Exception as e:
                logger.warning(f"Falha ao conectar com o Supabase ({e}). Ativando fallback de resiliência local...")
                DB_DIAGNOSTICS["error"] = str(e)

    # 2. Fallback de Resiliência: SQLite local
    is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    if is_serverless:
        sqlite_path = Path("/tmp") / "hotel_grand_plaza.db"
    else:
        sqlite_path = DB_FILE_PATH

    logger.info(f"Utilizando banco SQLite local de resiliência em: {sqlite_path}")
    DB_DIAGNOSTICS["engine_type"] = "SQLite Local (Resiliência)"
    DB_DIAGNOSTICS["supabase_connected"] = False

    sqlite_url = f"sqlite:///{sqlite_path}"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )
    return engine

engine = obter_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def inicializar_banco_se_necessario():
    """Inicializa as tabelas ORM e seeds essenciais de operadores, hóspedes e acomodações."""
    try:
        from models import OperadorModel, HospedeModel, SessaoModel, AuditLogModel, AcomodacaoModel, HospedagemModel
        Base.metadata.create_all(bind=engine)
        
        # Se for SQLite, realiza carga idempotente de sementes se as tabelas estiverem vazias
        if "sqlite" in str(engine.url).lower():
            with SessionLocal() as db:
                # 1. Operadores
                if db.query(OperadorModel).count() == 0:
                    import bcrypt
                    s_admin = bcrypt.hashpw("Hotel@2026Admin".encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")
                    s_gerente = bcrypt.hashpw("Hotel@2026Gerente".encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")
                    s_recep = bcrypt.hashpw("Hotel@2026Recep".encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")

                    op_admin = OperadorModel(
                        nome="Administrador do Sistema",
                        email="admin@grandplaza.com",
                        senha_hash=s_admin,
                        cargo="ADMIN",
                        is_ativo=1
                    )
                    op_gerente = OperadorModel(
                        nome="Carlos Alberto (Gerente Geral)",
                        email="gerencia@grandplaza.com",
                        senha_hash=s_gerente,
                        cargo="GERENTE",
                        is_ativo=1
                    )
                    op_recep = OperadorModel(
                        nome="Maria Oliveira (Recepção)",
                        email="recepcao@grandplaza.com",
                        senha_hash=s_recep,
                        cargo="FUNCIONARIO",
                        is_ativo=1
                    )
                    db.add_all([op_admin, op_gerente, op_recep])
                    db.commit()
                    logger.info("Seeds de operadores padrão inseridas com sucesso no SQLite local.")

                # 2. Hóspedes
                if db.query(HospedeModel).count() == 0:
                    from datetime import date
                    h1 = HospedeModel(
                        uuid_publico="d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
                        nome="Dr. Fernando Albuquerque",
                        cpf="52998224725",
                        email="fernando.albuquerque@advocacia.com.br",
                        telefone="(11) 98765-4321",
                        data_nascimento=date(1982, 5, 14),
                        is_ativo=1
                    )
                    h2 = HospedeModel(
                        uuid_publico="e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
                        nome="Dra. Beatriz Mendes Santana",
                        cpf="01234567890",
                        email="beatriz.mendes@clinica.med.br",
                        telefone="(21) 99876-5432",
                        data_nascimento=date(1989, 11, 23),
                        is_ativo=1
                    )
                    h3 = HospedeModel(
                        uuid_publico="f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c",
                        nome="Eng. Lucas Silveira Prado",
                        cpf="83247829023",
                        email="lucas.silveira@techconsultoria.com.br",
                        telefone="(31) 97654-3210",
                        data_nascimento=date(1995, 2, 10),
                        is_ativo=1
                    )
                    db.add_all([h1, h2, h3])
                    db.commit()
                    logger.info("Seeds de hóspedes padrão inseridas com sucesso no SQLite local.")

                # 3. Acomodações (Inventário do Hotel)
                if db.query(AcomodacaoModel).count() == 0:
                    quartos = [
                        AcomodacaoModel(uuid_publico="c1010000-0000-0000-0000-000000000101", numero="101", categoria="STANDARD", capacidade=2, tarifa_base=Decimal("280.00"), status="DISPONIVEL", andar=1, descricao="Quarto Standard com 1 cama Queen, Wi-Fi 6 e mesa de trabalho"),
                        AcomodacaoModel(uuid_publico="c1020000-0000-0000-0000-000000000102", numero="102", categoria="STANDARD", capacidade=2, tarifa_base=Decimal("280.00"), status="DISPONIVEL", andar=1, descricao="Quarto Standard com 2 camas de solteiro e vista interna tranquila"),
                        AcomodacaoModel(uuid_publico="c1030000-0000-0000-0000-000000000103", numero="103", categoria="STANDARD", capacidade=3, tarifa_base=Decimal("340.00"), status="LIMPEZA", andar=1, descricao="Quarto Standard Triplo com 1 cama de casal e 1 de solteiro"),
                        AcomodacaoModel(uuid_publico="c1040000-0000-0000-0000-000000000104", numero="104", categoria="STANDARD", capacidade=1, tarifa_base=Decimal("240.00"), status="DISPONIVEL", andar=1, descricao="Quarto Individual Compacto ideal para viajantes corporativos"),
                        AcomodacaoModel(uuid_publico="c2010000-0000-0000-0000-000000000201", numero="201", categoria="LUXO", capacidade=2, tarifa_base=Decimal("490.00"), status="DISPONIVEL", andar=2, descricao="Suíte Luxo com cama King Size, varanda panorâmica e hidromassagem"),
                        AcomodacaoModel(uuid_publico="c2020000-0000-0000-0000-000000000202", numero="202", categoria="LUXO", capacidade=2, tarifa_base=Decimal("490.00"), status="DISPONIVEL", andar=2, descricao="Suíte Luxo com isolamento acústico reforçado e cafeteira Nespresso"),
                        AcomodacaoModel(uuid_publico="c2030000-0000-0000-0000-000000000203", numero="203", categoria="LUXO", capacidade=4, tarifa_base=Decimal("620.00"), status="MANUTENCAO", andar=2, descricao="Suíte Luxo Familiar com ante-sala e 2 banheiros completos"),
                        AcomodacaoModel(uuid_publico="c2040000-0000-0000-0000-000000000204", numero="204", categoria="LUXO", capacidade=2, tarifa_base=Decimal("490.00"), status="DISPONIVEL", andar=2, descricao="Suíte Luxo Master com Smart TV 65 polegadas e adega climatizada"),
                        AcomodacaoModel(uuid_publico="c3010000-0000-0000-0000-000000000301", numero="301", categoria="PRESIDENCIAL", capacidade=4, tarifa_base=Decimal("1450.00"), status="DISPONIVEL", andar=3, descricao="Suíte Presidencial Imperial com living privativo, closet e mordomo 24h"),
                        AcomodacaoModel(uuid_publico="c3020000-0000-0000-0000-000000000302", numero="302", categoria="PRESIDENCIAL", capacidade=6, tarifa_base=Decimal("2100.00"), status="DISPONIVEL", andar=3, descricao="Cobertura Penthouse com terraço gourmet privativo e vista da orla")
                    ]
                    db.add_all(quartos)
                    db.commit()
                    logger.info("Seeds de acomodações inseridas com sucesso no SQLite local.")
    except Exception as e:
        logger.error(f"Erro ao inicializar schema do banco: {e}")

inicializar_banco_se_necessario()

def get_db():
    """Dependência FastAPI injetando sessão de banco de dados por requisição."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
