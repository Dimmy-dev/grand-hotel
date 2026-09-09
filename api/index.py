"""
PONTO DE ENTRADA SERVERLESS PARA A VERCEL (ADAPTER PATTERN)
Sistema Grand Plaza Hotel Management — RF-001

Este script expõe a instância ASGI 'app' do FastAPI localizada em
src/rf-001-cadastro-hospede/main.py, garantindo a resolução correta de caminhos
no ambiente serverless da Vercel.
"""

import sys
import os

# Resolução de diretórios absolutos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(BASE_DIR, "src", "rf-001-cadastro-hospede")

# Adiciona o diretório da feature ao sys.path caso ainda não esteja presente
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

# Importa a aplicação FastAPI do backend oficial
from main import app
