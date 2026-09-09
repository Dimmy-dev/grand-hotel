"""
PROVEDOR DE CONEXÃO E SESSÃO COM RESILIÊNCIA TRANSPARENTE
Sistema Grand Plaza Hotel Management — RF-001
Diretrizes: regras/back.md e regras/DB.md

Estratégia de Resiliência:
1. Tenta conectar ao banco de produção na nuvem (Supabase PostgreSQL via DATABASE_URL).
2. Se a conexão falhar ou a variável não estiver definida (ex: máquina local offline do professor),
   faz fallback automático e transparente para o SQLite local (hotel_grand_plaza.db).
3. Na primeira execução em SQLite, inicializa automaticamente as tabelas DDL e os dados de teste (Seeds).
"""

import os
import sys
import logging
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

# Carregamento defensivo de variáveis de ambiente via python-dotenv
try:
    from dotenv import load_dotenv
    # Busca o arquivo .env no diretório local do script e na raiz do projeto
    env_local = Path(__file__).resolve().parent / ".env"
    env_raiz = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_local.exists():
        load_dotenv(dotenv_path=env_local)
    elif env_raiz.exists():
        load_dotenv(dotenv_path=env_raiz)
except ImportError:
    pass  # Se python-dotenv não estiver instalado, utiliza as variáveis padrão do sistema

# Configuração básica de logging com formatação limpa para auditoria
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("GrandPlazaDB")

# Base declarativa para mapeamento ORM das entidades
Base = declarative_base()

# Diretórios base do projeto para localização dos scripts e banco local
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent.parent
DB_FILE_PATH = CURRENT_DIR / "hotel_grand_plaza.db"
DDL_FILE_PATH = PROJECT_ROOT / "database" / "ddl" / "rf-001-hospedes-ddl.sql"
SEEDS_FILE_PATH = PROJECT_ROOT / "database" / "seeds" / "hospedes-seeds.sql"

def obter_engine():
    """
    Cria e retorna a engine do SQLAlchemy com fallback automático.
    - Primário: DATABASE_URL (Supabase PostgreSQL via PgBouncer na nuvem)
    - Fallback: SQLite local (hotel_grand_plaza.db)
    """
    database_url = os.getenv("DATABASE_URL")
    
    # 1. Tentativa de conexão primária com o Supabase (PostgreSQL)
    if database_url:
        # Normalização do prefixo legado 'postgres://' para 'postgresql://' (exigência do SQLAlchemy 2.0)
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
            
        # Limpeza defensiva: psycopg2 rejeita o parâmetro ?pgbouncer=true (usado apenas no Node/Prisma)
        if "pgbouncer=true" in database_url:
            database_url = database_url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")
            
        if database_url.startswith("postgresql"):
            try:
                logger.info("Tentando conectar ao banco de dados primário (Supabase PostgreSQL na nuvem)...")
                from sqlalchemy.pool import NullPool
                engine = create_engine(
                    database_url,
                    connect_args={"connect_timeout": 8},
                    poolclass=NullPool
                )
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
                logger.info("Conexão com Supabase PostgreSQL estabelecida com sucesso! [PRODUÇÃO EM NUVEM ATIVA]")
                return engine
            except Exception as e:
                logger.warning(f"Falha ao conectar com o Supabase ({e}). Ativando fallback de resiliência local...")
    
    # 2. Fallback de Resiliência: SQLite local
    # Em ambiente Serverless (Vercel/Lambda), o diretório da aplicação é read-only; usamos /tmp
    is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
    if is_serverless:
        sqlite_path = Path("/tmp") / "hotel_grand_plaza.db"
    else:
        sqlite_path = DB_FILE_PATH

    sqlite_url = f"sqlite:///{sqlite_path}"
    logger.info(f"Conectando ao banco relacional local SQLite: {sqlite_path}")
    
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False}
    )
    
    inicializar_banco_local(engine)
    return engine

def inicializar_banco_local(engine):
    """
    Executa os scripts DDL e Seeds no banco SQLite local caso ainda não tenham sido executados.
    Garante que o professor execute o sistema com dados prontos de homologação.
    """
    try:
        with engine.connect() as conn:
            # Verifica se a tabela central de hóspedes já existe
            tabela_existe = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_hospedes'")).fetchone()
            
            if not tabela_existe:
                logger.info("Inicializando estrutura física do banco local a partir do DDL...")
                if DDL_FILE_PATH.exists():
                    ddl_sql = DDL_FILE_PATH.read_text(encoding="utf-8")
                    # Divide os comandos por ponto e vírgula para execução segura
                    for comando in ddl_sql.split(";"):
                        comando_limpo = comando.strip()
                        if comando_limpo:
                            conn.execute(text(comando_limpo))
                    conn.commit()
                    logger.info("DDL executado com sucesso no banco SQLite local.")
                
                # Executa a carga de seeds para permitir testes imediatos
                if SEEDS_FILE_PATH.exists():
                    logger.info("Carregando operadores de teste e dados de homologação (Seeds)...")
                    seeds_sql = SEEDS_FILE_PATH.read_text(encoding="utf-8")
                    for comando in seeds_sql.split(";"):
                        comando_limpo = comando.strip()
                        if comando_limpo:
                            conn.execute(text(comando_limpo))
                    conn.commit()
                    logger.info("Seeds carregados com sucesso no banco SQLite local.")
    except Exception as e:
        logger.error(f"Erro ao inicializar banco local de resiliência: {e}")

# Instanciação global da engine e criador de sessões
engine = obter_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Injeção de dependência nativa do FastAPI para sessões do banco.
    Garante que a conexão seja aberta no início da requisição e fechada ao final,
    evitando vazamento de conexões (Connection Leaks).
    """
    db = SessionLocal()
    try:
        yield db # Fornece a sessão para o handler da rota
    finally:
        db.close() # Garante o encerramento da conexão no bloco finally
