-- ============================================================================
-- SCRIPT DE SETUP CONSOLIDADO PARA O SUPABASE (POSTGRESQL 15+)
-- Sistema Grand Plaza Hotel Management — Requisito RF-001
-- Instruções: Copie todo este conteúdo, cole no SQL Editor do Supabase e clique em RUN.
-- ============================================================================

-- 1. Criação das Tabelas Estruturais (DDL Idempotente)

-- TABELA: tb_operadores (Funcionários autorizados da recepção e gerência)
CREATE TABLE IF NOT EXISTS tb_operadores (
    id BIGSERIAL PRIMARY KEY,
    uuid_publico VARCHAR(36) NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    is_ativo INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operadores_email ON tb_operadores(email);
CREATE INDEX IF NOT EXISTS idx_operadores_uuid ON tb_operadores(uuid_publico);


-- TABELA: tb_sessoes (Controle de sessões ativas via HttpOnly Cookie)
CREATE TABLE IF NOT EXISTS tb_sessoes (
    id BIGSERIAL PRIMARY KEY,
    id_operador BIGINT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    ip_origem VARCHAR(45),
    user_agent VARCHAR(500),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessoes_operador FOREIGN KEY (id_operador) REFERENCES tb_operadores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessoes_token ON tb_sessoes(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessoes_operador ON tb_sessoes(id_operador);


-- TABELA: tb_hospedes (Registro de Hóspedes do Hotel com proteção LGPD)
CREATE TABLE IF NOT EXISTS tb_hospedes (
    id BIGSERIAL PRIMARY KEY,
    uuid_publico VARCHAR(36) NOT NULL UNIQUE,
    nome_completo VARCHAR(120) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL,
    telefone VARCHAR(15) NOT NULL,
    data_nascimento DATE NOT NULL,
    is_ativo INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospedes_cpf ON tb_hospedes(cpf);
CREATE INDEX IF NOT EXISTS idx_hospedes_email ON tb_hospedes(email);
CREATE INDEX IF NOT EXISTS idx_hospedes_uuid ON tb_hospedes(uuid_publico);


-- TABELA: tb_audit_logs (Trilha de auditoria imutável para conformidade LGPD)
CREATE TABLE IF NOT EXISTS tb_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    uuid_publico VARCHAR(36) NOT NULL UNIQUE,
    id_operador BIGINT,
    acao VARCHAR(50) NOT NULL,
    tabela_afetada VARCHAR(50) NOT NULL,
    registro_id VARCHAR(36) NOT NULL,
    detalhes_json TEXT,
    ip_origem VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_operador FOREIGN KEY (id_operador) REFERENCES tb_operadores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_tabela_reg ON tb_audit_logs(tabela_afetada, registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON tb_audit_logs(created_at);


-- 2. Carga Inicial de Operadores e Hóspedes de Teste (Seeds Idempotentes)

-- Inserção de Operadores do Hotel
-- Senha de todos os operadores de teste: 'Hotel@2026Recep' (Recepção), 'Hotel@2026Gerente' (Gerência), 'Hotel@2026Admin' (Admin)
INSERT INTO tb_operadores (id, uuid_publico, nome, email, senha_hash, cargo, is_ativo)
VALUES 
(
    1,
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    'Maria Oliveira (Recepção)',
    'recepcao@grandplaza.com',
    '$2b$12$GvRy/KnJwWYztkzH.Cm01Oczn.wfYsYuF6fmeNCQjcOesxrHj0Og6',
    'RECEPCIONISTA',
    1
),
(
    2,
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'Carlos Alberto (Gerente Geral)',
    'gerencia@grandplaza.com',
    '$2b$12$Dj4QBsMoRgtD/qws.vd5cuHzl6n3FzTT4UeycAk4pH4IgSDuHNx/O',
    'GERENTE',
    1
),
(
    3,
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'Administrador do Sistema',
    'admin@grandplaza.com',
    '$2b$12$nrmf/fVottj67BteiuUvYuPv56wIDbd0eB2jvelmiFMopSs1OhljK',
    'ADMIN',
    1
)
ON CONFLICT (email) DO NOTHING;

-- Ajustar a sequência de ID dos operadores para evitar conflitos no Postgres
SELECT setval('tb_operadores_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tb_operadores));


-- Inserção de Hóspedes de Homologação (CPFs válidos conforme algoritmo Módulo 11)
INSERT INTO tb_hospedes (id, uuid_publico, nome_completo, cpf, email, telefone, data_nascimento, is_ativo)
VALUES
(
    1,
    'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
    'Dr. Fernando Albuquerque',
    '52998224725',
    'fernando.albuquerque@advocacia.com.br',
    '(11) 98765-4321',
    '1982-05-14',
    1
),
(
    2,
    'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
    'Dra. Beatriz Mendes Santana',
    '01234567890',
    'beatriz.mendes@clinica.med.br',
    '(21) 99876-5432',
    '1989-11-23',
    1
),
(
    3,
    'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
    'Eng. Lucas Silveira Prado',
    '83247829023',
    'lucas.silveira@techconsultoria.com.br',
    '(31) 97654-3210',
    '1995-02-10',
    1
)
ON CONFLICT (cpf) DO NOTHING;

-- Ajustar a sequência de ID dos hóspedes
SELECT setval('tb_hospedes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tb_hospedes));
