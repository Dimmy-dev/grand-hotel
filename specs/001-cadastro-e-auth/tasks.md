# Plano de Tarefas Atômicas de Implementação (tasks.md)

**Feature ID**: `specs/001-cadastro-e-auth`  
**Spec**: [spec.md](file:///c:/Users/Dimi/Desktop/Trabalho_Edilberto/specs/001-cadastro-e-auth/spec.md) | **Plan**: [plan.md](file:///c:/Users/Dimi/Desktop/Trabalho_Edilberto/specs/001-cadastro-e-auth/plan.md)  
**Status**: Ready for Execution via `/07-speckit.implement`  
**Regra de Ouro**: Cada tarefa é atômica (executável em ~15 min), autoexplicativa e amplamente comentada.

---

## 📋 Fase 1: Fundação de Dados e Scripts SQL (DDL & Seeds)

- [x] **[T-001]** Criar o script DDL canônico em `database/ddl/rf-001-hospedes-ddl.sql` contendo `tb_operadores`, `tb_sessoes`, `tb_hospedes` e `tb_audit_logs` compatível com Supabase PostgreSQL e SQLite.
- [x] **[T-002]** Criar o script de carga inicial em `database/seeds/hospedes-seeds.sql` com os operadores de teste (Recepcionista, Gerente Geral e Admin com senhas em hash Bcrypt) e 3 hóspedes de exemplo para homologação.

---

## ⚙️ Fase 2: Camada de Backend (FastAPI, SQLAlchemy e Schemas)

- [x] **[T-003]** Criar o arquivo de dependências `src/rf-001-cadastro-hospede/requirements.txt` (FastAPI, Uvicorn, SQLAlchemy, Pydantic[email], Passlib[bcrypt], Psycopg2-binary).
- [x] **[T-004]** Implementar `src/rf-001-cadastro-hospede/database.py` com o provedor de conexão resiliente (tenta conectar ao Supabase via `DATABASE_URL` e faz fallback automático para SQLite `hotel_grand_plaza.db`).
- [x] **[T-005]** Implementar `src/rf-001-cadastro-hospede/models.py` mapeando as entidades ORM `OperadorModel`, `SessaoModel`, `HospedeModel` e `AuditLogModel` com campos autodocumentados.
- [x] **[T-006]** Implementar `src/rf-001-cadastro-hospede/schemas.py` com DTOs Pydantic v2:
  - Função matemática de validação de CPF por **Módulo 11** com comentários explicativos linha a linha.
  - Sanitização de texto anti-XSS com `html.escape`.
  - Schemas `HospedeCreateSchema`, `HospedeResponseSchema`, `LoginSchema` e Envelope de resposta padrão.
- [x] **[T-007]** Implementar `src/rf-001-cadastro-hospede/main.py`:
  - Configuração do FastAPI, Middlewares de CORS, Rate Limiter por IP (30 req/min) e Security Headers (`nosniff`, `DENY`).
  - Rota `POST /api/v1/auth/login` emitindo cookie HttpOnly com hash da sessão gravado em `tb_sessoes`.
  - Rota `POST /api/v1/auth/logout` invalidando o cookie e a sessão no banco.
  - Rota `POST /api/v1/hospedes` gravando novo hóspede com Prepared Statements, prevenção de duplicidade (HTTP 409) e auditoria LGPD.
  - Rota `GET /api/v1/hospedes` listando hóspedes cadastrados.
  - Rota utilitária `/export-swagger-json` para exportar o contrato OpenAPI automaticamente para `docs/api/swagger.json`.

---

## 🎨 Fase 3: Camada de Frontend SPA (HTML5 + CSS Embutido + JS)

- [x] **[T-008]** Implementar a interface completa `src/rf-001-cadastro-hospede/index.html`:
  - CSS Embutido consumindo os Design Tokens Antisslop de `regras/front.md` (paleta Slate, botão azul corporativo, sem emojis).
  - Estrutura semântica SPA com duas visões: `<section id="view-login">` e `<section id="view-app">`.
  - Formulário com os 5 estados visuais previstos (Inicial, Válido, Loading com spinner SVG inline, Erro contextual e Sucesso com exibição de UUID).
  - Tabela responsiva de listagem em tempo real dos hóspedes cadastrados.
- [x] **[T-009]** Implementar a lógica modular em `src/rf-001-cadastro-hospede/app.js`:
  - Funções amplamente comentadas explicando cada etapa do DOM e manipulação de eventos.
  - Validação inline do CPF com o algoritmo Módulo 11 no cliente (validação dual).
  - Máscaras dinâmicas de CPF e Telefone no evento `input` sem bloquear colagem (`paste`).
  - Máquina de estados visual alternando dinamicamente entre os 5 estados sem recarregar a tela.
  - Chamadas `fetch` com `{ credentials: "include" }` para transporte transparente dos cookies HttpOnly.
  - Camada de resiliência local em `localStorage` para fallback caso a conexão caia.

---

## 📚 Fase 4: Documentação Oficial e Exportação do Contrato

- [x] **[T-010]** Exportar o contrato OpenAPI `docs/api/swagger.json` a partir do endpoint do backend.
- [x] **[T-011]** Consolidar o documento oficial de entrega `docs/requisitos/RF-001-cadastro-hospede.md` preenchendo integralmente os 7 tópicos da rubrica (100% de pontuação).
- [x] **[T-012]** Criar `src/rf-001-cadastro-hospede/README.md` com o guia passo a passo de como rodar localmente e no WSL.
