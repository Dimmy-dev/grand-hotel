-- ============================================================================
-- SCRIPT DDL: SISTEMA GRAND PLAZA HOTEL MANAGEMENT
-- REQUISITO FUNCIONAL: RF-001 - CADASTRO SEGURO DE HÓSPEDE E AUTENTICAÇÃO
-- BANCOS COMPATÍVEIS: Supabase (PostgreSQL 15+) e SQLite 3 (Fallback Local)
-- DIRETRIZES: regras/DB.md, regras/back.md e OWASP Top 10
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABELA 1: tb_operadores
-- FINALIDADE: Armazena os funcionários autorizados a operar o sistema.
-- SEGURANÇA: Senha armazenada exclusivamente em hash Bcrypt (12 rounds).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_operadores (
    id BIGINT PRIMARY KEY,                        -- Identificador surrogate interno de alta performance
    uuid_publico VARCHAR(36) NOT NULL UNIQUE,     -- Identificador universal público para auditoria e APIs
    nome VARCHAR(120) NOT NULL,                   -- Nome completo do funcionário do hotel
    email VARCHAR(150) NOT NULL UNIQUE,           -- E-mail institucional usado como login (chave única)
    senha_hash VARCHAR(255) NOT NULL,             -- Hash Bcrypt da senha (nunca texto claro)
    cargo VARCHAR(50) NOT NULL,                   -- Papel no sistema: 'RECEPCIONISTA', 'GERENTE', 'ADMIN'
    is_ativo INTEGER NOT NULL DEFAULT 1,          -- Status da conta: 1 = Ativo, 0 = Inativo/Bloqueado
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Data e hora UTC do cadastro do operador
);

-- Índices de alta performance para autenticação
CREATE INDEX IF NOT EXISTS idx_operadores_email ON tb_operadores(email);
CREATE INDEX IF NOT EXISTS idx_operadores_uuid ON tb_operadores(uuid_publico);


-- ----------------------------------------------------------------------------
-- TABELA 2: tb_sessoes
-- FINALIDADE: Gerencia as sessões ativas dos operadores logados via HttpOnly Cookie.
-- SEGURANÇA: Armazena apenas o HASH SHA-256 do token (OWASP A07).
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_sessoes (
    id BIGINT PRIMARY KEY,                        -- Chave primária da sessão
    id_operador BIGINT NOT NULL,                  -- Chave estrangeira referenciando o operador logado
    token_hash VARCHAR(64) NOT NULL UNIQUE,       -- Hash SHA-256 do token de sessão (imunidade a vazamento)
    ip_origem VARCHAR(45),                        -- Endereço IP do cliente (suporte a IPv4 e IPv6)
    user_agent VARCHAR(500),                      -- Cabeçalho do navegador para detecção de anomalias
    expires_at TIMESTAMP NOT NULL,                -- Timestamp limite de expiração da sessão (TTL)
    revoked_at TIMESTAMP,                         -- Timestamp de encerramento explícito (Logout)
    is_active INTEGER NOT NULL DEFAULT 1,          -- Status da sessão: 1 = Válida, 0 = Revogada/Expirada
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Momento da criação da sessão
    FOREIGN KEY (id_operador) REFERENCES tb_operadores(id) ON DELETE CASCADE
);

-- Índice de Lookup em O(1): Valida o cookie em menos de 1ms sem table scan
CREATE INDEX IF NOT EXISTS idx_sessoes_lookup ON tb_sessoes(token_hash, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessoes_operador ON tb_sessoes(id_operador);


-- ----------------------------------------------------------------------------
-- TABELA 3: tb_hospedes (Domínio Central do RF-001)
-- FINALIDADE: Armazena os dados cadastrais essenciais dos clientes do hotel.
-- INTEGRIDADE: Garante unicidade estrita de CPF e E-mail contra cadastros duplicados.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_hospedes (
    id BIGINT PRIMARY KEY,                        -- Identificador surrogate interno B-Tree
    uuid_publico VARCHAR(36) NOT NULL UNIQUE,     -- UUID público exposto no frontend e contratos REST
    nome VARCHAR(150) NOT NULL,                   -- Nome completo do hóspede (sanitizado anti-XSS)
    email VARCHAR(180) NOT NULL UNIQUE,           -- E-mail válido e estritamente único (RN-01)
    cpf VARCHAR(11) NOT NULL UNIQUE,              -- 11 dígitos numéricos validados via Módulo 11 (RN-02)
    telefone VARCHAR(20) NOT NULL,                -- Telefone de contato com DDD
    data_nascimento DATE NOT NULL,                -- Data de nascimento para validação legal (RN-03)
    observacoes TEXT,                             -- Notas operacionais ou preferências de acomodação
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data e hora UTC da criação do cadastro
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Data e hora UTC da última alteração
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_hospedes_email ON tb_hospedes(email);
CREATE INDEX IF NOT EXISTS idx_hospedes_cpf ON tb_hospedes(cpf);
CREATE INDEX IF NOT EXISTS idx_hospedes_uuid ON tb_hospedes(uuid_publico);


-- ----------------------------------------------------------------------------
-- TABELA 4: tb_audit_logs
-- FINALIDADE: Trilha de auditoria obrigatória para conformidade LGPD e segurança.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tb_audit_logs (
    id BIGINT PRIMARY KEY,                        -- Chave primária do log
    id_operador BIGINT,                           -- FK do operador responsável (nulo em operações públicas)
    acao VARCHAR(50) NOT NULL,                    -- Ação registrada: 'CADASTRO_HOSPEDE', 'LOGIN', 'LOGOUT'
    tabela_afetada VARCHAR(50) NOT NULL,          -- Nome da tabela modificada (ex: 'tb_hospedes')
    registro_id BIGINT,                           -- ID do registro criado ou modificado
    dados_novos TEXT,                             -- Snapshot JSON ou texto com os dados registrados
    ip_origem VARCHAR(45) NOT NULL,               -- IP de origem da requisição
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp UTC imutável do evento
    FOREIGN KEY (id_operador) REFERENCES tb_operadores(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_acao ON tb_audit_logs(acao);
CREATE INDEX IF NOT EXISTS idx_audit_data ON tb_audit_logs(created_at);
