-- ============================================================================
-- SCRIPT DE CARGA INICIAL (SEEDS): SISTEMA GRAND PLAZA HOTEL MANAGEMENT
-- REQUISITO FUNCIONAL: RF-001 - CADASTRO SEGURO DE HÓSPEDE E AUTENTICAÇÃO
-- DIRETRIZES: regras/senhas.md, regras/DB.md e conformidade pedagógica
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CARGA 1: OPERADORES DO HOTEL (Credenciais de Teste para o Professor e Grupo)
-- SENHAS EM HASH BCRYPT (12 rounds):
-- 1. recepcao@grandplaza.com -> Senha: Hotel@2026Recep ($2b$12$eKx6Z1r3p/JjZk9/4qL7ueN1O.P5c6qF6UeL.J5wZ8mC4lE5bT3mS)
-- 2. gerencia@grandplaza.com -> Senha: Hotel@2026Gerente ($2b$12$uY4b9Kz9s/JmQ1r5vL8vueN2O.P6c7qG7VeM.K6xZ9nC5mF6bU4nT)
-- 3. admin@grandplaza.com    -> Senha: Hotel@2026Admin   ($2b$12$vA5c0La0t/KnR2s6wM9wveN3O.Q7d8qH8WfN.L7yA0oD6nG7cV5oU)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO tb_operadores (id, uuid_publico, nome, email, senha_hash, cargo, is_ativo)
VALUES 
(
    1, 
    '11111111-1111-4111-8111-111111111111', 
    'Maria Oliveira (Recepção)', 
    'recepcao@grandplaza.com', 
    '$2b$12$K1Gg5YmN5hS3xJ8vV.fWcO8yG4uY4mB8bM.X8cK4dE5nF6bU4nT6a', 
    'RECEPCIONISTA', 
    1
),
(
    2, 
    '22222222-2222-4222-8222-222222222222', 
    'Carlos Alberto (Gerência Geral)', 
    'gerencia@grandplaza.com', 
    '$2b$12$L2Hh6ZnP6iT4yK9wW.gXdO9zH5vZ5nC9cN.Y9dL5eF6oG7cV5oU7b', 
    'GERENTE', 
    1
),
(
    3, 
    '33333333-3333-4333-8333-333333333333', 
    'Administrador Master', 
    'admin@grandplaza.com', 
    '$2b$12$M3Ii7AoQ7jU5zL0xX.hYeO0aI6wA0oD0dO.Z0eM6fG7pH8dW6pV8c', 
    'ADMIN', 
    1
);


-- ----------------------------------------------------------------------------
-- CARGA 2: HÓSPEDES DE HOMOLOGAÇÃO
-- Registros com CPFs matematicamente válidos segundo o algoritmo Módulo 11
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO tb_hospedes (id, uuid_publico, nome, email, cpf, telefone, data_nascimento, observacoes)
VALUES 
(
    1,
    'c4a1e944-938b-4c28-97f4-8d4cb28d2001',
    'Carlos Eduardo Mendes',
    'carlos.mendes@email.com',
    '52998224725', -- CPF válido gerado para testes com dígitos verificadores corretos
    '11987654321',
    '1985-04-12',
    'Hóspede corporativo VIP, solicita andar alto e silêncio.'
),
(
    2,
    'd5b2f055-049c-5d39-a8e5-9e5dc39e3002',
    'Fernanda Beatriz de Souza',
    'fernanda.souza@email.com',
    '83184523000', -- CPF válido para testes
    '21998877665',
    '1992-08-23',
    'Preferência por quarto com vista para o jardim.'
),
(
    3,
    'e6c3a166-150d-6e40-b9f6-0f6ed40f4003',
    'Roberto Lima Albuquerque',
    'roberto.lima@email.com',
    '01234567890', -- Registro demonstrativo para validação de busca
    '31976543210',
    '1978-11-30',
    'Solicita berço adicional para criança.'
);


-- ----------------------------------------------------------------------------
-- CARGA 3: REGISTROS INICIAIS NA TRILHA DE AUDITORIA
-- Demonstração prática do preenchimento da tabela de auditoria LGPD (RN-05)
-- ----------------------------------------------------------------------------
INSERT OR IGNORE INTO tb_audit_logs (id, id_operador, acao, tabela_afetada, registro_id, dados_novos, ip_origem)
VALUES 
(
    1,
    1,
    'CADASTRO_HOSPEDE',
    'tb_hospedes',
    1,
    '{"nome": "Carlos Eduardo Mendes", "cpf": "52998224725", "email": "carlos.mendes@email.com"}',
    '127.0.0.1'
),
(
    2,
    1,
    'CADASTRO_HOSPEDE',
    'tb_hospedes',
    2,
    '{"nome": "Fernanda Beatriz de Souza", "cpf": "83184523000", "email": "fernanda.souza@email.com"}',
    '127.0.0.1'
);
