"""
PONTO DE ENTRADA SERVERLESS PARA A VERCEL (ADAPTER PATTERN)
Sistema Grand Plaza Hotel Management — RF-001

Este adaptador normaliza o caminho da requisição no ambiente serverless
da Vercel antes de despachar para a aplicação FastAPI oficial.
"""

import sys
import os

# Resolução de diretórios absolutos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src", "rf-001-cadastro-hospede")

if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

from main import app as fastapi_app

async def app(scope, receive, send):
    """
    ASGI Wrapper para a Vercel.
    Normaliza scope['path'] recuperando a rota real enviada pelo cliente.
    """
    if scope["type"] == "http":
        headers = dict(scope.get("headers", []))
        
        # A Vercel envia o caminho original no header x-matched-path ou x-forwarded-uri
        matched_path = headers.get(b"x-matched-path", b"").decode("utf-8")
        forwarded_uri = headers.get(b"x-forwarded-uri", b"").decode("utf-8")
        
        caminho_real = matched_path or forwarded_uri
        
        # Se a Vercel enviou o path reescrito como '/api/index.py' ou '/api/index',
        # restaura o path original da requisição
        if caminho_real:
            scope["path"] = caminho_real
        elif scope.get("path") in ("/api/index.py", "/api/index"):
            scope["path"] = "/"

    await fastapi_app(scope, receive, send)
