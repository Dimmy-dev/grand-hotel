# Manual de Diretrizes de Documentação Técnica e Governança de Requisitos (SSD)
### Laboratório de Inovação III — Prof. Edilberto Silva — 2026
**Padrão Normativo para Documentação dos Requisitos Funcionais (RF-001 a RF-010)**

---

## 1. Filosofia Docs-as-Code e Regras de Avaliação

A documentação do projeto é o **espelho técnico do software em produção**. Cada entrega semanal foca em **APENAS UM REQUISITO FUNCIONAL (RF)** e deve ser auditável tanto por leitura humana quanto por corretores de IA.

A avaliação da disciplina é dividida em:
- **50% Documentação Técnica (.md rigoroso)**
- **50% Protótipo Funcional (código, deploy e banco de dados)**

$$\text{Nota da Entrega} = \frac{\text{Protótipo (0 a 100\%)} + \text{Documentação (0 a 100\%)}}{2}$$

O score de cada Requisito Funcional totaliza **100%**, distribuído exatamente nos 7 tópicos mandatórios.

### 1.1 Diretriz Mandatória de Código Comentado e Depurabilidade
Conforme o modelo pedagógico e avaliativo da disciplina:
1. **Todo o código-fonte deve ser amplamente comentado**: Cada função, classe, método, endpoint, listener de evento e query SQL deve conter comentários claros explicando:
   - O **propósito** daquele trecho de código (o que ele faz).
   - A **regra de negócio ou motivo técnico** (por que foi feito dessa forma).
2. **Comentários de Linha para Facilidade de Depuração (Debug)**:
   - Cálculos matemáticos (ex: algoritmo do Módulo 11 do CPF), manipulações de máscaras, transições de estado visual e checagens de integridade devem conter comentários linha a linha.
   - Qualquer integrante do grupo ou avaliador deve ser capaz de abrir o arquivo e entender o fluxo imediatamente, identificando rapidamente pontos de erro ou exceção.
3. **Proibido Código "Caixa-Preta"**: Código sem comentários explicativos será considerado não-conforme com o padrão de excelência técnica.

---

## 2. Estrutura Canônica de Pastas do Repositório

O repositório Git deve manter obrigatoriamente a árvore abaixo:

```text
Trabalho_Edilberto/
├── docs/
│   ├── requisitos/
│   │   ├── RF-001-cadastro-hospede.md        <-- DOCUMENTO OFICIAL DA ENTREGA ATUAL
│   │   └── ... (próximos RFs)
│   └── api/
│       └── swagger.json (ou openapi.json)     <-- Contrato OpenAPI gerado pelo FastAPI
│
├── src/
│   ├── rf-001-cadastro-hospede/
│   │   ├── index.html                        <-- HTML com CSS embutido e Design Antisslop
│   │   ├── app.js                            <-- Cliente JavaScript (5 estados e validação)
│   │   ├── main.py                           <-- Backend FastAPI com Rate Limiting e Security Headers
│   │   ├── schemas.py                        <-- Schemas Pydantic v2 com validação Módulo 11
│   │   ├── models.py                         <-- Modelos ORM SQLAlchemy
│   │   ├── database.py                       <-- Provedor de sessão de banco
│   │   ├── requirements.txt                  <-- Dependências Python
│   │   └── README.md                         <-- Guia local de execução do RF
│   └── ...
│
├── database/
│   ├── ddl/
│   │   └── rf-001-hospedes-ddl.sql           <-- CREATE TABLE, CONSTRAINTS e ÍNDICES (Supabase PostgreSQL / SQLite)
│   └── seeds/
│       └── hospedes-seeds.sql                <-- Carga de dados de teste (Seeds)
│
├── regras/
│   ├── front.md                              <-- Regras de UI, Design Tokens e Estados (SPA Vanilla)
│   ├── back.md                               <-- Arquitetura Backend, Segurança, Supabase e Endpoints
│   ├── DB.md                                 <-- Especificação do Banco de Dados (Supabase PostgreSQL / SQLite)
│   └── documentação.md                       <-- Este manual de governança e rubrica
│
├── README.md                                 <-- Guia geral do repositório
└── .gitignore                                <-- Exclusão de venv, __pycache__, .env
```

---

## 3. Os 7 Tópicos Obrigatórios do Documento (`RF-NNN.md`)

Todo documento de especificação deve preencher integralmente as 7 seções avaliadas:

### 🎯 Tópico 1: Identificação do Requisito (Peso: 2%)
- **ID:** `RF-XXX` (ex.: `RF-001`).
- **Título:** Claro, preciso e orientado ao domínio de hotelaria.
- **Tipo:** Requisito Funcional.
- **Prioridade:** ALTA / MÉDIA / BAIXA (justificando o bloqueio de outras tarefas).
- **Complexidade:** Estimada em Story Points (ex.: 5 SP) com justificativa técnica.
- **Status:** CONCLUÍDO / EM DESENVOLVIMENTO.
- **Breve Descrição:** Resumo executivo em 2 a 3 linhas.

### 📋 Tópico 2: Descrição e Atores (Peso: 10%)
- **Por que este requisito existe?** Mínimo de 3 a 5 benefícios claros de negócio.
- **Contexto do Negócio:** Explicação operacional do cenário no hotel.
- **Atores do Sistema:** Mínimo de 3 atores mapeados (ex.: Recepcionista, Gerente Geral, Sistema Automático).
- **Matriz de Permissões CRUD:** Cada ator deve ter suas ações explicitadas (`CREATE`, `READ`, `UPDATE`, `DELETE`).

### 🔄 Tópico 3: Casos de Uso + Requisitos Não-Funcionais (Peso: 20%)
- **Pré-Condições:** No mínimo 3 condições necessárias para disparar a ação.
- **Pós-Condições:** Cenário de **Sucesso** e cenário de **Falha** detalhados.
- **Fluxo Principal:** Passo a passo detalhado contendo **8 ou mais passos numerados**.
- **Fluxos Alternativos:** No mínimo 3 fluxos de exceção (ex.: A1: E-mail duplicado, A2: CPF inválido pelo algoritmo Módulo 11, A3: Limite de taxa excedido).
- **Regras de Negócio (RN):** Tabela estruturada com no mínimo **6 regras** (`RN-01` a `RN-06`), cobrindo unicidade, validação algorítmica, campos obrigatórios, retenção de dados e auditoria.
- **Requisitos Não-Funcionais (RNF):** Tabela estruturada com no mínimo **3 requisitos** (`RNF-01` a `RNF-03`), contendo Atributo, Requisito, Métrica e Justificativa.

### 🎨 Tópico 4: Protótipo Funcional (Peso: 40% — Crítico)
⚠️ **Sem funcionalidade prática = 0% neste tópico (perde 40% da nota do RF).**
- **Artefatos Entregues:** Arquivo `index.html` com CSS embutido + código-fonte backend/frontend + script DDL do banco.
- **5 Estados de Tela Comprovados em Mockup e Código:**
  1. Vazio / Inicial
  2. Preenchido com validação visual
  3. Carregando (Loading com Spinner)
  4. Erro de validação contextual
  5. Sucesso com exibição do identificador gerado (`HSP-2026-XXXX` ou `UUID`)
- **Acessibilidade e Semântica:** HTML semântico, conformidade com `regras/front.md`.
- **Persistência Real Comprovável:** Dados persistindo em banco relacional.
- **Deploy:** URL pública acessível (Túnel Cloudflare / Vercel / GitHub Pages).

### 🏗️ Tópico 5: Arquitetura e ADR (Peso: 15%)
- **Diagrama de Componentes:** Diagrama em Mermaid detalhando Frontend, Backend API (FastAPI) e Banco de Dados (MySQL).
- **Mínimo de 4 ADRs (Architecture Decision Records):**
  - Cada ADR deve conter: `ID`, `Status`, `Contexto`, `Decisão`, `Alternativas Consideradas` e `Consequências`.
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
- Arquivo `docs/api/swagger.json` presente no repositório.
- Documentação completa de todos os métodos HTTP do RF (`POST /api/v1/hospedes`, `GET /api/v1/hospedes`).
- Códigos HTTP de status documentados: `201 Created`, `400 Bad Request`, `409 Conflict`, `422 Unprocessable Entity`, `500 Internal Server Error`.
- Schemas de request e response detalhados.

---

## 4. Regras para Geração do Pacote de Entrega (ZIP)

1. Nome do arquivo ZIP rigorosamente padronizado:  
   `GRUPO-[99]-SEMANA-[99].zip` (exemplo: `GRUPO-06-SEMANA-01.zip`).
2. Remover pastas temporárias e ambientes virtuais antes de compactar (`.venv`, `__pycache__`, `node_modules`).
3. Manter a árvore canônica íntegra dentro do arquivo compactado.
