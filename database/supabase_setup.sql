-- ============================================================================
-- SCRIPT DE SETUP CONSOLIDADO PARA O SUPABASE (POSTGRESQL 15+)
-- Sistema Grand Plaza Hotel Management — Requisito RF-001
-- Instruções: Copie todo este conteúdo, cole no SQL Editor do Supabase e clique em RUN.
-- ============================================================================

-- 1. Criação das Tabelas Estruturais (DDL Idempotente)

-- TABELA: tb_operadores (Funcionários e administradores do sistema hoteleiro)
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

CREATE INDEX IF NOT EXISTS idx_operadores_email ON tb_operadores(email);
CREATE INDEX IF NOT EXISTS idx_operadores_uuid ON tb_operadores(uuid_publico);
CREATE INDEX IF NOT EXISTS idx_operadores_cargo ON tb_operadores(cargo);
CREATE INDEX IF NOT EXISTS idx_operadores_ativo ON tb_operadores(is_ativo);
CREATE INDEX IF NOT EXISTS idx_operadores_cargo_ativo ON tb_operadores(cargo, is_ativo);


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
    '$2b$12$KDfmfg42kMNx5luWhsLpVukA1mM/NpF/22jzWRPDJJu8GSMA/1k22',
    'RECEPCIONISTA',
    1
),
(
    2,
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    'Carlos Alberto (Gerente Geral)',
    'gerencia@grandplaza.com',
    '$2b$12$U/pmgWx4E8Zf0txzkOP8xeOFP5ON1hl0X.fpAKUvFLE4qF3n0Ird6',
    'GERENTE',
    1
),
(
    3,
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
    'Administrador do Sistema',
    'admin@grandplaza.com',
    '$2b$12$/o1jLTX4L7xbsIOOZxpya.oS0OTQHyYt2hcdScsEbcpMdK5Gb9Gcy',
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


-- ============================================================================
-- 3. REQUISITO RF-004: ACOMODAÇÕES, HOSPEDAGEM, CHECK-IN E CHECK-OUT
-- ============================================================================

-- TABELA: tb_acomodacoes (Inventário de Quartos)
CREATE TABLE IF NOT EXISTS tb_acomodacoes (
    id BIGSERIAL PRIMARY KEY,
    uuid_publico VARCHAR(36) NOT NULL UNIQUE,
    numero VARCHAR(10) NOT NULL UNIQUE,
    categoria VARCHAR(30) NOT NULL, -- 'STANDARD', 'LUXO', 'PRESIDENCIAL'
    capacidade INTEGER NOT NULL DEFAULT 2,
    tarifa_base NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL', -- 'DISPONIVEL', 'OCUPADO', 'MANUTENCAO', 'LIMPEZA'
    andar INTEGER NOT NULL DEFAULT 1,
    descricao VARCHAR(255),
    is_ativo INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_acomodacoes_status ON tb_acomodacoes(status);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_categoria ON tb_acomodacoes(categoria);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_uuid ON tb_acomodacoes(uuid_publico);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_numero ON tb_acomodacoes(numero);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_status_cat ON tb_acomodacoes(status, categoria);


-- TABELA: tb_hospedagens (Registro de Estadia e Faturamento)
CREATE TABLE IF NOT EXISTS tb_hospedagens (
    id BIGSERIAL PRIMARY KEY,
    uuid_publico VARCHAR(36) NOT NULL UNIQUE,
    id_hospede BIGINT NOT NULL,
    id_acomodacao BIGINT NOT NULL,
    id_operador BIGINT,
    data_checkin TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_prevista_checkout TIMESTAMPTZ NOT NULL,
    data_checkout TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVA', -- 'ATIVA', 'FINALIZADA', 'CANCELADA'
    num_diarias INTEGER,
    tarifa_diaria_aplicada NUMERIC(10, 2) NOT NULL,
    valor_total NUMERIC(10, 2),
    acompanhantes_json TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hospedagens_hospede FOREIGN KEY (id_hospede) REFERENCES tb_hospedes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_hospedagens_acomodacao FOREIGN KEY (id_acomodacao) REFERENCES tb_acomodacoes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_hospedagens_operador FOREIGN KEY (id_operador) REFERENCES tb_operadores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_hospedagens_uuid ON tb_hospedagens(uuid_publico);
CREATE INDEX IF NOT EXISTS idx_hospedagens_status ON tb_hospedagens(status);
CREATE INDEX IF NOT EXISTS idx_hospedagens_hospede ON tb_hospedagens(id_hospede);
CREATE INDEX IF NOT EXISTS idx_hospedagens_acomodacao ON tb_hospedagens(id_acomodacao);
CREATE INDEX IF NOT EXISTS idx_hospedagens_ativa_acomodacao ON tb_hospedagens(id_acomodacao, status);


-- Seeds de Acomodações do Grand Plaza Hotel
INSERT INTO tb_acomodacoes (id, uuid_publico, numero, categoria, capacidade, tarifa_base, status, andar, descricao, is_ativo)
VALUES 
(1, 'c1010000-0000-0000-0000-000000000101', '101', 'STANDARD', 2, 280.00, 'DISPONIVEL', 1, 'Quarto Standard com 1 cama de casal Queen, Wi-Fi 6 e mesa de trabalho', 1),
(2, 'c1020000-0000-0000-0000-000000000102', '102', 'STANDARD', 2, 280.00, 'DISPONIVEL', 1, 'Quarto Standard com 2 camas de solteiro e vista interna tranquila', 1),
(3, 'c1030000-0000-0000-0000-000000000103', '103', 'STANDARD', 3, 340.00, 'LIMPEZA', 1, 'Quarto Standard Triplo com 1 cama de casal e 1 de solteiro', 1),
(4, 'c1040000-0000-0000-0000-000000000104', '104', 'STANDARD', 1, 240.00, 'DISPONIVEL', 1, 'Quarto Individual Compacto ideal para viajantes corporativos', 1),
(5, 'c2010000-0000-0000-0000-000000000201', '201', 'LUXO', 2, 490.00, 'DISPONIVEL', 2, 'Suíte Luxo com cama King Size, varanda panorâmica e hidromassagem', 1),
(6, 'c2020000-0000-0000-0000-000000000202', '202', 'LUXO', 2, 490.00, 'DISPONIVEL', 2, 'Suíte Luxo com isolamento acústico reforçado e cafeteira Nespresso', 1),
(7, 'c2030000-0000-0000-0000-000000000203', '203', 'LUXO', 4, 620.00, 'MANUTENCAO', 2, 'Suíte Luxo Familiar com ante-sala e 2 banheiros completos', 1),
(8, 'c2040000-0000-0000-0000-000000000204', '204', 'LUXO', 2, 490.00, 'DISPONIVEL', 2, 'Suíte Luxo Master com Smart TV 65 polegadas e adega climatizada', 1),
(9, 'c3010000-0000-0000-0000-000000000301', '301', 'PRESIDENCIAL', 4, 1450.00, 'DISPONIVEL', 3, 'Suíte Presidencial Imperial com living privativo, closet e mordomo 24h', 1),
(10, 'c3020000-0000-0000-0000-000000000302', '302', 'PRESIDENCIAL', 6, 2100.00, 'DISPONIVEL', 3, 'Cobertura Penthouse com terraço gourmet privativo e vista da orla', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval('tb_acomodacoes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tb_acomodacoes));

