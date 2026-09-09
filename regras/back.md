# Diretrizes de Arquitetura de Backend e Segurança de APIs REST (FastAPI)
### Sistema Grand Plaza Hotel Management — Padrão Técnico de Serviços e Endpoints

Este documento estabelece as diretrizes arquiteturais, contratos de API REST, tratamento de concorrência, autenticação segura e sanitização de dados para o backend em **Python 3.11+ com FastAPI e SQLAlchemy**, em conformidade com as práticas de `@python-pro` e `@backend-security-coder`.

---

## 1. Arquitetura em Camadas (Layered Clean Architecture)

O backend adota a separação estrita em quatro camadas com Injeção de Dependências nativa (`Depends`):

```text
src/
├── routers/        <-- Camada de Transporte HTTP (Thin Controllers: rotas, status codes, DTOs de entrada/saída)
├── services/       <-- Regras de Negócio e Casos de Uso (orquestração, hash, regras RN-01 a RN-08)
├── repositories/   <-- Camada de Persistência (queries SQLAlchemy parametrizadas, transações ACID)
├── schemas/        <-- DTOs Pydantic v2 (validação estrita de tipos na borda, Módulo 11 de CPF, sanitização)
├── models/         <-- Modelos ORM mapeando as tabelas físicas do banco
└── main.py         <-- Ponto de entrada, configuração de middlewares, CORS, Rate Limiter e Swagger
```

### Regras de Isolamento:
1. **Modelos ORM nunca transitam pela rede**: As entidades do SQLAlchemy (`models.py`) nunca são retornadas diretamente nas rotas. Elas devem ser sempre serializadas através dos schemas Pydantic de resposta (`HospedeResponse`, `LoginResponse`).
2. **Handlers de Rota Magros (Thin Controllers)**: Funções de rota limitam-se a receber o payload validado, injetar o serviço ou sessão de banco, chamar o método de caso de uso e retornar o envelope HTTP padronizado.
3. **Prepared Statements Obrigatórios (OWASP A03)**: Nenhuma consulta pode utilizar interpolação ou concatenação de strings (`f"SELECT ... WHERE email = '{email}'"` é expressamente proibido).
4. **Comentários Obrigatórios e Depurabilidade (Clean Code & Debug)**: Todo endpoint, serviço, repository e validador Pydantic deve conter docstring detalhada (explicando objetivo, entradas e possíveis exceções HTTP) e comentários de linha em cada etapa lógica para garantir facilidade de depuração imediata.
5. **Autenticação via HttpOnly Cookies (OWASP A07)**: O endpoint de login emite o token de sessão através do cabeçalho `Set-Cookie` com flags `HttpOnly; Path=/; SameSite=Lax; Max-Age=28800`. O JavaScript nunca acessa o token diretamente, blindando o sistema contra roubo de sessão via XSS. O logout invalida o registro no banco e expira o cookie (`Max-Age=0`).
6. **Provedor de Conexão com Supabase e Resiliência Transparente**: O arquivo `database.py` utiliza o SQLAlchemy configurado primariamente para o **Supabase (PostgreSQL 15+)** via variável `DATABASE_URL` (com pooler PgBouncer para suportar o ambiente Serverless da Vercel). Caso a conexão com a nuvem esteja inacessível (ex: máquina de avaliação offline do professor), a aplicação faz fallback automático para o SQLite local (`hotel_grand_plaza.db`) com o mesmo schema e seeds, garantindo 100% de disponibilidade sem intervenção manual.

---

## 2. Padrão de Endpoints REST e Respostas da API

| Método | Endpoint | Descrição / Caso de Uso | Sucesso | Erros Mapeados |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/api/v1/auth/login` | Autenticação de operador e geração de sessão | `200 OK` | `401`, `422`, `429` |
| `POST` | `/api/v1/auth/logout` | Revogação imediata da sessão ativa | `200 OK` | `401`, `500` |
| `POST` | `/api/v1/hospedes` | Cadastro de novo hóspede com validação estrita (RF-001) | `201 Created` | `400`, `409`, `422`, `500` |
| `GET` | `/api/v1/hospedes` | Listagem paginada de hóspedes | `200 OK` | `401`, `500` |
| `GET` | `/api/v1/hospedes/{uuid}` | Detalhes de hóspede por UUID público | `200 OK` | `404`, `500` |

### Formato Padronizado de Respostas (Envelope Pattern)

#### Resposta de Sucesso (`200 OK` ou `201 Created`)
```json
{
  "success": true,
  "data": {
    "uuid": "c4a1e944-938b-4c28-97f4-8d4cb28d2001",
    "nome": "Carlos Eduardo Mendes",
    "email": "carlos.mendes@email.com",
    "cpf": "12345678901",
    "telefone": "11999998888",
    "data_nascimento": "1985-04-12",
    "created_at": "2026-09-08T20:00:00.000Z"
  }
}
```

#### Resposta de Erro Padronizada (`4xx` ou `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_RESOURCE",
    "message": "Este endereço de e-mail já está cadastrado no sistema.",
    "field": "email"
  }
}
```

---

## 3. Validação de Borda e Algoritmo Módulo 11 (Pydantic v2)

Toda entrada que atinge a API é interceptada por schemas Pydantic estritos:

```python
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date
from typing import Optional
import re
import html

def valida_cpf_modulo11(cpf: str) -> bool:
    cpf_limpo = re.sub(r'\D', '', cpf)
    if len(cpf_limpo) != 11 or len(set(cpf_limpo)) == 1:
        return False
    # Cálculo do 1º dígito verificador
    soma = sum(int(cpf_limpo[i]) * (10 - i) for i in range(9))
    digito1 = (soma * 10 % 11) % 10
    if int(cpf_limpo[9]) != digito1:
        return False
    # Cálculo do 2º dígito verificador
    soma = sum(int(cpf_limpo[i]) * (11 - i) for i in range(10))
    digito2 = (soma * 10 % 11) % 10
    return int(cpf_limpo[10]) == digito2

class HospedeCreateSchema(BaseModel):
    nome: str = Field(..., min_length=3, max_length=150, description="Nome completo")
    email: EmailStr = Field(..., description="E-mail válido RFC 5322")
    cpf: str = Field(..., description="CPF válido de 11 dígitos")
    telefone: str = Field(..., min_length=10, max_length=20, description="Telefone com DDD")
    data_nascimento: date = Field(..., description="Data de nascimento no formato AAAA-MM-DD")
    observacoes: Optional[str] = Field(None, max_length=1000)

    @field_validator("nome", "observacoes")
    @classmethod
    def sanitizar_texto(cls, v: Optional[str]) -> Optional[str]:
        if v:
            # Proteção contra XSS armazenado
            return html.escape(v.strip())
        return v

    @field_validator("cpf")
    @classmethod
    def validar_cpf(cls, v: str) -> str:
        cpf_limpo = re.sub(r'\D', '', v)
        if not valida_cpf_modulo11(cpf_limpo):
            raise ValueError("CPF inválido segundo o algoritmo módulo 11.")
        return cpf_limpo

    @field_validator("data_nascimento")
    @classmethod
    def validar_data_nascimento(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("A data de nascimento não pode ser futura.")
        if v.year < 1900:
            raise ValueError("Data de nascimento inválida (anterior a 1900).")
        return v
```

---

## 4. Segurança e Hardening (OWASP Top 10)

1. **Prevenção contra SQL Injection (OWASP A03)**:
   - Utilização integral do SQLAlchemy ORM com parâmetros vinculados (`bind parameters`).
2. **Proteção de Sessões e Autenticação (OWASP A07)**:
   - Tokens de sessão são gerados com `secrets.token_urlsafe(32)`.
   - **Nunca salvar tokens em texto claro no banco**: armazene exclusivamente o hash SHA-256 (`hashlib.sha256(token.encode()).hexdigest()`).
   - Senhas de operadores utilizam derivação com `bcrypt` (mínimo de 12 rounds de salt).
3. **Rate Limiting em Memória (OWASP API4)**:
   - Limite de 30 requisições por minuto por endereço IP para prevenir ataques de força bruta no login ou flood no cadastro.
4. **Security Headers Middleware**:
   - Injeção obrigatória dos headers em todas as respostas:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY`
     - `Strict-Transport-Security: max-age=31536000; includeSubDomains`

---

## 5. Documentação Automática Swagger / OpenAPI (Tópico 7)

O FastAPI expõe nativamente os contratos da API:
- Documentação Interativa: `/docs` (Swagger UI).
- Especificação OpenAPI JSON: `/openapi.json`.
- Script de build exporta automaticamente para `docs/api/swagger.json` para atendimento rigoroso da rubrica da disciplina.
