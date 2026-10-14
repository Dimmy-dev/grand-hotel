-- ============================================================================
-- SCRIPT DDL: SISTEMA GRAND PLAZA HOTEL MANAGEMENT
-- REQUISITO FUNCIONAL: RF-004 - SISTEMA DE HOSPEDAGEM, GESTÃO DE ACOMODAÇÕES,
-- CHECK-IN, CHECK-OUT E RACK HOTELEIRO
-- BANCOS COMPATÍVEIS: Supabase (PostgreSQL 15+) e SQLite 3 (Fallback Local)
-- DIRETRIZES: regras/DB.md, regras/back.md e OWASP Top 10
-- ============================================================================

-- 1. TABELA: tb_acomodacoes (Inventário Físico de Quartos do Hotel)
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

-- Índices B-Tree para consultas ultrarrápidas no Rack Hoteleiro
CREATE INDEX IF NOT EXISTS idx_acomodacoes_status ON tb_acomodacoes(status);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_categoria ON tb_acomodacoes(categoria);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_uuid ON tb_acomodacoes(uuid_publico);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_numero ON tb_acomodacoes(numero);
CREATE INDEX IF NOT EXISTS idx_acomodacoes_status_cat ON tb_acomodacoes(status, categoria);


-- 2. TABELA: tb_hospedagens (Vínculo Transacional de Estadia, Check-in e Check-out)
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

-- Índices B-Tree para verificação de sobreposição e filtragem de estadias ativas
CREATE INDEX IF NOT EXISTS idx_hospedagens_uuid ON tb_hospedagens(uuid_publico);
CREATE INDEX IF NOT EXISTS idx_hospedagens_status ON tb_hospedagens(status);
CREATE INDEX IF NOT EXISTS idx_hospedagens_hospede ON tb_hospedagens(id_hospede);
CREATE INDEX IF NOT EXISTS idx_hospedagens_acomodacao ON tb_hospedagens(id_acomodacao);
CREATE INDEX IF NOT EXISTS idx_hospedagens_ativa_acomodacao ON tb_hospedagens(id_acomodacao, status);
