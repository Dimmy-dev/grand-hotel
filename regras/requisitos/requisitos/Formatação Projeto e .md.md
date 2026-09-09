# DOCUMENTO DE ESPECIFICAÇÃO DE REQUISITOS E ARQUITETURA SEGURA (SSD)

## Laboratório de Inovação III — Prof. Edilberto Silva — 2026

**Este documento é o guia técnico completo do seu projeto. Cada requisito funcional será avaliado com base neste padrão.**

⚠️ **IMPORTANTE:** Cada entrega cobre **APENAS UM REQUISITO FUNCIONAL** (ex: RF-001 Cadastro de Hóspede). Não misture múltiplos requisitos em um mesmo documento.

---

## 1. METADADOS DO PROJETO E DA EQUIPE

### 1.1 Composição da Equipe

Preencha a tabela abaixo com os integrantes do seu grupo:

| ID | Nome Completo | Papel Primário | Papel Secundário | E-mail / Contato |
| :---: | :--- | :--- | :--- | :--- |
| 1 | [Nome] | Scrum Master | Fullstack | [email] |
| 2 | [Nome] | Desenvolvedor Front-End | — | [email] |
| 3 | [Nome] | Desenvolvedor Back-End | — | [email] |
| 4 | [Nome] | DBA / Banco de Dados | — | [email] |
| 5 | [Nome] | QA / SecDevOps | — | [email] |
| 6 | [Nome] | Fullstack (opcional) | — | [email] |

**Integrantes (nomes e e-mails):**  
[Inserir todos os nomes dos integrantes do grupo e e-mails conforme modelo do Moodle (edilberto123456789@edu.df.senac.br) separados por ";"]

**Observação Importante:** Todos os integrantes devem ser capazes de explicar qualquer parte do código durante a apresentação. Não há "passageiro".

### 1.2 Identificação

- **NOME_DO_PROJETO:** [Nome do Sistema - máx 50 caracteres]
  - *Exemplo: Grand Plaza Hotel Management System*

- **DESCRICAO_BREVE:** [1-2 linhas sobre o que o sistema faz]
  - *Exemplo: Sistema web para gerenciamento completo de hóspedes, reservas, check-in/check-out e faturamento de hotel.*

### 1.3 Localização dos Artefatos

- **LINK_REPOSITORIO_GITHUB:** <https://github.com/[seu-usuario]/[seu-repo>]
- **BRANCH_PRINCIPAL:** main ou develop
- **LINK_APLICACAO_DEPLOY:** https://[seu-projeto].github.io (GitHub Pages) ou Vercel, Netlify, etc.
- **LINK_BANCO_DADOS:** [Supabase, Firebase, MongoDB Atlas, etc.] (com acesso de leitura para professor)
- **LINK_API_SWAGGER:** https://[seu-backend]/api-docs (Documentação OpenAPI/Swagger)
- **LINK_DEMONSTRAÇÃO:** [URL funcional da aplicação em produção]

---

## 2. ESTRUTURA DE DIRETÓRIOS DO PROJETO

```
seu-projeto-arquitetura/
├── docs/
│   ├── requisitos/
│   │   ├── RF-001-cadastro-hospede.md (ENTREGA - DOCUMENTO ÚNICO)
│   │   ├── RF-002-alterar-hospede.md  (ENTREGA - DOCUMENTO ÚNICO)
│   │   └── ... (RF-XXX)
│   │
│   └── api/
│       └── swagger.json (ou openapi.json)
│
├── src/
│   ├── rf-001-cadastro-hospede/
│   │   ├── index.html (HTML com CSS embutido)
│   │   ├── app.js (Código-fonte JavaScript/Linguagem escolhida)
│   │   └── README.md (Como executar)
│   │
│   ├── rf-002-alterar-hospede/
│   │   ├── index.html
│   │   ├── app.js
│   │   └── README.md
│   └── ... (rf-XXX)
│
├── database/
│   ├── ddl/
│   │   ├── rf-001-hospedes-ddl.sql (Script DDL - CREATE TABLE)
│   │   ├── rf-002-hospedes-alter-ddl.sql
│   │   └── ... (scripts por requisito)
│   │
│   └── seeds/
│       ├── hospedes-seeds.sql (Dados de exemplo)
│       └── ...
│
├── .github/
│   └── workflows/ (CI/CD - opcional)
│
├── README.md (guia geral do projeto)
└── .gitignore (incluir .env, node_modules, etc)
```

**Localização dos Arquivos:**

- **Documentação:** `docs/requisitos/RF-NNN-nome-requisito.md` (UM ÚNICO DOCUMENTO POR RF)
- **Código-fonte:** `src/rf-NNN-nome-requisito/` (HTML + CSS + JS/TypeScript/etc)
- **Scripts BD:** `database/ddl/rf-NNN-nome-requisito-ddl.sql`
- **API Swagger:** `docs/api/swagger.json` ou URL do Swagger UI
- **Aplicação Funcional:** Deployed em GitHub Pages ou nuvem com BD integrado

⚠️ **ATENÇÃO CRÍTICA:**

- Cada requisito é documentado em **UM ÚNICO arquivo Markdown**
- Código-fonte COMPLETO deve estar no repositório GitHub
- Script DDL completo deve estar em `database/ddl/`
- **Documentação API em Swagger/OpenAPI obrigatória**
- **Aplicação DEVE estar funcional e acessível online** (GitHub Pages + Backend com BD)
- Sem funcionalidade completa = **0% no tópico 4 (40%)**

---

## 3. DETALHAMENTO TÉCNICO DE UM REQUISITO FUNCIONAL

> **IMPORTANTE:** Cada requisito (RF-01 a RF-10) deve seguir **rigorosamente** a estrutura abaixo com seus respectivos percentuais. Isso permite validação automática via IA e avaliação consistente pelo professor.

---

## TEMPLATE PADRÃO DE REQUISITO FUNCIONAL COM CRITÉRIOS DE PONTUAÇÃO

### RF-XX: NOME DO REQUISITO

**⚠️ LEMBRETE:** Este documento cobre APENAS um requisito. Para múltiplos requisitos, crie documentos separados.

---

## 🎯 1. IDENTIFICAÇÃO DO REQUISITO (2%)

**Objetivo:** Identificar claramente o requisito, seu tipo e prioridade.

**O que avaliar:**

- ✅ ID do requisito presente (RF-XXX)
- ✅ Título claro e conciso
- ✅ Tipo identificado (Funcional)
- ✅ Prioridade definida (Alta/Média/Baixa)
- ✅ Complexidade estimada em story points

#### Exemplo Prático — RF-001: Cadastro de Hóspede

```markdown
**ID:** RF-001
**Título:** Cadastro de Novo Hóspede no Sistema
**Tipo:** Requisito Funcional
**Prioridade:** ALTA (bloqueia RF-002, RF-003 e RF-004)
**Complexidade:** MÉDIA (estimado 5 story points)
**Status:** EM DESENVOLVIMENTO
**Data de Criação:** 12/10/2026
**Última Atualização:** 12/10/2026

**Breve Descrição:**
O sistema deve permitir que recepcionistas cadastrem novos hóspedes com dados essenciais (nome, email, CPF, telefone, data de nascimento) para manter registro atualizado de clientes do hotel.
```

**CRITÉRIOS DE ACEITE PARA 2/2:**

- ✅ ID formatado corretamente (RF-XXX)
- ✅ Título descritivo (não genérico)
- ✅ Prioridade justificada
- ✅ Complexidade estimada em story points

---

## 📋 2. DESCRIÇÃO E ATORES (10%)

**Objetivo:** Descrever o requisito com clareza e identificar todos os atores envolvidos.

**O que avaliar:**

- ✅ Descrição detalhada do requisito
- ✅ Objetivo do negócio claro (3+ benefícios)
- ✅ Todos os atores identificados
- ✅ Papel de cada ator descrito
- ✅ Permissões mapeadas (CRUD)

#### Exemplo Prático — RF-001: Cadastro de Hóspede

**Descrição Detalhada:**

**Por que este requisito existe?**

O sistema precisa gerenciar informações de hóspedes para:

- Manter histórico de clientes
- Personalizar atendimento
- Gerar relatórios de ocupação
- Facilitar check-in/check-out
- Cumprir regulamentações de hospedagem

**Contexto do Negócio:**

Hotel precisa registrar dados de todos os hóspedes que chegam, coletando informações essenciais para contato, identificação e conformidade legal.

---

**Atores do Sistema:**

### 1. RECEPCIONISTA (Ator Principal)

- **Papel:** Cadastrar novo hóspede
- **Responsabilidade:** Inserir dados corretos, validar informações
- **Permissões:**
  - ✅ CREATE (criar novo hóspede)
  - ✅ READ (visualizar dados)
  - ❌ UPDATE (não pode editar dados de outros)
  - ❌ DELETE (não pode deletar)

### 2. GERENTE (Ator Secundário)

- **Papel:** Revisar e corrigir dados de hóspedes
- **Responsabilidade:** Supervisionar cadastros, resolver inconsistências
- **Permissões:**
  - ✅ CREATE, READ, UPDATE, DELETE

### 3. SISTEMA (Ator Automático)

- **Papel:** Validar dados, armazenar seguramente
- **Responsabilidade:** Validar formato, aplicar regras de negócio, auditar operações
- **Permissões:**
  - ✅ Todas operações

**CRITÉRIOS DE ACEITE PARA 10/10:**

- ✅ Descrição com 3+ benefícios de negócio
- ✅ Mínimo 3 atores descritos
- ✅ Papel de cada ator claro
- ✅ Permissões bem definidas (CRUD)

---

## 🔄 3. ESPECIFICAÇÃO DE CASOS DE USO + REQUISITOS NÃO-FUNCIONAIS (20%)

**Objetivo:** Descrever detalhadamente como o requisito é executado e seus RNF.

**O que avaliar:**

- ✅ Pré-condições definidas
- ✅ Pós-condições definidas (sucesso e falha)
- ✅ Fluxo principal com 8+ passos
- ✅ Fluxos alternativos (mínimo 3)
- ✅ Regras de negócio (RN-XX)
- ✅ Requisitos Não-Funcionais (mínimo 3)

#### Exemplo Prático — RF-001: Caso de Uso Completo

**Caso de Uso (UC-001): Realizar Cadastro de Hóspede**

### Pré-Condições

- ✅ Recepcionista autenticado no sistema
- ✅ Dados de conexão disponíveis
- ✅ Banco de dados funcionando

### Pós-Condições (Sucesso)

- ✅ Hóspede registrado com ID único no banco de dados
- ✅ Confirmação enviada por email para o hóspede
- ✅ Histórico de cadastro registrado na auditoria
- ✅ Recepcionista recebe confirmação visual no sistema

### Pós-Condições (Falha)

- ✅ Mensagem de erro exibida ao usuário
- ✅ Dados não salvos no banco de dados
- ✅ Tentativa registrada em log de auditoria
- ✅ Campo que causou erro é destacado

### Fluxo Principal

1. Recepcionista clica em botão "Novo Hóspede"
2. Sistema exibe formulário vazio com campos obrigatórios
3. Recepcionista preenche campo "Nome Completo"
4. Sistema valida formato do nome (mín. 3 caracteres)
5. Recepcionista preenche campo "Email"
6. Sistema valida formato do email (RFC 5322)
7. Recepcionista preenche campos: CPF, Telefone, Data de Nascimento
8. Sistema valida cada campo conforme regras de negócio
9. Recepcionista clica botão "Salvar"
10. Sistema valida todos os campos novamente (validação server-side)
11. Sistema verifica se email já existe (unicidade)
12. Sistema verifica se CPF já existe (unicidade)
13. Sistema criptografa dados sensíveis
14. Sistema salva novo hóspede no banco de dados com transação ACID
15. Sistema registra ação em tabela de auditoria
16. Sistema envia email de confirmação para o hóspede
17. Sistema exibe mensagem de sucesso: "Hóspede cadastrado com sucesso!"
18. Recepcionista vê novo hóspede na lista com opções de editar/visualizar

### Fluxo Alternativo A1: Email já cadastrado

```
6a.1. Sistema detecta email duplicado na validação server-side
6a.2. Exibe mensagem: "Este email já está cadastrado no sistema"
6a.3. Campo "Email" é destacado em vermelho
6a.4. Foco retorna ao campo "Email"
6a.5. Recepcionista pode tentar outro email ou ligar para suporte
6a.6. Tentativa registrada em log
```

### Fluxo Alternativo A2: CPF inválido

```
7a.1. Sistema detecta que CPF não passa no algoritmo módulo 11
7a.2. Exibe mensagem: "CPF inválido. Verifique o número"
7a.3. Campo "CPF" é destacado em vermelho
7a.4. Recepcionista corrige o CPF
7a.5. Sistema revalida o CPF
```

### Fluxo Alternativo A3: Conexão de rede falha

```
9a.1. Sistema tenta conectar ao banco de dados
9a.2. Falha de conexão detectada
9a.3. Sistema implementa retry automático (3 tentativas com backoff)
9a.4. Se falhar: exibe erro de conexão
9a.5. Exibe mensagem: "Erro ao conectar com servidor. Tente em alguns segundos"
9a.6. Habilita botão "Tentar Novamente"
```

### Regras de Negócio (RN)

| ID | Regra | Descrição |
| :---: | :--- | :--- |
| **RN-01** | Email Único | Email deve ser único no sistema; não permitir duplicatas |
| **RN-02** | CPF Válido | CPF deve ser validado pelo algoritmo módulo 11 |
| **RN-03** | Data Válida | Data de nascimento não pode ser futura ou anterior a 1900 |
| **RN-04** | Telefone Brasil | Telefone deve ter 11 dígitos (formato: 11999998888) |
| **RN-05** | Nome Obrigatório | Nome não pode estar vazio; mínimo 3 caracteres |
| **RN-06** | Criptografia | Dados sensíveis (CPF, telefone) criptografados em repouso |
| **RN-07** | Retenção Dados | Histórico mantido por 5 anos conforme regulamentação |
| **RN-08** | Auditoria | Toda operação de cadastro registrada com timestamp e IP |

### Requisitos Não-Funcionais (RNF)

| ID | Atributo | Requisito | Métrica | Justificativa |
| :---: | :--- | :--- | :--- | :--- |
| **RNF-01** | Performance | Resposta em <2 segundos | Tempo médio de resposta | UX: usuário não fica esperando |
| **RNF-02** | Escalabilidade | Suportar 100+ usuários simultâneos | Conexões concorrentes | Hotel pode ter múltiplas recepções |
| **RNF-03** | Disponibilidade | 99% uptime em produção | SLA medido | Negócio depende da aplicação |

**CRITÉRIOS DE ACEITE PARA 20/20:**

- ✅ Fluxo principal com 8+ passos
- ✅ Mínimo 3 fluxos alternativos
- ✅ Mínimo 6 Regras de Negócio
- ✅ Mínimo 3 Requisitos Não-Funcionais

---

## 🎨 4. PROTÓTIPO FUNCIONAL (HTML + CSS + CÓDIGO + BD + DEPLOY) (40%)

**Objetivo:** Implementação COMPLETA e FUNCIONAL da feature, com aplicação rodando em produção.

⚠️ **OBRIGATORIEDADE CRÍTICA:**

- ✅ Arquivo `index.html` com CSS embutido
- ✅ Código-fonte COMPLETO na linguagem escolhida (JavaScript, Python, Java, etc)
- ✅ Script DDL do banco de dados
- ✅ Aplicação FUNCIONANDO em GitHub Pages, Vercel, Netlify ou similar
- ✅ Banco de dados persistindo dados (Supabase, Firebase, MongoDB Atlas, etc)
- ✅ Sem funcionalidade completa = **0% neste tópico (PERDE 40% DA NOTA)**

**O que avaliar:**

- ✅ Arquivo HTML+CSS entregue (semântica correta)
- ✅ Código-fonte presente no repositório GitHub
- ✅ Script DDL criando tabelas necessárias
- ✅ Telas: vazio, preenchido, erro, carregando, sucesso
- ✅ CSS responsivo (mobile 320px, desktop 1024px)
- ✅ Validação visual (borda verde/vermelha, checkmark)
- ✅ Mensagens de erro claras
- ✅ Dados persistindo em BD (comprovável)
- ✅ Aplicação acessível via URL pública
- ✅ Demonstração prática funcionando

#### Exemplo Prático — RF-001: Mockup das Telas

**Mockup - Tela 1: Formulário Vazio (Estado Inicial)**

```
┌────────────────────────────────────────────────┐
│  ☰ Hotel Management  [Usuário ▼]              │
├────────────────────────────────────────────────┤
│                                                │
│  📝 Cadastro de Novo Hóspede                   │
│                                                │
│  Nome Completo: [_________________________]    │
│  Email:         [_________________________]    │
│  CPF:           [_________________________]    │
│  Telefone:      [_________________________]    │
│  Data Nascimento: [_________________________]   │
│                                                │
│  Observações:                                  │
│  [_________________________________]           │
│  [_________________________________]           │
│                                                │
│  [ SALVAR ]  [ CANCELAR ]  [ LIMPAR ]          │
│                                                │
└────────────────────────────────────────────────┘
```

**Mockup - Tela 2: Formulário Preenchido (Validação Visual)**

```
┌────────────────────────────────────────────────┐
│  ☰ Hotel Management  [Usuário ▼]              │
├────────────────────────────────────────────────┤
│                                                │
│  📝 Cadastro de Novo Hóspede                   │
│                                                │
│  Nome: [João da Silva              ] ✅        │
│  Email: [joao.silva@email.com      ] ✅        │
│  CPF: [12345678901                 ] ✅        │
│  Telefone: [(11) 99999-8888        ] ✅        │
│  Data Nascimento: [15/03/1990       ] ✅        │
│                                                │
│  Observações:                                  │
│  [Cliente VIP, pedir upgrade ao   ]            │
│  [check-in                        ]            │
│                                                │
│  [ SALVAR ]  [ CANCELAR ]  [ LIMPAR ]          │
│                                                │
└────────────────────────────────────────────────┘
```

**Mockup - Tela 3: Carregando (Processando)**

```
┌────────────────────────────────────────────────┐
│  ☰ Hotel Management  [Usuário ▼]              │
├────────────────────────────────────────────────┤
│                                                │
│         Salvando dados do hóspede...           │
│              ⟳  (spinner)                      │
│                                                │
│         Aguarde um momento...                  │
│                                                │
│  [ CANCELAR ]                                  │
│                                                │
└────────────────────────────────────────────────┘
```

**Mockup - Tela 4: Erro de Validação (Email Duplicado)**

```
┌────────────────────────────────────────────────┐
│  ☰ Hotel Management  [Usuário ▼]              │
├────────────────────────────────────────────────┤
│                                                │
│  ⚠️ ERRO ao cadastrar hóspede                  │
│  Este email já está cadastrado no sistema      │
│                                                │
│  Nome: [João Silva                 ] ✅        │
│  Email: [joao@email.com            ] ❌        │
│  Mensagem: Use outro email                     │
│  CPF: [12345678901                 ] ✅        │
│  Telefone: [(11) 99999-8888        ] ✅        │
│  Data Nascimento: [15/03/1990       ] ✅        │
│                                                │
│  [ SALVAR ]  [ CANCELAR ]  [ LIMPAR ]          │
│                                                │
└────────────────────────────────────────────────┘
```

**Mockup - Tela 5: Sucesso (Confirmação)**

```
┌────────────────────────────────────────────────┐
│  ☰ Hotel Management  [Usuário ▼]              │
├────────────────────────────────────────────────┤
│                                                │
│  ✅ Hóspede cadastrado com sucesso!            │
│                                                │
│  Dados salvos:                                 │
│  • Nome: João Silva                            │
│  • Email: joao.silva@email.com                 │
│  • ID Hóspede: HSP-2026-0001234                │
│                                                │
│  Confirmação enviada para: joao.silva@...     │
│                                                │
│  [ NOVO CADASTRO ]  [ VER DETALHES ]  [ VOLTAR ]│
│                                                │
└────────────────────────────────────────────────┘
```

**Descrição de Estados:**

- **Estado Normal:** Todos campos em branco, botões habilitados
- **Estado Preenchido:** Validação visual com checkmark verde
- **Estado Erro:** Campo inválido destacado em vermelho com mensagem
- **Estado Loading:** Spinner animado, botões desabilitados
- **Estado Sucesso:** Mensagem de confirmação com dados salvos

**Fluxo de Navegação:**

1. Página inicial → Clica "Novo Hóspede"
2. Abre modal/página de cadastro
3. Preenche dados
4. Clica "Salvar"
5. Se sucesso → Exibe mensagem + volta à lista
6. Se erro → Destaca campo + exibe mensagem + mantém dados

**Responsividade:**

- **Mobile (320px):** Layout single-column, campos full-width
- **Tablet (768px):** Layout single-column com padding maior
- **Desktop (1024px+):** Layout potencialmente two-column se apropriado

**CRITÉRIOS DE ACEITE PARA 40/40:**

- ✅ Arquivo index.html com CSS embutido criado
- ✅ Código-fonte completo no repositório GitHub
- ✅ Script DDL no banco de dados
- ✅ Mínimo 5 telas diferentes (vazio, preenchido, erro, loading, sucesso)
- ✅ HTML semanticamente correto
- ✅ CSS responsivo (mobile + desktop)
- ✅ Validação visual (borda verde/vermelha, checkmark)
- ✅ Mensagens de erro claras
- ✅ Estados diferentes bem definidos
- ✅ Dados persistindo em banco de dados
- ✅ **Aplicação FUNCIONANDO e ACESSÍVEL online**
- ✅ Demonstração prática durante apresentação

**⚠️ SEM FUNCIONALIDADE COMPLETA = 0% NESTE TÓPICO (PERDE 40% DA NOTA)**

---

## 🏗️ 5. ARQUITETURA E ADR (15%)

**Objetivo:** Descrever como o requisito será implementado tecnicamente.

**O que avaliar:**

- ✅ Diagrama de arquitetura (componentes)
- ✅ ADR (Architecture Decision Record) com 4+ decisões
- ✅ Padrão de design utilizado
- ✅ Tecnologias escolhidas com justificativas
- ✅ Fluxo de dados documentado

#### Exemplo Prático — RF-001: Arquitetura Completa

### Diagrama de Componentes

```
┌──────────────────────────────────────┐
│     Frontend (GitHub Pages)          │
│  HTML5 + CSS3 + JavaScript (ES2015+) │
│  • index.html (Formulário)           │
│  • app.js (Validação + API calls)    │
│  • Hospedado em GitHub Pages         │
└──────────────────┬───────────────────┘
                   │ HTTPS + CORS
                   ▼
┌──────────────────────────────────────┐
│      API REST Backend                │
│     Node.js + Express.js             │
│  • POST /api/hospedes (create)       │
│  • GET /api/hospedes (list)          │
│  • Middleware Autenticação (JWT)     │
│  • Validação (express-validator)     │
│  • Hospedado em Render/Railway/Heroku│
└──────────────────┬───────────────────┘
                   │ Transação ACID
                   ▼
┌──────────────────────────────────────┐
│     PostgreSQL/Supabase BD           │
│  • Tabela: tb_hospedes               │
│  • Tabela: tb_audit_logs             │
│  • Constraints (PK, FK, CHECK, UNQ)  │
│  • Índices (email, cpf)              │
│  • Backups automáticos               │
└──────────────────────────────────────┘
```

### ADR-001: PostgreSQL como Banco de Dados

**Status:** ACEITO

**Contexto:** Dados de hóspedes precisam de consistência ACID e escalabilidade.

**Decisão:** Usar PostgreSQL 14+ para armazenar dados de hóspedes.

**Alternativas:** MySQL (menos ACID), MongoDB (sem transações robustas)

**Consequências:** ✅ Seguro e escalável, ⚠️ Requer provisionamento

### ADR-002: Bcrypt para Hash de Senhas

**Status:** ACEITO

**Contexto:** Senhas devem ser armazenadas de forma segura e irreversível.

**Decisão:** Usar bcrypt com 12 rounds de salt.

**Consequências:** ✅ OWASP recomendado, ✅ Adaptativo

### ADR-003: REST API com Express.js

**Status:** ACEITO

**Contexto:** API escalável e simples para frontend.

**Decisão:** Express.js 4.18+ com Node.js 18 LTS.

**Consequências:** ✅ Rápido, ✅ JavaScript full-stack

### ADR-004: Validação Dual (Frontend + Backend)

**Status:** ACEITO

**Contexto:** Validação precisa em ambos os lados para UX e segurança.

**Decisão:** Frontend + Backend com mesma lógica.

**Consequências:** ✅ Seguro, ✅ Boa UX, ⚠️ Código duplicado

### Tecnologias Escolhidas

| Camada | Tecnologia | Versão | Justificativa |
| -------- | ----------- | -------- | --------------- |
| Frontend | HTML5 + CSS3 | 2023 | Web padrão |
| Frontend | JavaScript | ES2015+ | Interatividade |
| Backend | Node.js | 18 LTS | Runtime JavaScript |
| Backend | Express.js | 4.18+ | Performance |
| BD | PostgreSQL | 14+ | ACID, confiável |
| Hash | bcrypt | 5+ | OWASP recomendado |
| Validação | express-validator | 7+ | Robusta |

**CRITÉRIOS DE ACEITE PARA 15/15:**

- ✅ Diagrama de componentes claro
- ✅ 4+ ADRs com Status, Contexto, Decisão, Alternativas
- ✅ Tecnologias justificadas
- ✅ Fluxo de dados documentado

---

## 🔒 6. VALIDAÇÃO DE SEGURANÇA OWASP (10%)

**Objetivo:** Verificar implementação de segurança com base nos Top 10 OWASP.

**O que avaliar:**

- ✅ Mínimo 1 (máximo 3) controle OWASP implementado
- ✅ Controle com: Vulnerabilidade, Implementação, Teste
- ✅ Código-fonte mostrando proteção
- ✅ Evidência de testes de segurança

#### Exemplo Prático — RF-001: Um Controle OWASP Implementado

### A03: Injection (SQL Injection)

**Vulnerabilidade:** SQL Injection através de input do usuário

**Implementação:**

```javascript
// ❌ NUNCA FAÇA ISSO (SQL Injection):
const query = `SELECT * FROM tb_hospedes WHERE email = '${email}'`;

// ✅ SEMPRE FAÇA ISSO (Prepared Statements):
const hospede = await db.query(
    'SELECT * FROM tb_hospedes WHERE email = $1',
    [email]
);

// Ou com ORM:
const hospede = await Hospede.findOne({ where: { email } });
```

**Teste:**

```javascript
// Tentar injetar SQL
const email = "test@email.com' OR '1'='1";
const hospede = await db.query(
    'SELECT * FROM tb_hospedes WHERE email = $1',
    [email]
);
// Resultado: Seguro - trata como string literal, não como SQL
```

**CRITÉRIOS DE ACEITE PARA 10/10:**

- ✅ 1 controle OWASP implementado
- ✅ Vulnerabilidade descrita
- ✅ Código mostrando proteção
- ✅ Teste de segurança documentado

---

## 📚 7. DOCUMENTAÇÃO API (SWAGGER/OPENAPI) (3%)

**Objetivo:** Documentar endpoints REST da API usando Swagger/OpenAPI.

**O que avaliar:**

- ✅ Arquivo Swagger/OpenAPI criado (swagger.json ou openapi.yaml)
- ✅ Todos os endpoints documentados
- ✅ Modelos de requisição/resposta definidos
- ✅ Códigos HTTP documentados
- ✅ Autenticação documentada

#### Exemplo Prático — RF-001: Documentação Swagger

**Arquivo:** `docs/api/swagger.json`

```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Hotel Management API",
    "version": "1.0.0"
  },
  "paths": {
    "/hospedes": {
      "post": {
        "summary": "Cadastrar novo hóspede",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["nome", "email", "cpf"],
                "properties": {
                  "nome": {"type": "string", "example": "João Silva"},
                  "email": {"type": "string", "example": "joao@email.com"},
                  "cpf": {"type": "string", "example": "12345678901"}
                }
              }
            }
          }
        },
        "responses": {
          "201": {"description": "Hóspede criado com sucesso"},
          "400": {"description": "Dados inválidos"}
        }
      }
    }
  }
}
```

**Para servir Swagger UI no backend:**

```javascript
const swaggerUi = require('swagger-ui-express');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(require('./swagger.json')));
```

**CRITÉRIOS DE ACEITE PARA 3/3:**

- ✅ Arquivo Swagger/OpenAPI criado
- ✅ Todos os endpoints POST/GET documentados
- ✅ Modelos de requisição/resposta definidos
- ✅ Códigos HTTP documentados
- ✅ Autenticação documentada (JWT)

---

## 📊 RESUMO DE PONTUAÇÃO

Para cada requisito funcional (RF-01 a RF-10), a pontuação segue este modelo:

```
┌────────────────────────────────────────────┬──────────┬──────────────┐
│ Tópico de Avaliação                        │ Peso     │ Seu Score    │
├────────────────────────────────────────────┼──────────┼──────────────┤
│ 1. Identificação do Requisito              │ 2%       │ ___/2        │
│ 2. Descrição e Atores                      │ 10%      │ ___/10       │
│ 3. Casos de Uso + Requisitos Não-Func.     │ 20%      │ ___/20       │
│ 4. Protótipo Funcional (HTML+CSS+Código)   │ 40%      │ ___/40       │
│ 5. Arquitetura e ADR                       │ 15%      │ ___/15       │
│ 6. Validação de Segurança OWASP            │ 10%      │ ___/10       │
│ 7. Documentação API (Swagger/OpenAPI)      │ 3%       │ ___/3        │
├────────────────────────────────────────────┼──────────┼──────────────┤
│ TOTAL POR REQUISITO                        │ 100%     │ ___/100      │
└────────────────────────────────────────────┴──────────┴──────────────┘

Fórmula de Cálculo por Requisito:
Score Total (%) = (T1×2%) + (T2×10%) + (T3×20%) + (T4×40%) + (T5×15%) + (T6×10%) + (T7×3%)
                = Score de 0% a 100%

Nota Final da Disciplina:
RF-01 Score × 10% = ___% (pontos para disciplina)
RF-02 Score × 10% = ___% (pontos para disciplina)
...
RF-10 Score × 10% = ___% (pontos para disciplina)
────────────────────────────────────────────────
NOTA FINAL = ___% ✅ APROVADO (≥60%) ou ❌ REPROVADO (<60%)

⚠️ CRÍTICO: Se o Protótipo (Tópico 4) não funcionar = 0% neste tópico = perde 40% da nota do RF
```

---

## ✅ INSTRUÇÕES FINAIS PARA ENTREGA

### Para o Aluno (cada semana)

1. **Crie UM ÚNICO documento por requisito:**
   - Exemplo: `docs/requisitos/RF-001-cadastro-hospede.md`
   - Não misture múltiplos RFs no mesmo documento

2. **Implemente o código-fonte COMPLETO:**
   - Pasta: `src/rf-001-cadastro-hospede/`
   - Arquivos: `index.html`, `app.js`, `README.md`
   - Código limpo, comentado e funcional

3. **Crie o Script DDL do Banco:**
   - Arquivo: `database/ddl/rf-001-hospedes-ddl.sql`
   - Tabelas, constraints, índices, tudo necessário

4. **Crie Documentação Swagger:**
   - Arquivo: `docs/api/swagger.json`
   - Documente todos os endpoints do requisito

5. **Deploy a aplicação FUNCIONANDO:**
   - GitHub Pages (recomendado) ou Vercel, Netlify
   - Com banco de dados integrado (Supabase, Firebase, etc)
   - URL pública testável pelo professor

6. **Implemente Segurança OWASP:**
   - 1 controle implementado (ex: SQL Injection)
   - Com código e teste

7. **Commit no Git:**

   ```bash
   git add docs/requisitos/RF-001-cadastro-hospede.md
   git add src/rf-001-cadastro-hospede/
   git add database/ddl/rf-001-hospedes-ddl.sql
   git add docs/api/swagger.json
   git commit -m "[RF-001] Cadastro de Hóspede - Completo + Deploy + Swagger + Segurança OWASP"
   git push origin develop
   ```

8. **Entregue no Moodle:**
   - Arquivo Markdown: `RF-001-cadastro-hospede.md`
   - Link GitHub: `https://github.com/seu-usuario/seu-repo`
   - URL da Aplicação: `https://seu-usuario.github.io/seu-repo/rf-001`
   - URL da API Docs: `https://seu-backend.render.com/api-docs`
   - Credenciais de Teste (se necessário)

---

## ✅ CHECKLIST FINAL — PERCENTUAIS (Total = 100%)

Preencha este checklist ao finalizar cada entrega:

```
REQUISITO FUNCIONAL: RF-XXX - NOME DO REQUISITO
═════════════════════════════════════════════════════════════════

TÓPICO 1: IDENTIFICAÇÃO DO REQUISITO (2%)
════════════════════════════════════════════════
☑ ID do requisito presente (RF-XXX)
☑ Título claro e descritivo
☑ Prioridade definida (Alta/Média/Baixa)
☑ Complexidade estimada em story points

STATUS: ___/2 | Percentual: ___%

---

TÓPICO 2: DESCRIÇÃO E ATORES (10%)
════════════════════════════════════════════════
☑ Descrição detalhada do requisito
☑ Objetivo de negócio claro (3+ benefícios)
☑ Mínimo 3 atores identificados
☑ Papel e responsabilidade de cada ator
☑ Permissões mapeadas (CRUD)

STATUS: ___/10 | Percentual: ___%

---

TÓPICO 3: CASOS DE USO + RNF (20%)
════════════════════════════════════════════════
☑ Pré-condições definidas (mín. 3)
☑ Pós-condições definidas (sucesso e falha)
☑ Fluxo principal com 8+ passos
☑ Mínimo 3 fluxos alternativos
☑ Mínimo 6 Regras de Negócio
☑ Mínimo 3 Requisitos Não-Funcionais

STATUS: ___/20 | Percentual: ___%

---

TÓPICO 4: PROTÓTIPO FUNCIONAL (40%) ⚠️ CRÍTICO
════════════════════════════════════════════════════════════════
☑ Arquivo `index.html` com CSS embutido criado
☑ Código-fonte COMPLETO na linguagem escolhida
☑ Script DDL do banco criado
☑ HTML semanticamente correto
☑ CSS responsivo (mobile 320px + desktop 1024px)
☑ Mínimo 5 telas diferentes (vazio, preenchido, erro, loading, sucesso)
☑ Validação visual (borda verde/vermelha, checkmark)
☑ Mensagens de erro claras
☑ Dados persistindo em banco de dados
☑ Aplicação FUNCIONANDO em URL pública
☑ Demonstração prática durante apresentação

⚠️ SEM FUNCIONALIDADE COMPLETA: RECEBE 0% NESTE TÓPICO = PERDE 40%!

STATUS: ___/40 | Percentual: ___%

---

TÓPICO 5: ARQUITETURA E ADR (15%)
════════════════════════════════════════════════
☑ Diagrama de arquitetura claro
☑ Mínimo 4 ADRs estruturados
☑ Cada ADR com: Status, Contexto, Decisão, Alternativas
☑ Tecnologias justificadas
☑ Fluxo de dados documentado

STATUS: ___/15 | Percentual: ___%

---

TÓPICO 6: VALIDAÇÃO DE SEGURANÇA OWASP (10%)
════════════════════════════════════════════════
☑ Mínimo 1 controle OWASP (máximo 3)
☑ Controle com: Vulnerabilidade → Implementação → Teste
☑ Código-fonte mostrando proteção
☑ Testes de segurança documentados
☑ Screenshots ou evidência de testes

STATUS: ___/10 | Percentual: ___%

---

TÓPICO 7: DOCUMENTAÇÃO API (SWAGGER/OPENAPI) (3%)
════════════════════════════════════════════════════════════════
☑ Arquivo swagger.json ou openapi.yaml criado
☑ Todos os endpoints POST/GET documentados
☑ Modelos de requisição/resposta definidos
☑ Códigos HTTP documentados (200, 201, 400, 401, 409)
☑ Autenticação documentada (JWT/Bearer Token)

STATUS: ___/3 | Percentual: ___%

---

RESULTADO FINAL POR REQUISITO
════════════════════════════════════════════════════════════════

T1 (2%):   ___/2   × 2%   = ___% do total
T2 (10%):  ___/10  × 10%  = ___% do total
T3 (20%):  ___/20  × 20%  = ___% do total
T4 (40%):  ___/40  × 40%  = ___% do total (FUNCIONAL: ✅ / ❌)
T5 (15%):  ___/15  × 15%  = ___% do total
T6 (10%):  ___/10  × 10%  = ___% do total
T7 (3%):   ___/3   × 3%   = ___% do total
           ─────────────────────────────────────
TOTAL:     ___/100 = ___% 

✅ ACEITO (≥ 60%) ou ❌ REPROVADO (< 60%)
```

---

## APÊNDICE A: CHECKLIST DE PREENCHIMENTO INICIAL

Antes de entregar este documento, confirme que:

- [ ] **Seção 1 (Metadados):** Preenchida com nome, descrição, repositório
- [ ] **Seção 2 (Estrutura):** Compreendida e criada no GitHub
- [ ] **Seção 3 (Detalhamento):** Completa para o RF com:
  - [ ] Identificação (2%) ✓
  - [ ] Descrição e Atores (10%) ✓
  - [ ] Casos de Uso + RNF (20%) ✓
  - [ ] Protótipo Funcional (40%) ✓
  - [ ] Arquitetura e ADR (15%) ✓
  - [ ] Validação OWASP (10%) ✓
  - [ ] Documentação Swagger (3%) ✓
- [ ] **Documentação:** Um ÚNICO arquivo MD por RF
- [ ] **Código-fonte:** Completo no repositório GitHub
- [ ] **Script DDL:** Criado em database/ddl/
- [ ] **Swagger/OpenAPI:** Criado em docs/api/
- [ ] **Segurança OWASP:** 1-3 controles implementados
- [ ] **Deploy:** Aplicação FUNCIONANDO em URL pública
- [ ] **Testes:** Evidência de funcionalidade comprovada

---

**Documento de Requisitos v12.2**  
**Laboratório de Inovação III — FACSENAC — Prof. Edilberto Silva 2026**

*"Qualidade, Segurança e Funcionalidade = Sucesso!"*  
*"Fé, Força e Foco!"* 🚀
