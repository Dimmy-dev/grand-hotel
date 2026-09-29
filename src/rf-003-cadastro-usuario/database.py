"""
PROVEDOR DE CONEXÃO E SESSÃO COM RESILIÊNCIA TRANSPARENTE
Sistema Grand Plaza Hotel Management — RF-003 (Gestão e Cadastro de Usuários do Sistema)
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
DDL_FILE_PATH = PROJECT_ROOT / "database" / "ddl" / "rf-001-hospedes-ddl.sql"
SEEDS_FILE_PATH = PROJECT_ROOT / "database" / "seeds" / "hospedes-seeds.sql"

DB_DIAGNOSTICS = {
    "engine_type": "unknown",
    "supabase_connected": False,
    "error": None,
    "database_url_configured": False
}

def obter_engine():
    """
    Retorna a engine SQLAlchemy com resiliência dual.
    """
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
                    connect_args={"connect_timeout": 8},
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
    """Inicializa as tabelas ORM e seeds essenciais de operadores."""
    try:
        from models import OperadorModel, HospedeModel, SessaoModel, AuditLogModel
        Base.metadata.create_all(bind=engine)
        
        # Se for SQLite e tabela vazia, insere operadores de teste básicos
        if "sqlite" in str(engine.url).lower():
            with SessionLocal() as db:
                if db.query(OperadorModel).count() == 0:
                    import bcrypt
                    # Hash Bcrypt 12 rounds para senhas padronizadas
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
