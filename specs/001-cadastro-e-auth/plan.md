# Plano Técnico de Implementação: Cadastro de Hóspede e Autenticação

**Feature ID**: `specs/001-cadastro-e-auth`  
**Date**: 2026-09-08  
**Spec Vinculada**: [spec.md](file:///c:/Users/Dimi/Desktop/Trabalho_Edilberto/specs/001-cadastro-e-auth/spec.md)  
**Diretrizes**: `regras/back.md`, `regras/front.md`, `regras/DB.md`

---

## 1. Sumário Executivo da Arquitetura

O sistema será construído em arquitetura modular de alta coesão e baixo acoplamento:
- **Backend API**: Python 3.11 com FastAPI, Pydantic v2 para validação estrita de fronteira e SQLAlchemy 2.0 ORM.
- **Frontend SPA**: Vanilla JavaScript modular em arquivo único `index.html` com CSS embutido, gerenciador de visões (Login $\to$ Hóspedes) e máquina de 5 estados visuais.
- **Camada de Dados**: Provedor resiliente configurado primariamente para **Supabase (PostgreSQL 15+)** com fallback transparente para **SQLite 3 local** (`hotel_grand_plaza.db`).

---

## 2. Estrutura Canônica de Arquivos a Ser Construída

```text
src/rf-001-cadastro-hospede/
├── index.html           # Interface SPA completa com CSS embutido e Design Antisslop
├── app.js               # Cliente JavaScript: transição de visões, 5 estados e validações
├── main.py              # Aplicação FastAPI: rotas, exception handlers e CORS
├── schemas.py           # DTOs Pydantic: validação Módulo 11, sanitização XSS e contratos
├── models.py            # Entidades SQLAlchemy ORM: Hospede, Operador, Sessao, AuditLog
├── database.py          # Provedor resiliente de sessão (Supabase PostgreSQL / SQLite fallback)
├── requirements.txt     # Dependências Python estritas
└── README.md            # Guia de execução local e no WSL com túnel/deploy
```

---

## 3. Contratos de Interface de Entrada e Saída (DTOs Pydantic)

### 3.1 `HospedeCreateSchema` (Entrada do Cadastro)
- `nome: str` (min_length=3, max_length=150, sanitizado com `html.escape`)
- `email: EmailStr` (validado por RFC 5322, convertido para lowercase)
- `cpf: str` (validado pelo algoritmo Módulo 11, armazenado com 11 dígitos puros)
- `telefone: str` (min_length=10, max_length=20, com DDD)
- `data_nascimento: date` (não pode ser futura nem anterior a 01/01/1900)
- `observacoes: Optional[str]` (max_length=1000, sanitizado)

### 3.2 `LoginSchema` (Entrada da Autenticação)
- `email: EmailStr`
- `senha: str` (min_length=6)

### 3.3 Envelopes de Resposta REST
- Resposta padrão: `{"success": true, "data": {...}}`
- Resposta de erro: `{"success": false, "error": {"code": "...", "message": "..."}}`

---

## 4. Estratégia de Autenticação e Segurança (OWASP Top 10)

1. **HttpOnly Cookies**:
   - `POST /api/v1/auth/login` emite `Set-Cookie: session_token=...; HttpOnly; Path=/; SameSite=Lax`.
   - O JavaScript do navegador nunca lê a chave diretamente, eliminando o vetor de ataque XSS.
2. **Hash de Sessões e Senhas**:
   - O token da sessão é gravado no banco exclusivamente como hash SHA-256 (`token_hash`).
   - As senhas dos operadores utilizam derivação com `bcrypt` (12 rounds).
3. **Prepared Statements Universais**:
   - Todas as queries passam pelo SQLAlchemy ORM sem interpolação de strings (neutralização total de SQL Injection - OWASP A03).
4. **Rate Limiting**:
   - Middleware intercepta chamadas e limita a 30 requisições por minuto por IP.

---

## 5. Estratégia de Resiliência de Banco de Dados

```python
# database.py - Lógica de Resiliência Transparente
# Tenta conectar ao Supabase na nuvem via DATABASE_URL;
# Caso falhe (ambiente offline do avaliador), inicializa o SQLite local hotel_grand_plaza.db
```
