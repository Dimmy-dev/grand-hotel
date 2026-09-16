-- ============================================================================
-- SCRIPT DDL: SISTEMA GRAND PLAZA HOTEL MANAGEMENT
-- REQUISITO FUNCIONAL: RF-002 - GESTÃO, EDIÇÃO E DESATIVAÇÃO SEGURA DE HÓSPEDES
-- BANCOS COMPATÍVEIS: Supabase (PostgreSQL 15+) e SQLite 3 (Fallback Local)
-- DIRETRIZES: regras/DB.md, regras/back.md e OWASP Top 10
-- ============================================================================

-- 1. Índice B-Tree de Alta Performance para Filtragem por Status (Ativos / Inativos)
-- Permite que a recepção filtre hóspedes ativos instantaneamente sem table scan
CREATE INDEX IF NOT EXISTS idx_hospedes_ativo ON tb_hospedes(is_ativo);

-- 2. Índice B-Tree para Aceleração de Busca Preditiva por Nome
-- Otimiza consultas com cláusulas LIKE 'termo%' na barra de pesquisa da recepção
CREATE INDEX IF NOT EXISTS idx_hospedes_nome ON tb_hospedes(nome);

-- 3. Índice Composto para Ordenação Decrescente e Status
CREATE INDEX IF NOT EXISTS idx_hospedes_status_id ON tb_hospedes(is_ativo, id DESC);
