# Modelo de Dados Relacional (Data Model): Cadastro e Autenticação

**Feature ID**: `specs/001-cadastro-e-auth`  
**Bancos Alvo**: Supabase (PostgreSQL 15+) / SQLite 3 (Fallback Local)  
**Normas Vinculadas**: `regras/DB.md`

---

## 1. Diagrama Entidade-Relacionamento (Mermaid)

```mermaid
erDiagram
    TB_OPERADORES ||--o{ TB_SESSOES : "possui"
    TB_OPERADORES ||--o{ TB_AUDIT_LOGS : "aciona"
    TB_HOSPEDES ||--o{ TB_AUDIT_LOGS : "alvo_de"

    TB_OPERADORES {
        bigint id PK
        char uuid_publico UK
        varchar nome
        varchar email UK
        varchar senha_hash
        varchar cargo
        boolean is_ativo
        timestamp created_at
    }

    TB_SESSOES {
        bigint id PK
        bigint id_operador FK
        varchar token_hash UK
        varchar ip_origem
        text user_agent
        timestamp expires_at
        timestamp revoked_at
        boolean is_active
        timestamp created_at
    }

    TB_HOSPEDES {
        bigint id PK
        char uuid_publico UK
        varchar nome
        varchar email UK
        char cpf UK
        varchar telefone
        date data_nascimento
        text observacoes
        timestamp created_at
        timestamp updated_at
    }

    TB_AUDIT_LOGS {
        bigint id PK
        bigint id_operador FK
        varchar acao
        varchar tabela_afetada
        bigint registro_id
        text dados_novos
        varchar ip_origem
        timestamp created_at
    }
```

---

## 2. Índices de Alta Performance

1. **`tb_hospedes`**:
   - `UNIQUE INDEX uk_hospedes_email (email)`: Garante unicidade e busca em $O(1)$.
   - `UNIQUE INDEX uk_hospedes_cpf (cpf)`: Previne cadastros duplicados no nível do motor.
   - `UNIQUE INDEX uk_hospedes_uuid (uuid_publico)`: Permite buscas instantâneas por chave pública.

2. **`tb_sessoes`**:
   - `INDEX idx_sessoes_lookup (token_hash, is_active, expires_at)`: Permite validação do token do cookie em menos de 1ms sem table scan.
   - `INDEX idx_sessoes_operador (id_operador)`: Permite revogar instantaneamente todas as sessões de um operador em caso de logout ou bloqueio.
