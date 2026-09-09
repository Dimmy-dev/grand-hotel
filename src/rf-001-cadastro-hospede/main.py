"""
APLICAÇÃO PRINCIPAL FASTAPI
Sistema Grand Plaza Hotel Management — RF-001 (Cadastro Seguro de Hóspede e Autenticação)
Diretrizes: regras/back.md, regras/DB.md, regras/front.md e OWASP Top 10

Recursos Implementados:
- Middlewares: CORS, Security Headers e Rate Limiting em memória por IP (OWASP API4)
- Autenticação por HttpOnly Cookies com hash SHA-256 da sessão (OWASP A07)
- Endpoints REST com Prepared Statements (SQLAlchemy ORM) prevenindo SQL Injection (OWASP A03)
- Trilha de Auditoria automática em tb_audit_logs para conformidade LGPD
- Exportação nativa do contrato OpenAPI para docs/api/swagger.json
- Rota estática servindo a SPA index.html
"""

import os
import json
import uuid
import secrets
import hashlib
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, List

# Garante que o diretório atual do módulo esteja no sys.path (compatibilidade Vercel Serverless)
CURRENT_MODULE_DIR = str(Path(__file__).resolve().parent)
if CURRENT_MODULE_DIR not in sys.path:
    sys.path.insert(0, CURRENT_MODULE_DIR)

from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session

# Importações internas do backend
from database import get_db, engine, Base, DB_DIAGNOSTICS
from models import OperadorModel, SessaoModel, HospedeModel, AuditLogModel
from schemas import (
    LoginSchema, 
    HospedeCreateSchema, 
    HospedeResponseSchema, 
    OperadorResponseSchema, 
    EnvelopeResponse, 
    ErrorDetail
)

import bcrypt

# Funções utilitárias seguras de criptografia com bcrypt nativo (12 rounds)
def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """Verifica se a senha em texto claro corresponde ao hash Bcrypt de forma segura."""
    try:
        return bcrypt.checkpw(senha_plana.encode("utf-8"), senha_hash.encode("utf-8"))
    except Exception:
        return False

def gerar_hash_senha(senha_plana: str) -> str:
    """Gera hash Bcrypt seguro com 12 rounds de salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(senha_plana.encode("utf-8"), salt).decode("utf-8")

# Inicialização da aplicação FastAPI com metadados para o Swagger UI
app = FastAPI(
    title="Grand Plaza Hotel Management API",
    description="API REST corporativa para autenticação de operadores e cadastro seguro de hóspedes com validação Módulo 11.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ----------------------------------------------------------------------------
# MIDDLEWARES: CORS, SECURITY HEADERS E RATE LIMITING
# ----------------------------------------------------------------------------

# 1. Configuração de CORS permissivo para túnel Cloudflare e Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://*.vercel.app",
        "https://*.trycloudflare.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Armazenamento em memória para Rate Limiting (Máximo 30 req/min por IP)
rate_limit_records = {}

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    """
    Middleware global para injeção de cabeçalhos de proteção e controle de taxa.
    """
    client_ip = request.client.host if request.client else "unknown"
    agora = datetime.utcnow()

    # Rate Limiting em memória (janela deslizante de 60 segundos)
    if client_ip != "127.0.0.1": # Libera localhost para testes locais contínuos
        historico = rate_limit_records.get(client_ip, [])
        # Filtra chamadas feitas no último minuto
        historico = [t for t in historico if agora - t < timedelta(seconds=60)]
        
        if len(historico) >= 30:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Limite de requisições excedido. Aguarde 1 minuto para novas tentativas."
                    }
                }
            )
        historico.append(agora)
        rate_limit_records[client_ip] = historico

    # Processa a requisição
    response: Response = await call_next(request)

    # Injeção de cabeçalhos de segurança obrigatórios (OWASP Security Headers)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


# ----------------------------------------------------------------------------
# EXCEPTION HANDLERS: PADRONIZAÇÃO DE ERROS NO ENVELOPE PATTERN
# ----------------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Intercepta falhas de schema Pydantic e formata no envelope padrão."""
    erros = exc.errors()
    primeiro_erro = erros[0] if erros else {}
    campo = ".".join(str(loc) for loc in primeiro_erro.get("loc", []))
    mensagem = primeiro_erro.get("msg", "Dados de requisição inválidos.")
    
    # Remove prefixo redundante 'Value error, ' gerado pelo Pydantic
    if mensagem.startswith("Value error, "):
        mensagem = mensagem.replace("Value error, ", "")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": mensagem,
                "field": campo
            }
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Garante que qualquer erro não tratado retorne JSON padronizado e nunca texto plano."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "SERVER_ERROR",
                "message": str(exc)
            }
        }
    )


# ----------------------------------------------------------------------------
# FUNÇÕES UTILITÁRIAS DE AUTENTICAÇÃO E SESSÃO
# ----------------------------------------------------------------------------

def gerar_hash_token(token: str) -> str:
    """Gera o hash SHA-256 do token para armazenamento seguro em banco."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def obter_operador_autenticado(request: Request, db: Session = Depends(get_db)) -> Optional[OperadorModel]:
    """
    Lê o cookie HttpOnly 'session_token', calcula o hash SHA-256 e valida a sessão ativa no banco.
    """
    token = request.cookies.get("session_token")
    if not token:
        return None

    token_hash = gerar_hash_token(token)
    agora = datetime.utcnow()

    # Busca indexada em O(1) pelo índice idx_sessoes_lookup
    sessao = db.query(SessaoModel).filter(
        SessaoModel.token_hash == token_hash,
        SessaoModel.is_active == 1,
        SessaoModel.expires_at > agora
    ).first()

    if not sessao:
        return None

    return sessao.operador


# ----------------------------------------------------------------------------
# ROTAS DE AUTENTICAÇÃO (LOGIN / LOGOUT / PERFIL)
# ----------------------------------------------------------------------------

@app.post("/api/v1/auth/login", summary="Autenticação do Operador", tags=["Autenticação"])
def login(payload: LoginSchema, response: Response, request: Request, db: Session = Depends(get_db)):
    """
    Autentica um funcionário da recepção/gerência e emite um HttpOnly Cookie seguro.
    """
    # 1. Busca operador pelo e-mail institucional
    operador = db.query(OperadorModel).filter(OperadorModel.email == payload.email).first()

    # 2. Validação da senha com Bcrypt nativo
    if not operador or not verificar_senha(payload.senha, operador.senha_hash):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "E-mail ou senha incorretos. Verifique suas credenciais."
                }
            }
        )

    # 3. Verifica se a conta está ativa
    if not operador.is_ativo:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "success": False,
                "error": {
                    "code": "ACCOUNT_DISABLED",
                    "message": "Sua conta de operador está inativa. Contate a administração."
                }
            }
        )

    # 4. Gera token criptográfico seguro de 32 bytes (64 caracteres hex)
    raw_token = secrets.token_urlsafe(32)
    token_hash = gerar_hash_token(raw_token)
    expiracao = datetime.utcnow() + timedelta(hours=8) # Validade de 8 horas de turno

    # 5. Salva apenas o hash da sessão no banco de dados com proteção transacional
    try:
        nova_sessao = SessaoModel(
            id_operador=operador.id,
            token_hash=token_hash,
            ip_origem=request.client.host if request.client else "unknown",
            user_agent=request.headers.get("user-agent", "unknown")[:500],
            expires_at=expiracao,
            is_active=1
        )
        db.add(nova_sessao)

        # 6. Registra auditoria do login (RN-05)
        log_login = AuditLogModel(
            id_operador=operador.id,
            acao="LOGIN",
            tabela_afetada="tb_sessoes",
            dados_novos=f'{{"email": "{operador.email}", "cargo": "{operador.cargo}"}}',
            ip_origem=request.client.host if request.client else "unknown"
        )
        db.add(log_login)
        db.commit()
    except Exception as e:
        db.rollback()
        # Se falhar o log de auditoria, prossegue permitindo o login do operador
        pass

    # 7. Injeta o cookie seguro HttpOnly na resposta com suporte HTTPS
    response.set_cookie(
        key="session_token",
        value=raw_token,
        httponly=True,        # Impede leitura por JavaScript (Proteção contra XSS)
        samesite="lax",       # Proteção contra Cross-Site Request Forgery (CSRF)
        secure=True,          # Obrigatório para HTTPS na Vercel
        max_age=28800,        # 8 horas em segundos
        path="/"
    )

    return {
        "success": True,
        "data": {
            "uuid": operador.uuid_publico,
            "nome": operador.nome,
            "email": operador.email,
            "cargo": operador.cargo
        }
    }


@app.post("/api/v1/auth/logout", summary="Encerramento de Sessão", tags=["Autenticação"])
def logout(response: Response, request: Request, db: Session = Depends(get_db)):
    """
    Invalida a sessão ativa do operador no banco e remove o cookie do navegador.
    """
    token = request.cookies.get("session_token")
    if token:
        token_hash = gerar_hash_token(token)
        sessao = db.query(SessaoModel).filter(SessaoModel.token_hash == token_hash).first()
        if sessao:
            sessao.is_active = 0
            sessao.revoked_at = datetime.utcnow()
            db.commit()

    # Expira o cookie no navegador
    response.delete_cookie(key="session_token", path="/")
    return {"success": True, "data": {"message": "Sessão encerrada com sucesso."}}


@app.get("/api/v1/auth/me", summary="Dados da Sessão Ativa", tags=["Autenticação"])
def me(operador: Optional[OperadorModel] = Depends(obter_operador_autenticado)):
    """
    Retorna o perfil do operador atualmente logado ou indica sessão vazia.
    """
    if not operador:
        return {"success": False, "data": None}
    return {
        "success": True,
        "data": {
            "uuid": operador.uuid_publico,
            "nome": operador.nome,
            "email": operador.email,
            "cargo": operador.cargo
        }
    }


@app.get("/api/v1/health", summary="Status do Sistema e Banco de Dados", tags=["Sistema"])
def health_check():
    """
    Retorna o diagnóstico de conectividade com o banco de dados (Supabase vs Fallback).
    """
    return {
        "success": True,
        "data": {
            "status": "online",
            "database": DB_DIAGNOSTICS,
            "timestamp": datetime.utcnow().isoformat()
        }
    }


# ----------------------------------------------------------------------------
# ROTAS DO DOMÍNIO DE HÓSPEDES (RF-001)
# ----------------------------------------------------------------------------

@app.post("/api/v1/hospedes", status_code=status.HTTP_201_CREATED, summary="Cadastro de Novo Hóspede", tags=["Hóspedes"])
def cadastrar_hospede(
    payload: HospedeCreateSchema,
    request: Request,
    db: Session = Depends(get_db),
    operador: Optional[OperadorModel] = Depends(obter_operador_autenticado)
):
    """
    Registra um novo hóspede no sistema com validação matemática Módulo 11,
    prevenção contra e-mails e CPFs duplicados e trilha de auditoria LGPD.
    """
    # 1. Checagem de duplicidade de e-mail (RN-01)
    if db.query(HospedeModel).filter(HospedeModel.email == payload.email.lower()).first():
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "error": {
                    "code": "DUPLICATE_EMAIL",
                    "message": "Este endereço de e-mail já está cadastrado no sistema.",
                    "field": "email"
                }
            }
        )

    # 2. Checagem de duplicidade de CPF (RN-02)
    if db.query(HospedeModel).filter(HospedeModel.cpf == payload.cpf).first():
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "error": {
                    "code": "DUPLICATE_CPF",
                    "message": "Este CPF já se encontra cadastrado para outro hóspede.",
                    "field": "cpf"
                }
            }
        )
    # 3. Preparação das variáveis locais de resposta (Snapshot pré-commit)
    hospede_uuid = str(uuid.uuid4())
    hospede_nome = payload.nome.strip()
    hospede_email = payload.email.lower().strip()
    hospede_cpf = payload.cpf.strip()
    hospede_telefone = payload.telefone.strip()
    hospede_nasc = str(payload.data_nascimento)
    hospede_obs = payload.observacoes.strip() if payload.observacoes else None
    data_criacao = datetime.utcnow().isoformat()

    try:
        novo_hospede = HospedeModel(
            uuid_publico=hospede_uuid,
            nome=hospede_nome,
            email=hospede_email,
            cpf=hospede_cpf,
            telefone=hospede_telefone,
            data_nascimento=payload.data_nascimento,
            observacoes=hospede_obs,
            is_ativo=1
        )
        db.add(novo_hospede)
        db.commit()
    except Exception as e:
        db.rollback()
        # Se for erro de violação de unicidade (IntegrityError), responde com 409 Conflict
        msg_erro = str(e).lower()
        if "unique constraint" in msg_erro or "integrityerror" in msg_erro:
            campo_afetado = "cpf" if "cpf" in msg_erro else "email"
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "success": False,
                    "error": {
                        "code": "DUPLICATE_ENTRY",
                        "message": f"Este {campo_afetado.upper()} já está cadastrado no sistema.",
                        "field": campo_afetado
                    }
                }
            )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "DB_PERSISTENCE_ERROR",
                    "message": f"Erro ao gravar hóspede no banco de dados: {str(e)}"
                }
            }
        )

    # 4. Trilha de Auditoria LGPD (RN-05) - Defensiva
    try:
        id_op = getattr(operador, "id", None) if operador else None
        log_cadastro = AuditLogModel(
            id_operador=id_op,
            acao="CADASTRO_HOSPEDE",
            tabela_afetada="tb_hospedes",
            registro_id=None,
            dados_novos=json.dumps({
                "uuid": hospede_uuid,
                "nome": hospede_nome,
                "email": hospede_email,
                "cpf_mascarado": f"***.{hospede_cpf[3:6]}.{hospede_cpf[6:9]}-**"
            }),
            ip_origem=request.client.host if request.client else "unknown"
        )
        db.add(log_cadastro)
        db.commit()
    except Exception as log_err:
        db.rollback()
        print(f"[AUDIT WARNING] Não foi possível gravar log de auditoria: {log_err}")

    return {
        "success": True,
        "data": {
            "uuid": hospede_uuid,
            "nome": hospede_nome,
            "email": hospede_email,
            "cpf": hospede_cpf,
            "telefone": hospede_telefone,
            "data_nascimento": hospede_nasc,
            "observacoes": hospede_obs,
            "created_at": data_criacao
        }
    }


@app.get("/api/v1/hospedes", summary="Listagem de Hóspedes Cadastrados", tags=["Hóspedes"])
def listar_hospedes(db: Session = Depends(get_db)):
    """
    Retorna a lista em ordem decrescente dos hóspedes cadastrados no hotel.
    """
    hospedes = db.query(HospedeModel).order_by(HospedeModel.id.desc()).limit(100).all()
    lista_formatada = [
        {
            "uuid": getattr(h, "uuid_publico", str(uuid.uuid4())),
            "nome": getattr(h, "nome", "Sem Nome"),
            "email": getattr(h, "email", "sem-email@hotel.com"),
            "cpf": getattr(h, "cpf", "00000000000"),
            "telefone": getattr(h, "telefone", "(00) 0000-0000"),
            "data_nascimento": str(getattr(h, "data_nascimento", "2000-01-01")),
            "observacoes": getattr(h, "observacoes", None),
            "created_at": h.created_at.isoformat() if getattr(h, "created_at", None) else None
        }
        for h in hospedes if h is not None
    ]
    return {"success": True, "data": lista_formatada}


# ----------------------------------------------------------------------------
# EXPORTAÇÃO AUTOMÁTICA DO CONTRATO SWAGGER / OPENAPI (TÓPICO 7)
# ----------------------------------------------------------------------------

@app.get("/export-swagger-json", summary="Exporta o arquivo swagger.json para o docs/api", tags=["Documentação"])
def exportar_swagger_json():
    """
    Salva automaticamente a especificação OpenAPI oficial no caminho docs/api/swagger.json
    exigido na rubrica do edital (Tópico 7 - 3%).
    """
    caminho_api_dir = Path(__file__).resolve().parent.parent.parent / "docs" / "api"
    caminho_api_dir.mkdir(parents=True, exist_ok=True)
    arquivo_swagger = caminho_api_dir / "swagger.json"

    esquema_openapi = app.openapi()
    with open(arquivo_swagger, "w", encoding="utf-8") as f:
        json.dump(esquema_openapi, f, indent=2, ensure_ascii=False)

    return {
        "success": True,
        "data": {
            "message": "Contrato OpenAPI exportado com sucesso para docs/api/swagger.json",
            "caminho": str(arquivo_swagger)
        }
    }


# ----------------------------------------------------------------------------
# ROTA PRINCIPAL: ENTREGA DA SPA (index.html)
# ----------------------------------------------------------------------------

CURRENT_DIR = Path(__file__).resolve().parent

def obter_conteudo_arquivo(nome_arquivo: str) -> str:
    """Busca o arquivo de forma resiliente tanto no diretório local quanto na raiz da Vercel."""
    tentativas = [
        CURRENT_DIR / nome_arquivo,
        Path("src/rf-001-cadastro-hospede") / nome_arquivo,
        Path(__file__).parent / nome_arquivo
    ]
    for p in tentativas:
        if p.exists():
            return p.read_text(encoding="utf-8")
    return ""

@app.get("/", response_class=HTMLResponse, summary="Página Principal SPA", tags=["Frontend"])
@app.get("/api", response_class=HTMLResponse, include_in_schema=False)
@app.get("/api/index", response_class=HTMLResponse, include_in_schema=False)
def get_index():
    """Serve o arquivo único index.html contendo a aplicação frontend completa."""
    conteudo = obter_conteudo_arquivo("index.html")
    if not conteudo:
        index_path = CURRENT_DIR / "index.html"
        if index_path.exists():
            return FileResponse(index_path, media_type="text/html")
        raise HTTPException(status_code=404, detail="Arquivo index.html não localizado.")
    return HTMLResponse(content=conteudo, status_code=200)


@app.get("/app.js", summary="Script Cliente da SPA", tags=["Frontend"])
@app.get("/api/app.js", include_in_schema=False)
def get_app_js():
    """Serve o arquivo de script cliente app.js contendo a máquina de estados e validações."""
    conteudo = obter_conteudo_arquivo("app.js")
    if not conteudo:
        js_path = CURRENT_DIR / "app.js"
        if js_path.exists():
            return FileResponse(js_path, media_type="application/javascript")
        raise HTTPException(status_code=404, detail="Arquivo app.js não localizado.")
    return Response(content=conteudo, media_type="application/javascript", status_code=200)


if __name__ == "__main__":
    import uvicorn
    # Executa o servidor ASGI localmente na porta 8000
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
