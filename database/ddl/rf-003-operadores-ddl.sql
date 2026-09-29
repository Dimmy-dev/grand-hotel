-- ============================================================================
-- SCRIPT DDL: SISTEMA GRAND PLAZA HOTEL MANAGEMENT
-- REQUISITO FUNCIONAL: RF-003 - GESTÃO E CADASTRO DE USUÁRIOS DO SISTEMA
-- BANCOS COMPATÍVEIS: Supabase (PostgreSQL 15+) e SQLite 3 (Fallback Local)
-- DIRETRIZES: regras/DB.md, regras/back.md e OWASP Top 10
-- ============================================================================

-- 1. Garante a existência da tabela tb_operadores com suporte a cargos e timestamps
CREATE TABLE IF NOT EXISTS tb_operadores (
    id BIGSERIAL PRIMARY KEY,
    uuid_publico VARCHAR(36) NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) NOT NULL, -- 'ADMIN', 'GERENTE', 'FUNCIONARIO'
    is_ativo INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Índices B-Tree de alta performance para autenticação e listagens filtradas
CREATE INDEX IF NOT EXISTS idx_operadores_email ON tb_operadores(email);
CREATE INDEX IF NOT EXISTS idx_operadores_uuid ON tb_operadores(uuid_publico);
CREATE INDEX IF NOT EXISTS idx_operadores_cargo ON tb_operadores(cargo);
CREATE INDEX IF NOT EXISTS idx_operadores_ativo ON tb_operadores(is_ativo);
CREATE INDEX IF NOT EXISTS idx_operadores_cargo_ativo ON tb_operadores(cargo, is_ativo);
