-- ============================================================================
-- SCRIPT DE SEEDS: SISTEMA GRAND PLAZA HOTEL MANAGEMENT
-- REQUISITO FUNCIONAL: RF-004 - CARGA INICIAL DE ACOMODAÇÕES (INVENTÁRIO DO HOTEL)
-- ============================================================================

INSERT INTO tb_acomodacoes (id, uuid_publico, numero, categoria, capacidade, tarifa_base, status, andar, descricao, is_ativo)
VALUES 
-- 1º Andar: Ala Executiva / Standard
(1, 'c1010000-0000-0000-0000-000000000101', '101', 'STANDARD', 2, 280.00, 'DISPONIVEL', 1, 'Quarto Standard com 1 cama de casal Queen, Wi-Fi 6 e mesa de trabalho', 1),
(2, 'c1020000-0000-0000-0000-000000000102', '102', 'STANDARD', 2, 280.00, 'DISPONIVEL', 1, 'Quarto Standard com 2 camas de solteiro e vista interna tranquila', 1),
(3, 'c1030000-0000-0000-0000-000000000103', '103', 'STANDARD', 3, 340.00, 'LIMPEZA', 1, 'Quarto Standard Triplo com 1 cama de casal e 1 de solteiro', 1),
(4, 'c1040000-0000-0000-0000-000000000104', '104', 'STANDARD', 1, 240.00, 'DISPONIVEL', 1, 'Quarto Individual Compacto ideal para viajantes corporativos', 1),

-- 2º Andar: Ala Premium / Luxo
(5, 'c2010000-0000-0000-0000-000000000201', '201', 'LUXO', 2, 490.00, 'DISPONIVEL', 2, 'Suíte Luxo com cama King Size, varanda panorâmica e hidromassagem', 1),
(6, 'c2020000-0000-0000-0000-000000000202', '202', 'LUXO', 2, 490.00, 'DISPONIVEL', 2, 'Suíte Luxo com isolamento acústico reforçado e cafeteira Nespresso', 1),
(7, 'c2030000-0000-0000-0000-000000000203', '203', 'LUXO', 4, 620.00, 'MANUTENCAO', 2, 'Suíte Luxo Familiar com ante-sala e 2 banheiros completos', 1),
(8, 'c2040000-0000-0000-0000-000000000204', '204', 'LUXO', 2, 490.00, 'DISPONIVEL', 2, 'Suíte Luxo Master com Smart TV 65 polegadas e adega climatizada', 1),

-- 3º Andar: Ala Royal / Suítes Presidenciais
(9, 'c3010000-0000-0000-0000-000000000301', '301', 'PRESIDENCIAL', 4, 1450.00, 'DISPONIVEL', 3, 'Suíte Presidencial Imperial com living privativo, closet e mordomo 24h', 1),
(10, 'c3020000-0000-0000-0000-000000000302', '302', 'PRESIDENCIAL', 6, 2100.00, 'DISPONIVEL', 3, 'Cobertura Penthouse com terraço gourmet privativo e vista da orla', 1)
ON CONFLICT (id) DO UPDATE 
SET numero = EXCLUDED.numero,
    categoria = EXCLUDED.categoria,
    capacidade = EXCLUDED.capacidade,
    tarifa_base = EXCLUDED.tarifa_base,
    status = EXCLUDED.status,
    andar = EXCLUDED.andar,
    descricao = EXCLUDED.descricao;
