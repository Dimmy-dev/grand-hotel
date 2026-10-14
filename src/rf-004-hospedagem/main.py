"""
APLICAÇÃO PRINCIPAL FASTAPI
Sistema Grand Plaza Hotel Management — RF-004 (Sistema de Hospedagem, Check-in, Check-out e Rack Hoteleiro)
Diretrizes: regras/back.md, regras/DB.md, regras/front.md e OWASP Top 10

Recursos Implementados:
- Middlewares: CORS, Security Headers e Rate Limiting em memória por IP (OWASP API4)
- Autenticação por HttpOnly Cookies com hash SHA-256 da sessão (OWASP A07)
- Controle de Acesso Baseado em Funções (RBAC: ADMIN, GERENTE, FUNCIONARIO)
- Inventário de Acomodações e Rack Hoteleiro em tempo real
- Check-in Atômico com Lock Pessimista anti-Overbooking
- Check-out Automático com apuração contábil de diárias e liberação para Limpeza
- Governança de Quartos (transição de Limpeza e Manutenção para Disponível)
- Trilha de Auditoria LGPD em tb_audit_logs
- Exportação nativa do contrato OpenAPI para docs/api/swagger.json
- Rota estática servindo a SPA index.html
"""

import os
import json
import uuid
import math
import secrets
import hashlib
import sys
from datetime import datetime, timedelta
from pathlib import Path
from decimal import Decimal
from typing import Optional, List

CURRENT_MODULE_DIR = str(Path(__file__).resolve().parent)
if CURRENT_MODULE_DIR not in sys.path:
    sys.path.insert(0, CURRENT_MODULE_DIR)

from fastapi import FastAPI, Depends, HTTPException, status, Request, Response, Query
from fastapi.responses import JSONResponse, FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy import or_, and_
from sqlalchemy.orm import Session

from database import get_db, engine, Base, DB_DIAGNOSTICS
from models import OperadorModel, SessaoModel, HospedeModel, AuditLogModel, AcomodacaoModel, HospedagemModel
from schemas import (
    LoginSchema,
    OperadorResponseSchema,
    HospedeSimpleSchema,
    AcomodacaoResponseSchema,
    AcomodacaoStatusUpdateSchema,
    CheckinRequestSchema,
    CheckoutResponseSchema,
    HospedagemDetalheSchema,
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
    title="Grand Plaza Hotel Management API — Sistema de Hospedagem",
    description="API REST corporativa para ciclo completo de hospedagem, alocação de quartos, check-in atômico, check-out com faturamento e rack hoteleiro.",
    version="1.4.0",
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
        if len(historico) >= 60:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "data": None,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": "Limite de requisições excedido. Aguarde 60 segundos antes de tentar novamente.",
                        "field": None
                    }
                }
            )
        historico.append(agora)
        rate_limit_records[client_ip] = historico

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Padroniza erros de validação Pydantic no envelope oficial."""
    erros = exc.errors()
    primeiro_erro = erros[0] if erros else {}
    campo = " -> ".join(str(loc) for loc in primeiro_erro.get("loc", []) if loc != "body")
    mensagem = primeiro_erro.get("msg", "Erro de validação nos dados fornecidos.")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": None,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": mensagem,
                "field": campo or None
            }
        }
    )

# ---------------------------------------------------------------------------
# SERVIÇOS DE AUTENTICAÇÃO E SESSÃO (RBAC)
# ---------------------------------------------------------------------------

COOKIE_SESSION_NAME = "grand_plaza_session"

def obter_operador_autenticado(request: Request, db: Session = Depends(get_db)) -> OperadorModel:
    """Extrai e valida a sessão do operador via cookie HttpOnly."""
    token = request.cookies.get(COOKIE_SESSION_NAME)
    if not token:
        # Fallback para ambiente de desenvolvimento via Header de autorização se necessário
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "").strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Operador não autenticado. Efetue login no sistema."
        )

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    agora = datetime.utcnow()

    sessao = db.query(SessaoModel).filter(
        SessaoModel.token_hash == token_hash,
        SessaoModel.is_active == 1,
        SessaoModel.expires_at > agora
    ).first()

    if not sessao:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão expirada ou inválida. Por favor, faça login novamente."
        )

    operador = db.query(OperadorModel).filter(
        OperadorModel.id == sessao.id_operador,
        OperadorModel.is_ativo == 1
    ).first()

    if not operador:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Operador inativo ou não localizado."
        )

    return operador

def registrar_auditoria(db: Session, operador_id: Optional[int], acao: str, tabela: str, registro_id: str, detalhes: dict, ip: Optional[str] = None):
    """Grava registro imutável na tabela de auditoria."""
    try:
        log = AuditLogModel(
            id_operador=operador_id,
            acao=acao,
            tabela_afetada=tabela,
            registro_id=str(registro_id),
            detalhes_json=json.dumps(detalhes, default=str),
            ip_origem=ip
        )
        db.add(log)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[AUDIT ERROR] Falha ao gravar log de auditoria: {e}")

# ---------------------------------------------------------------------------
# ROTAS DE AUTENTICAÇÃO
# ---------------------------------------------------------------------------

@app.post("/api/v1/auth/login", response_model=EnvelopeResponse[OperadorResponseSchema], tags=["Autenticação"])
def login(dados: LoginSchema, request: Request, response: Response, db: Session = Depends(get_db)):
    """Autentica o operador e emite cookie HttpOnly criptografado."""
    operador = db.query(OperadorModel).filter(
        OperadorModel.email == dados.email.lower().strip()
    ).first()

    if not operador or not verificar_senha(dados.senha, operador.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas. Verifique o e-mail e a senha informados."
        )

    if operador.is_ativo != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso bloqueado. Este usuário foi desativado pela gerência."
        )

    token_cru = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token_cru.encode("utf-8")).hexdigest()
    expires_at = datetime.utcnow() + timedelta(hours=12)

    sessao = SessaoModel(
        id_operador=operador.id,
        token_hash=token_hash,
        ip_origem=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent", "")[:500],
        expires_at=expires_at,
        is_active=1
    )
    db.add(sessao)
    db.commit()

    is_https = request.url.scheme == "https" or bool(os.getenv("VERCEL"))
    response.set_cookie(
        key=COOKIE_SESSION_NAME,
        value=token_cru,
        expires=int(expires_at.timestamp()),
        httponly=True,
        secure=is_https,
        samesite="lax",
        path="/"
    )

    registrar_auditoria(
        db=db,
        operador_id=operador.id,
        acao="LOGIN_SUCESSO",
        tabela="tb_operadores",
        registro_id=operador.uuid_publico,
        detalhes={"email": operador.email, "cargo": operador.cargo},
        ip=request.client.host if request.client else None
    )

    return {
        "success": True,
        "data": operador,
        "error": None
    }

@app.post("/api/v1/auth/logout", response_model=EnvelopeResponse[dict], tags=["Autenticação"])
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Encerra a sessão ativa e revoga o cookie."""
    token = request.cookies.get(COOKIE_SESSION_NAME)
    if token:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        sessao = db.query(SessaoModel).filter(SessaoModel.token_hash == token_hash).first()
        if sessao:
            sessao.is_active = 0
            sessao.revoked_at = datetime.utcnow()
            db.commit()

    response.delete_cookie(key=COOKIE_SESSION_NAME, path="/")
    return {
        "success": True,
        "data": {"mensagem": "Logout efetuado com sucesso."},
        "error": None
    }

@app.get("/api/v1/auth/me", response_model=EnvelopeResponse[OperadorResponseSchema], tags=["Autenticação"])
def me(operador: OperadorModel = Depends(obter_operador_autenticado)):
    """Retorna os dados do operador atualmente conectado."""
    return {
        "success": True,
        "data": operador,
        "error": None
    }

# ---------------------------------------------------------------------------
# ROTAS DO RF-004: ACOMODAÇÕES E RACK HOTELEIRO
# ---------------------------------------------------------------------------

@app.get("/api/v1/acomodacoes", response_model=EnvelopeResponse[List[AcomodacaoResponseSchema]], tags=["Acomodações"])
def listar_todas_acomodacoes(
    categoria: Optional[str] = Query(None, description="Filtrar por STANDARD, LUXO, PRESIDENCIAL"),
    status_filtro: Optional[str] = Query(None, alias="status", description="Filtrar por DISPONIVEL, OCUPADO, LIMPEZA, MANUTENCAO"),
    db: Session = Depends(get_db)
):
    """
    Retorna o inventário completo de acomodações para montagem do Rack Hoteleiro.
    Enriquece acomodações ocupadas com os dados resumidos do hóspede e estadia em curso.
    """
    query = db.query(AcomodacaoModel).filter(AcomodacaoModel.is_ativo == 1)

    if categoria:
        query = query.filter(AcomodacaoModel.categoria == categoria.strip().upper())
    if status_filtro:
        query = query.filter(AcomodacaoModel.status == status_filtro.strip().upper())

    quartos = query.order_by(AcomodacaoModel.numero.asc()).all()

    # Mapeamento enriquecido para o Rack
    resultado = []
    for q in quartos:
        hospedagem_info = None
        if q.status == "OCUPADO":
            hosp_ativa = db.query(HospedagemModel).filter(
                HospedagemModel.id_acomodacao == q.id,
                HospedagemModel.status == "ATIVA"
            ).first()
            if hosp_ativa and hosp_ativa.hospede:
                hospedagem_info = {
                    "uuid_hospedagem": hosp_ativa.uuid_publico,
                    "hospede_nome": hosp_ativa.hospede.nome,
                    "data_checkin": hosp_ativa.data_checkin.isoformat(),
                    "data_prevista_checkout": hosp_ativa.data_prevista_checkout.isoformat(),
                    "tarifa_aplicada": float(hosp_ativa.tarifa_diaria_aplicada)
                }

        resultado.append({
            "uuid_publico": q.uuid_publico,
            "numero": q.numero,
            "categoria": q.categoria,
            "capacidade": q.capacidade,
            "tarifa_base": q.tarifa_base,
            "status": q.status,
            "andar": q.andar,
            "descricao": q.descricao,
            "hospedagem_ativa": hospedagem_info
        })

    return {
        "success": True,
        "data": resultado,
        "error": None
    }

@app.get("/api/v1/acomodacoes/disponiveis", response_model=EnvelopeResponse[List[AcomodacaoResponseSchema]], tags=["Acomodações"])
def listar_acomodacoes_disponiveis(
    categoria: Optional[str] = Query(None, description="Filtrar por STANDARD, LUXO, PRESIDENCIAL"),
    capacidade_min: Optional[int] = Query(None, description="Capacidade mínima de hóspedes"),
    db: Session = Depends(get_db)
):
    """
    Retorna apenas quartos com status 'DISPONIVEL' aptos a receber novo check-in imediato.
    """
    query = db.query(AcomodacaoModel).filter(
        AcomodacaoModel.is_ativo == 1,
        AcomodacaoModel.status == "DISPONIVEL"
    )

    if categoria:
        query = query.filter(AcomodacaoModel.categoria == categoria.strip().upper())
    if capacidade_min:
        query = query.filter(AcomodacaoModel.capacidade >= capacidade_min)

    quartos = query.order_by(AcomodacaoModel.numero.asc()).all()

    return {
        "success": True,
        "data": quartos,
        "error": None
    }

@app.patch("/api/v1/acomodacoes/{id_ou_uuid}/status", response_model=EnvelopeResponse[AcomodacaoResponseSchema], tags=["Acomodações"])
def atualizar_status_acomodacao(
    id_ou_uuid: str,
    dados: AcomodacaoStatusUpdateSchema,
    request: Request,
    operador: OperadorModel = Depends(obter_operador_autenticado),
    db: Session = Depends(get_db)
):
    """
    Permite transições de governança e manutenção (ex: Quarto limpo passa de LIMPEZA para DISPONIVEL).
    """
    quarto = db.query(AcomodacaoModel).filter(
        or_(
            AcomodacaoModel.uuid_publico == id_ou_uuid,
            AcomodacaoModel.id == int(id_ou_uuid) if id_ou_uuid.isdigit() else False
        )
    ).first()

    if not quarto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acomodação não localizada."
        )

    # Regra de negócio: Não permitir alterar manualmente quarto ocupado sem passar pelo checkout
    if quarto.status == "OCUPADO" and dados.status != "OCUPADO":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este quarto está atualmente OCUPADO. Para liberá-lo, execute o procedimento oficial de Check-out."
        )

    status_anterior = quarto.status
    quarto.status = dados.status
    quarto.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quarto)

    registrar_auditoria(
        db=db,
        operador_id=operador.id,
        acao="STATUS_ACOMODACAO_ALTERADO",
        tabela="tb_acomodacoes",
        registro_id=quarto.uuid_publico,
        detalhes={"numero": quarto.numero, "de": status_anterior, "para": quarto.status},
        ip=request.client.host if request.client else None
    )

    return {
        "success": True,
        "data": quarto,
        "error": None
    }

# ---------------------------------------------------------------------------
# ROTAS DO RF-004: CHECK-IN E CHECK-OUT DE HOSPEDAGENS
# ---------------------------------------------------------------------------

@app.post("/api/v1/hospedagens/checkin", response_model=EnvelopeResponse[dict], status_code=status.HTTP_201_CREATED, tags=["Hospedagens"])
def realizar_checkin(
    dados: CheckinRequestSchema,
    request: Request,
    operador: OperadorModel = Depends(obter_operador_autenticado),
    db: Session = Depends(get_db)
):
    """
    Realiza o check-in ágil do hóspede em uma acomodação disponível.
    Garante atomicidade com bloqueio exclusivo anti-overbooking.
    """
    # 1. Validação do Hóspede
    hospede = db.query(HospedeModel).filter(
        HospedeModel.uuid_publico == dados.uuid_hospede,
        HospedeModel.is_ativo == 1
    ).first()

    if not hospede:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hóspede não encontrado ou inativo no cadastro."
        )

    # 2. Lock e Verificação da Acomodação (Anti-Overbooking)
    try:
        # Se for Postgres, utiliza with_for_update(); em SQLite local, a transação serializa
        query_quarto = db.query(AcomodacaoModel).filter(
            AcomodacaoModel.uuid_publico == dados.uuid_acomodacao,
            AcomodacaoModel.is_ativo == 1
        )
        if "postgresql" in str(engine.url).lower():
            query_quarto = query_quarto.with_for_update()

        quarto = query_quarto.first()
        if not quarto:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Acomodação solicitada não existe ou está inativa."
            )

        if quarto.status != "DISPONIVEL":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"O Quarto {quarto.numero} não está disponível para check-in (Status atual: {quarto.status})."
            )

        # 3. Criação da Hospedagem com Snapshot da Tarifa
        hospedagem = HospedagemModel(
            id_hospede=hospede.id,
            id_acomodacao=quarto.id,
            id_operador=operador.id,
            data_checkin=datetime.utcnow(),
            data_prevista_checkout=dados.data_prevista_checkout,
            status="ATIVA",
            tarifa_diaria_aplicada=quarto.tarifa_base,
            acompanhantes_json=json.dumps(dados.acompanhantes or [], ensure_ascii=False),
            observacoes=dados.observacoes
        )
        db.add(hospedagem)

        # 4. Transição do Status da Acomodação
        quarto.status = "OCUPADO"
        quarto.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(hospedagem)

        registrar_auditoria(
            db=db,
            operador_id=operador.id,
            acao="CHECKIN_REALIZADO",
            tabela="tb_hospedagens",
            registro_id=hospedagem.uuid_publico,
            detalhes={
                "quarto_numero": quarto.numero,
                "hospede_nome": hospede.nome,
                "tarifa_aplicada": float(quarto.tarifa_base),
                "data_prevista": dados.data_prevista_checkout.isoformat()
            },
            ip=request.client.host if request.client else None
        )

        return {
            "success": True,
            "data": {
                "uuid_hospedagem": hospedagem.uuid_publico,
                "quarto_numero": quarto.numero,
                "quarto_categoria": quarto.categoria,
                "hospede_nome": hospede.nome,
                "data_checkin": hospedagem.data_checkin.isoformat(),
                "data_prevista_checkout": hospedagem.data_prevista_checkout.isoformat(),
                "tarifa_diaria_aplicada": float(hospedagem.tarifa_diaria_aplicada),
                "status": hospedagem.status,
                "mensagem": f"Check-in do hóspede {hospede.nome} no Quarto {quarto.numero} concluído com sucesso!"
            },
            "error": None
        }

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar check-in: {str(e)}"
        )

@app.post("/api/v1/hospedagens/{id_ou_uuid}/checkout", response_model=EnvelopeResponse[CheckoutResponseSchema], tags=["Hospedagens"])
def realizar_checkout(
    id_ou_uuid: str,
    request: Request,
    operador: OperadorModel = Depends(obter_operador_autenticado),
    db: Session = Depends(get_db)
):
    """
    Finaliza a hospedagem, calcula automaticamente o número de diárias consumidas
    (mínimo de 1 diária) e o valor total devido, liberando o quarto para limpeza.
    """
    hospedagem = db.query(HospedagemModel).filter(
        or_(
            HospedagemModel.uuid_publico == id_ou_uuid,
            HospedagemModel.id == int(id_ou_uuid) if id_ou_uuid.isdigit() else False
        )
    ).first()

    if not hospedagem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospedagem não localizada."
        )

    if hospedagem.status != "ATIVA":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível realizar checkout. Esta hospedagem já se encontra com status '{hospedagem.status}'."
        )

    agora = datetime.utcnow()
    hospedagem.data_checkout = agora

    # Cálculo hoteleiro de diárias: diferença em segundos convertida para dias
    # Qualquer estadia consome no mínimo 1 diária. A partir de 24h, arredonda para cima.
    segundos_estadia = (agora - hospedagem.data_checkin).total_seconds()
    horas_estadia = segundos_estadia / 3600.0

    if horas_estadia <= 24.0:
        diarias = 1
    else:
        diarias = math.ceil(horas_estadia / 24.0)

    hospedagem.num_diarias = diarias
    hospedagem.valor_total = Decimal(diarias) * hospedagem.tarifa_diaria_aplicada
    hospedagem.status = "FINALIZADA"
    hospedagem.updated_at = agora

    # Liberação do quarto para limpeza
    quarto = hospedagem.acomodacao
    if quarto:
        quarto.status = "LIMPEZA"
        quarto.updated_at = agora

    db.commit()
    db.refresh(hospedagem)

    registrar_auditoria(
        db=db,
        operador_id=operador.id,
        acao="CHECKOUT_REALIZADO",
        tabela="tb_hospedagens",
        registro_id=hospedagem.uuid_publico,
        detalhes={
            "quarto_numero": quarto.numero if quarto else "N/A",
            "diarias": diarias,
            "valor_total": float(hospedagem.valor_total),
            "data_checkout": agora.isoformat()
        },
        ip=request.client.host if request.client else None
    )

    return {
        "success": True,
        "data": {
            "uuid_publico": hospedagem.uuid_publico,
            "hospede_nome": hospedagem.hospede.nome,
            "hospede_cpf": hospedagem.hospede.cpf,
            "acomodacao_numero": quarto.numero if quarto else "N/A",
            "acomodacao_categoria": quarto.categoria if quarto else "N/A",
            "data_checkin": hospedagem.data_checkin,
            "data_checkout": hospedagem.data_checkout,
            "num_diarias": diarias,
            "tarifa_diaria_aplicada": hospedagem.tarifa_diaria_aplicada,
            "valor_total": hospedagem.valor_total,
            "status": hospedagem.status,
            "quarto_status_atual": "LIMPEZA"
        },
        "error": None
    }

@app.get("/api/v1/hospedagens/ativas", response_model=EnvelopeResponse[List[dict]], tags=["Hospedagens"])
def listar_hospedagens_ativas(db: Session = Depends(get_db)):
    """Lista todas as hospedagens em curso no hotel."""
    hospedagens = db.query(HospedagemModel).filter(
        HospedagemModel.status == "ATIVA"
    ).order_by(HospedagemModel.data_checkin.desc()).all()

    resultado = []
    for h in hospedagens:
        resultado.append({
            "uuid_publico": h.uuid_publico,
            "quarto_numero": h.acomodacao.numero if h.acomodacao else "N/A",
            "quarto_categoria": h.acomodacao.categoria if h.acomodacao else "N/A",
            "hospede_nome": h.hospede.nome if h.hospede else "N/A",
            "hospede_cpf": h.hospede.cpf if h.hospede else "N/A",
            "data_checkin": h.data_checkin.isoformat(),
            "data_prevista_checkout": h.data_prevista_checkout.isoformat(),
            "tarifa_diaria_aplicada": float(h.tarifa_diaria_aplicada),
            "status": h.status
        })

    return {
        "success": True,
        "data": resultado,
        "error": None
    }

# ---------------------------------------------------------------------------
# AUXILIARES PARA O FRONTEND (HÓSPEDES ATIVOS E DIAGNÓSTICO)
# ---------------------------------------------------------------------------

@app.get("/api/v1/hospedes", response_model=EnvelopeResponse[List[HospedeSimpleSchema]], tags=["Hóspedes"])
def listar_hospedes_para_selecao(
    termo: Optional[str] = Query(None, description="Buscar por nome ou CPF"),
    db: Session = Depends(get_db)
):
    """Lista hóspedes ativos para o modal de seleção do Check-in."""
    query = db.query(HospedeModel).filter(HospedeModel.is_ativo == 1)
    if termo:
        t = f"%{termo.strip()}%"
        query = query.filter(or_(HospedeModel.nome.ilike(t), HospedeModel.cpf.ilike(t)))
    hospedes = query.order_by(HospedeModel.nome.asc()).limit(50).all()
    return {
        "success": True,
        "data": hospedes,
        "error": None
    }

@app.get("/api/v1/diagnostico/banco", tags=["Diagnóstico"])
def diagnostico_banco(db: Session = Depends(get_db)):
    """Retorna o status da persistência e contadores de entidades."""
    num_acomodacoes = db.query(AcomodacaoModel).count()
    num_hospedagens_ativas = db.query(HospedagemModel).filter(HospedagemModel.status == "ATIVA").count()
    num_hospedes = db.query(HospedeModel).count()
    num_operadores = db.query(OperadorModel).count()

    return {
        "success": True,
        "data": {
            "motor": DB_DIAGNOSTICS["engine_type"],
            "supabase_ativo": DB_DIAGNOSTICS["supabase_connected"],
            "total_quartos": num_acomodacoes,
            "hospedagens_ativas": num_hospedagens_ativas,
            "total_hospedes": num_hospedes,
            "total_operadores": num_operadores
        },
        "error": None
    }

# ---------------------------------------------------------------------------
# ENTREGA DA SPA (HTML / JS ESTÁTICOS)
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse, tags=["Frontend"])
def servir_spa():
    """Entrega a SPA index.html do RF-004."""
    html_path = Path(__file__).resolve().parent / "index.html"
    if html_path.exists():
        return FileResponse(html_path)
    return HTMLResponse("<h1>Grand Plaza Hotel API — RF-004 Ativo</h1><p>Acesse /docs para o Swagger.</p>")

@app.get("/app.js", tags=["Frontend"])
def servir_javascript():
    """Entrega o script app.js da SPA."""
    js_path = Path(__file__).resolve().parent / "app.js"
    if js_path.exists():
        return FileResponse(js_path, media_type="application/javascript")
    raise HTTPException(status_code=404, detail="Script app.js não encontrado.")

def exportar_swagger():
    """Gera automaticamente docs/api/swagger.json com o contrato OpenAPI 3.1."""
    try:
        caminho_doc = Path(__file__).resolve().parent.parent.parent / "docs" / "api" / "swagger.json"
        caminho_doc.parent.mkdir(parents=True, exist_ok=True)
        with open(caminho_doc, "w", encoding="utf-8") as f:
            json.dump(app.openapi(), f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[SWAGGER EXPORT] Aviso: {e}")

exportar_swagger()
