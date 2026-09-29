"""
APLICAÇÃO PRINCIPAL FASTAPI
Sistema Grand Plaza Hotel Management — RF-003 (Gestão e Cadastro de Usuários do Sistema)
Diretrizes: regras/back.md, regras/DB.md, regras/front.md e OWASP Top 10

Recursos Implementados:
- Middlewares: CORS, Security Headers e Rate Limiting em memória por IP (OWASP API4)
- Autenticação por HttpOnly Cookies com hash SHA-256 da sessão (OWASP A07)
- Controle de Acesso Baseado em Funções (RBAC: ADMIN, GERENTE, FUNCIONARIO)
- Gestão e Cadastro Seguro de Operadores com Bcrypt (12 rounds)
- Soft Delete e Auditoria LGPD em tb_audit_logs
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

CURRENT_MODULE_DIR = str(Path(__file__).resolve().parent)
if CURRENT_MODULE_DIR not in sys.path:
    sys.path.insert(0, CURRENT_MODULE_DIR)

from fastapi import FastAPI, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy import or_
from sqlalchemy.orm import Session

from database import get_db, engine, Base, DB_DIAGNOSTICS
from models import OperadorModel, SessaoModel, HospedeModel, AuditLogModel
from schemas import (
    LoginSchema,
    OperadorCreateSchema,
    OperadorUpdateSchema,
    OperadorStatusSchema,
    OperadorResponseSchema,
    HospedeCreateSchema,
    EnvelopeResponse,
    ErrorDetail
)

import bcrypt

def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """Valida a senha fornecida contra o hash Bcrypt de 12 rounds."""
    try:
        return bcrypt.checkpw(senha_plana.encode("utf-8"), senha_hash.encode("utf-8"))
    except Exception:
        return False

def gerar_hash_senha(senha_plana: str) -> str:
    """Gera hash Bcrypt seguro com 12 rounds de salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(senha_plana.encode("utf-8"), salt).decode("utf-8")

app = FastAPI(
    title="Grand Plaza Hotel Management API — Gestão de Usuários",
    description="API REST corporativa para autenticação, controle de permissões RBAC e gestão segura de operadores do hotel.",
    version="1.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://*.vercel.app",
        "https://*.trycloudflare.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

rate_limit_records = {}

@app.middleware("http")
async def security_and_rate_limit_middleware(request: Request, call_next):
    """Middleware global para injeção de cabeçalhos de proteção e controle de taxa."""
    client_ip = request.client.host if request.client else "unknown"
    agora = datetime.utcnow()

    if client_ip != "127.0.0.1":
        historico = rate_limit_records.get(client_ip, [])
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

    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Intercepta falhas de schema Pydantic e formata no envelope padrão."""
    erros = exc.errors()
    primeiro_erro = erros[0] if erros else {}
    campo = ".".join(str(loc) for loc in primeiro_erro.get("loc", []))
    mensagem = primeiro_erro.get("msg", "Dados de requisição inválidos.")
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
    """Garante que qualquer erro não tratado retorne JSON padronizado."""
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
# FUNÇÕES DE AUTENTICAÇÃO E SESSÃO
# ----------------------------------------------------------------------------

def gerar_hash_token(token: str) -> str:
    """Gera hash SHA-256 do token para armazenamento seguro no banco."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def obter_operador_autenticado(request: Request, db: Session = Depends(get_db)) -> Optional[OperadorModel]:
    """Valida o cookie HttpOnly e recupera o operador com sessão ativa."""
    token = request.cookies.get("session_token")
    if not token:
        return None

    token_hash = gerar_hash_token(token)
    agora = datetime.utcnow()

    sessao = db.query(SessaoModel).filter(
        SessaoModel.token_hash == token_hash,
        SessaoModel.is_active == 1,
        SessaoModel.expires_at > agora
    ).first()

    if not sessao:
        return None

    return sessao.operador

def exigir_admin(operador: Optional[OperadorModel] = Depends(obter_operador_autenticado)) -> OperadorModel:
    """Dependência RBAC que restringe acesso estritamente ao cargo ADMIN."""
    if not operador:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Operação requer autenticação prévia."
        )
    if operador.cargo != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores do sistema possuem permissão para esta ação."
        )
    return operador


# ----------------------------------------------------------------------------
# ROTAS DE AUTENTICAÇÃO
# ----------------------------------------------------------------------------

@app.post("/api/v1/auth/login", summary="Autenticação do Operador", tags=["Autenticação"])
def login(payload: LoginSchema, response: Response, request: Request, db: Session = Depends(get_db)):
    """Autentica o operador, verifica o hash Bcrypt e emite um HttpOnly Cookie."""
    operador = db.query(OperadorModel).filter(OperadorModel.email == payload.email).first()

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

    if not operador.is_ativo:
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "success": False,
                "error": {
                    "code": "ACCOUNT_DISABLED",
                    "message": "Sua conta de usuário está inativa. Contate o Administrador."
                }
            }
        )

    raw_token = secrets.token_urlsafe(32)
    token_hash = gerar_hash_token(raw_token)
    expiracao = datetime.utcnow() + timedelta(hours=8)

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

        log_login = AuditLogModel(
            id_operador=operador.id,
            acao="LOGIN",
            tabela_afetada="tb_sessoes",
            dados_novos=f'{{"email": "{operador.email}", "cargo": "{operador.cargo}"}}',
            ip_origem=request.client.host if request.client else "unknown"
        )
        db.add(log_login)
        db.commit()
    except Exception:
        db.rollback()

    response.set_cookie(
        key="session_token",
        value=raw_token,
        httponly=True,
        samesite="lax",
        secure=True,
        max_age=28800,
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
    """Invalida a sessão ativa no banco de dados e expira o cookie."""
    token = request.cookies.get("session_token")
    if token:
        token_hash = gerar_hash_token(token)
        sessao = db.query(SessaoModel).filter(SessaoModel.token_hash == token_hash).first()
        if sessao:
            sessao.is_active = 0
            sessao.revoked_at = datetime.utcnow()
            db.commit()

    response.delete_cookie(key="session_token", path="/")
    return {"success": True, "data": {"message": "Sessão encerrada com sucesso."}}


@app.get("/api/v1/auth/me", summary="Dados da Sessão Ativa (Para a Topbar)", tags=["Autenticação"])
def me(operador: Optional[OperadorModel] = Depends(obter_operador_autenticado)):
    """Retorna o perfil e nível do operador autenticado para renderização na topbar."""
    if not operador:
        return {"success": False, "data": None}
    return {
        "success": True,
        "data": {
            "uuid": operador.uuid_publico,
            "nome": operador.nome,
            "email": operador.email,
            "cargo": operador.cargo,
            "is_ativo": operador.is_ativo
        }
    }


@app.get("/api/v1/health", summary="Status do Sistema e Diagnóstico do Banco de Dados", tags=["Sistema"])
def health_check():
    """
    Retorna o diagnóstico de conectividade com o banco de dados (Supabase PostgreSQL vs Fallback).
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
# ROTAS DE GESTÃO DE OPERADORES / USUÁRIOS (RF-003)
# ----------------------------------------------------------------------------

@app.post("/api/v1/operadores", status_code=status.HTTP_201_CREATED, summary="Cadastro de Novo Operador do Sistema", tags=["Usuários do Sistema"])
def cadastrar_operador(
    payload: OperadorCreateSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin_logado: OperadorModel = Depends(exigir_admin)
):
    """
    Cadastra um novo usuário do sistema com nível hierárquico (ADMIN, GERENTE, FUNCIONARIO).
    Acesso restrito ao Administrador.
    """
    email_normalizado = payload.email.lower().strip()

    # 1. Checagem de unicidade do e-mail
    if db.query(OperadorModel).filter(OperadorModel.email == email_normalizado).first():
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "error": {
                    "code": "DUPLICATE_EMAIL",
                    "message": "Este endereço de e-mail já pertence a outro usuário cadastrado.",
                    "field": "email"
                }
            }
        )

    # 2. Criptografia segura da senha com Bcrypt
    senha_hash = gerar_hash_senha(payload.senha)
    novo_uuid = str(uuid.uuid4())

    try:
        novo_operador = OperadorModel(
            uuid_publico=novo_uuid,
            nome=payload.nome.strip(),
            email=email_normalizado,
            senha_hash=senha_hash,
            cargo=payload.cargo.value,
            is_ativo=1
        )
        db.add(novo_operador)
        db.commit()
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "DB_PERSISTENCE_ERROR",
                    "message": f"Erro ao persistir operador no banco de dados: {str(e)}"
                }
            }
        )

    # 3. Trilha de Auditoria LGPD
    try:
        log_audit = AuditLogModel(
            id_operador=admin_logado.id,
            acao="CADASTRO_OPERADOR",
            tabela_afetada="tb_operadores",
            registro_id=novo_operador.id,
            dados_novos=json.dumps({
                "uuid": novo_uuid,
                "nome": novo_operador.nome,
                "email": novo_operador.email,
                "cargo": novo_operador.cargo
            }),
            ip_origem=request.client.host if request.client else "unknown"
        )
        db.add(log_audit)
        db.commit()
    except Exception as log_err:
        db.rollback()
        print(f"[AUDIT WARNING] Falha no log de auditoria: {log_err}")

    return {
        "success": True,
        "data": {
            "uuid": novo_uuid,
            "nome": novo_operador.nome,
            "email": novo_operador.email,
            "cargo": novo_operador.cargo,
            "is_ativo": novo_operador.is_ativo,
            "created_at": datetime.utcnow().isoformat()
        }
    }


@app.get("/api/v1/operadores", summary="Listagem de Usuários do Sistema", tags=["Usuários do Sistema"])
def listar_operadores(
    q: Optional[str] = None,
    cargo: Optional[str] = None,
    status_filtro: Optional[str] = None,
    db: Session = Depends(get_db),
    operador_logado: Optional[OperadorModel] = Depends(obter_operador_autenticado)
):
    """
    Retorna a lista de colaboradores e operadores cadastrados no sistema com filtros.
    """
    query = db.query(OperadorModel)

    if cargo and cargo.strip():
        query = query.filter(OperadorModel.cargo == cargo.upper().strip())

    if status_filtro == "ativos":
        query = query.filter(OperadorModel.is_ativo == 1)
    elif status_filtro == "inativos":
        query = query.filter(OperadorModel.is_ativo == 0)

    if q and q.strip():
        termo = f"%{q.strip()}%"
        query = query.filter(or_(
            OperadorModel.nome.ilike(termo),
            OperadorModel.email.ilike(termo)
        ))

    operadores = query.order_by(OperadorModel.id.desc()).all()

    # Consulta em tempo real quais operadores possuem sessão ativa válida (OWASP Presence Detection)
    agora = datetime.utcnow()
    sessoes_ativas = db.query(SessaoModel.id_operador).filter(
        SessaoModel.is_active == 1,
        SessaoModel.expires_at > agora
    ).all()
    ids_online = {s[0] for s in sessoes_ativas}

    lista = [
        {
            "uuid": op.uuid_publico,
            "nome": op.nome,
            "email": op.email,
            "cargo": op.cargo,
            "is_ativo": op.is_ativo,
            "is_online": op.id in ids_online,
            "created_at": op.created_at.isoformat() if op.created_at else None,
            "updated_at": op.updated_at.isoformat() if op.updated_at else None
        }
        for op in operadores
    ]

    return {"success": True, "data": lista}


@app.put("/api/v1/operadores/{operador_uuid}", summary="Atualização Cadastral de Operador", tags=["Usuários do Sistema"])
def atualizar_operador(
    operador_uuid: str,
    payload: OperadorUpdateSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin_logado: OperadorModel = Depends(exigir_admin)
):
    """
    Atualiza dados do operador (Nome, E-mail, Cargo e opcionalmente nova Senha).
    Acesso restrito ao Administrador.
    """
    op = db.query(OperadorModel).filter(OperadorModel.uuid_publico == operador_uuid).first()
    if not op:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "error": {
                    "code": "OPERADOR_NOT_FOUND",
                    "message": "Usuário não localizado para atualização."
                }
            }
        )

    novo_email = payload.email.lower().strip()
    if novo_email != op.email:
        existente = db.query(OperadorModel).filter(
            OperadorModel.email == novo_email,
            OperadorModel.id != op.id
        ).first()
        if existente:
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "success": False,
                    "error": {
                        "code": "DUPLICATE_EMAIL",
                        "message": "Este endereço de e-mail já pertence a outro usuário cadastrado.",
                        "field": "email"
                    }
                }
            )

    # Captura dados anteriores para auditoria
    dados_anteriores = {
        "nome": op.nome,
        "email": op.email,
        "cargo": op.cargo
    }

    op.nome = payload.nome.strip()
    op.email = novo_email
    op.cargo = payload.cargo.value
    
    # Se uma nova senha for fornecida, atualiza com hash Bcrypt
    if payload.senha and payload.senha.strip():
        op.senha_hash = gerar_hash_senha(payload.senha)

    op.updated_at = datetime.utcnow()

    try:
        log_audit = AuditLogModel(
            id_operador=admin_logado.id,
            acao="EDICAO_OPERADOR",
            tabela_afetada="tb_operadores",
            registro_id=op.id,
            dados_novos=json.dumps({
                "uuid": op.uuid_publico,
                "alterado_por": admin_logado.email,
                "de": dados_anteriores,
                "para": {
                    "nome": op.nome,
                    "email": op.email,
                    "cargo": op.cargo,
                    "senha_alterada": bool(payload.senha)
                }
            }),
            ip_origem=request.client.host if request.client else "unknown"
        )
        db.add(log_audit)
        db.commit()
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "DB_PERSISTENCE_ERROR",
                    "message": f"Erro ao atualizar operador no banco de dados: {str(e)}"
                }
            }
        )

    return {
        "success": True,
        "data": {
            "uuid": op.uuid_publico,
            "nome": op.nome,
            "email": op.email,
            "cargo": op.cargo,
            "is_ativo": op.is_ativo,
            "message": "Dados do operador atualizados com sucesso."
        }
    }


@app.patch("/api/v1/operadores/{operador_uuid}/status", summary="Alternar Status de Operador (Soft Delete)", tags=["Usuários do Sistema"])
def alternar_status_operador(
    operador_uuid: str,
    payload: OperadorStatusSchema,
    request: Request,
    db: Session = Depends(get_db),
    admin_logado: OperadorModel = Depends(exigir_admin)
):
    """
    Ativa ou desativa a conta de um operador de forma lógica.
    Acesso restrito ao Administrador.
    """
    op = db.query(OperadorModel).filter(OperadorModel.uuid_publico == operador_uuid).first()
    if not op:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "error": {
                    "code": "OPERADOR_NOT_FOUND",
                    "message": "Usuário não localizado."
                }
            }
        )

    # Impede que o próprio admin se auto-desative
    if op.id == admin_logado.id and payload.is_ativo == 0:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": {
                    "code": "SELF_DEACTIVATION_FORBIDDEN",
                    "message": "Não é permitido desativar a própria conta de administrador em uso."
                }
            }
        )

    status_anterior = op.is_ativo
    op.is_ativo = payload.is_ativo
    op.updated_at = datetime.utcnow()

    try:
        log_audit = AuditLogModel(
            id_operador=admin_logado.id,
            acao="STATUS_OPERADOR",
            tabela_afetada="tb_operadores",
            registro_id=op.id,
            dados_novos=json.dumps({
                "uuid": op.uuid_publico,
                "status_anterior": status_anterior,
                "status_novo": payload.is_ativo
            }),
            ip_origem=request.client.host if request.client else "unknown"
        )
        db.add(log_audit)
        db.commit()
    except Exception as e:
        db.rollback()
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "DB_PERSISTENCE_ERROR",
                    "message": f"Erro ao alternar status do usuário: {str(e)}"
                }
            }
        )

    return {
        "success": True,
        "data": {
            "uuid": op.uuid_publico,
            "nome": op.nome,
            "cargo": op.cargo,
            "is_ativo": op.is_ativo,
            "message": f"Usuário {'reativado' if payload.is_ativo == 1 else 'desativado'} com sucesso."
        }
    }


# ----------------------------------------------------------------------------
# ROTAS COMPATÍVEIS PARA HÓSPEDES (RF-001 E RF-002 INTEGRADOS)
# ----------------------------------------------------------------------------

@app.get("/api/v1/hospedes", summary="Listagem de Hóspedes", tags=["Hóspedes"])
def listar_hospedes(db: Session = Depends(get_db)):
    hospedes = db.query(HospedeModel).order_by(HospedeModel.id.desc()).limit(100).all()
    lista = [
        {
            "uuid": h.uuid_publico,
            "nome": h.nome,
            "email": h.email,
            "cpf": h.cpf,
            "telefone": h.telefone,
            "data_nascimento": str(h.data_nascimento),
            "is_ativo": h.is_ativo
        }
        for h in hospedes
    ]
    return {"success": True, "data": lista}


# ----------------------------------------------------------------------------
# EXPORTAÇÃO AUTOMÁTICA DO CONTRATO OPENAPI (TÓPICO 7)
# ----------------------------------------------------------------------------

@app.get("/export-swagger-json", summary="Exporta o contrato OpenAPI para docs/api/swagger.json", tags=["Documentação"])
def exportar_swagger_json():
    """Gera o arquivo docs/api/swagger.json com todos os endpoints do RF-003."""
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
    tentativas = [
        CURRENT_DIR / nome_arquivo,
        Path("src/rf-003-cadastro-usuario") / nome_arquivo,
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
    conteudo = obter_conteudo_arquivo("app.js")
    if not conteudo:
        js_path = CURRENT_DIR / "app.js"
        if js_path.exists():
            return FileResponse(js_path, media_type="application/javascript")
        raise HTTPException(status_code=404, detail="Arquivo app.js não localizado.")
    return Response(content=conteudo, media_type="application/javascript", status_code=200)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
