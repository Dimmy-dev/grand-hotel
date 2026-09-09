# Manual de Diretrizes de Documentação Técnica e Especificação de Requisitos (SSD)
### Laboratório de Inovação III — Prof. Edilberto Silva — 2026
**Padrão Normativo para Documentação dos Requisitos Funcionais (RF-001 a RF-010)**

---

## 1. Visão Geral e Filosofia Docs-as-Code

A documentação deste projeto não é um anexo burocrático; é o **gêmeo técnico** do software em execução. Cada entrega semanal foca em **APENAS UM REQUISITO FUNCIONAL (RF)** e deve ser capaz de ser auditada tanto por leitura humana quanto por corretores automáticos de IA.

A avaliação da disciplina é dividida em:
- **50% Documentação Técnica (.md rigoroso)**
- **50% Protótipo Funcional (código, deploy e banco de dados)**

O score de cada Requisito Funcional totaliza **100%**, distribuído em 7 tópicos mandatórios.

---

## 2. Estrutura Canônica de Pastas do Repositório

O repositório Git deve manter obrigatoriamente a árvore abaixo:

```text
seu-projeto-arquitetura/
├── docs/
│   ├── requisitos/
│   │   ├── RF-001-cadastro-hospede.md        <-- DOCUMENTO ÚNICO DA ENTREGA
│   │   └── ... (próximos RFs)
│   └── api/
│       └── swagger.json (ou openapi.json)     <-- Gerado pelo FastAPI (/openapi.json)
│
├── src/
│   ├── rf-001-cadastro-hospede/
│   │   ├── index.html                        <-- HTML com CSS embutido e Design Antisslop
│   │   ├── app.js                            <-- Cliente JavaScript (UI + Fetch/Fallback)
│   │   ├── main.py                           <-- Backend FastAPI
│   │   ├── database.py                       <-- Conexão e sessão MySQL / SQLAlchemy
│   │   ├── requirements.txt                  <-- Dependências Python
│   │   └── README.md                         <-- Guia local de execução do RF
│   └── ...
│
├── database/
│   ├── ddl/
│   │   └── rf-001-hospedes-ddl.sql           <-- CREATE TABLE, CONSTRAINTS e ÍNDICES
│   └── seeds/
│       └── hospedes-seeds.sql                <-- Dados de teste para demonstração
│
├── frontend-rules.md                         <-- Regras de UI e Design Tokens
├── documentation-rules.md                    <-- Este manual de governança
├── README.md                                 <-- Apresentação e guia geral do projeto
└── .gitignore                                <-- Exclusão de venv, __pycache__, .env
```

---

## 3. Estrutura Obrigatória do Documento do Requisito (`RF-NNN.md`)

O documento de especificação deve conter exatamente as 7 seções avaliadas:

### 🎯 Tópico 1: Identificação do Requisito (Peso: 2%)
- **ID:** `RF-XXX` (ex.: `RF-001`).
- **Título:** Claro, preciso e orientado ao domínio do negócio.
- **Tipo:** Requisito Funcional.
- **Prioridade:** ALTA / MÉDIA / BAIXA (com justificativa de bloqueio de outras tarefas).
- **Complexidade:** Estimada em Story Points (ex.: 5 SP) com justificativa técnica.
- **Status:** EM DESENVOLVIMENTO / CONCLUÍDO.
- **Breve Descrição:** Resumo executivo em 2 a 3 linhas.

### 📋 Tópico 2: Descrição e Atores (Peso: 10%)
- **Por que este requisito existe?** Mínimo de 3 a 5 benefícios claros de negócio.
- **Contexto do Negócio:** Explicação prática do cenário operacional no hotel.
- **Atores do Sistema:** Mínimo de 3 atores mapeados (ex.: Recepcionista, Gerente, Sistema Automático).
- **Matriz de Permissões CRUD:** Cada ator deve ter suas permissões explicitadas (`CREATE`, `READ`, `UPDATE`, `DELETE`).

### 🔄 Tópico 3: Casos de Uso + Requisitos Não-Funcionais (Peso: 20%)
- **Pré-Condições:** No mínimo 3 condições necessárias para disparar a ação.
- **Pós-Condições:** Mapeadas em cenário de **Sucesso** e cenário de **Falha**.
- **Fluxo Principal:** Passo a passo detalhado contendo **8 ou mais passos numerados**.
- **Fluxos Alternativos:** No mínimo 3 fluxos de exceção/alternativos (ex.: A1: Email duplicado, A2: CPF inválido pelo algoritmo Módulo 11, A3: Falha de conexão de rede com retry).
- **Regras de Negócio (RN):** Tabela estruturada com no mínimo **6 regras** (`RN-01` a `RN-06`), cobrindo unicidade, validação algorítmica, campos obrigatórios, retenção de dados e auditoria.
- **Requisitos Não-Funcionais (RNF):** Tabela estruturada com no mínimo **3 requisitos** (`RNF-01` a `RNF-03`), contendo Atributo, Requisito, Métrica e Justificativa.

### 🎨 Tópico 4: Protótipo Funcional (Peso: 40% — Crítico)
⚠️ **Sem funcionalidade prática = 0% neste tópico (perde 40% da nota do RF).**
- **Artefatos Entregues:** Arquivo `index.html` com CSS embutido + código-fonte backend/frontend + script DDL do banco.
- **5 Estados de Tela Obrigatórios Documentados em ASCII/Mockup e Código:**
  1. Vazio / Inicial
  2. Preenchido com validação visual
  3. Carregando (Loading com Spinner)
  4. Erro de validação contextual
  5. Sucesso com exibição do identificador gerado (`HSP-2026-XXXX`)
- **Acessibilidade e Semântica:** HTML semântico, conformidade com o [frontend-rules.md](file:///c:/Users/Dimi/Desktop/Trabalho_Edilberto/frontend-rules.md).
- **Persistência Real Comprovável:** Dados persistindo em MySQL ou simulados com resiliência local.
- **Deploy:** URL pública acessível (Vercel / GitHub Pages / Cloudflare Tunnel).

### 🏗️ Tópico 5: Arquitetura e ADR (Peso: 15%)
- **Diagrama de Componentes:** Diagrama em Mermaid ou ASCII detalhando as camadas de Frontend, Backend API (FastAPI) e Banco de Dados (MySQL).
- **Mínimo de 4 ADRs (Architecture Decision Records):**
  - Cada ADR deve conter: `ID`, `Status`, `Contexto`, `Decisão`, `Alternativas Consideradas` e `Consequências`.
  - Exemplo de temas: Banco de Dados Relacional, Framework Backend, Validação Dual, Camada de Fallback.
- **Tabela de Tecnologias Escolhidas:** Camada, Tecnologia, Versão e Justificativa.
- **Fluxo de Dados:** Mapeamento do ciclo de vida da informação da view até a persistência.

### 🔒 Tópico 6: Validação de Segurança OWASP (Peso: 10%)
- **Controle Implementado:** De 1 a 3 controles alinhados aos Top 10 OWASP (ex.: A03: Injection - SQL Injection).
- **Estrutura Obrigatória da Seção:**
  1. Identificação da Vulnerabilidade (ex.: concatenação direta de dados na query).
  2. Código Vulnerável (o que NUNCA fazer).
  3. Código Seguro (implementação com Prepared Statements / ORM parametrizado).
  4. Evidência do Teste de Segurança (payload de ataque testado e comprovação da neutralização).

### 📚 Tópico 7: Documentação API (Swagger/OpenAPI) (Peso: 3%)
- Arquivo `swagger.json` ou `openapi.json` presente em `docs/api/`.
- Documentação completa de todos os métodos HTTP do RF (`POST /api/hospedes`, `GET /api/hospedes`).
- Códigos HTTP de status documentados: `201 Created`, `400 Bad Request`, `409 Conflict`, `500 Internal Server Error`.
- Schemas de request e response detalhados.

---

## 4. Checklist Pré-Submissão (Autoavaliação da Rubrica)

Antes de gerar o arquivo final da entrega, verifique se a pontuação estimada atinge os 100%:

| Item | Tópico | Peso | Verificação |
| :--- | :--- | :---: | :---: |
| ID formatado, Título claro, Prioridade e Story Points | T1 | 2% | [ ] |
| 3+ benefícios de negócio e 3+ atores com CRUD detalhado | T2 | 10% | [ ] |
| Pré/pós-condições, fluxo 8+ passos, 3 fluxos alt., 6 RNs e 3 RNFs | T3 | 20% | [ ] |
| `index.html` funcional, 5 estados, deploy público e DDL SQL | T4 | 40% | [ ] |
| Diagrama de arquitetura, 4 ADRs estruturados e fluxo de dados | T5 | 15% | [ ] |
| 1 controle OWASP com vulnerabilidade, código seguro e teste | T6 | 10% | [ ] |
| Arquivo OpenAPI/Swagger com contratos de dados completos | T7 | 3% | [ ] |
| **TOTAL** | | **100%** | **Nota Mínima de Aceite: ≥ 60%** |

---

## 5. Regras para Geração do Pacote de Entrega (ZIP)

1. Nome do arquivo ZIP rigorosamente padronizado conforme o edital:
   `GRUPO-[99]-SEMANA-[99].zip` (exemplo: `GRUPO-03-SEMANA-01.zip`).
2. O arquivo ZIP deve conter a pasta completa do projeto sem dependências pesadas instaladas (`.venv`, `node_modules` devem ser removidos antes de compactar).
3. O repositório Git deve estar atualizado com a branch indicada no cabeçalho do documento.
