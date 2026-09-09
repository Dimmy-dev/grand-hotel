# Feature Specification: Cadastro Seguro de Hóspede e Autenticação de Operador

**Feature Branch / ID**: `specs/001-cadastro-e-auth`  
**Created**: 2026-09-08  
**Status**: Approved / Ready for Implementation  
**Normas Vinculadas**: `regras/back.md`, `regras/front.md`, `regras/DB.md`, `regras/documentação.md`

---

## 1. Visão Geral e Objetivos de Negócio

O sistema hoteleiro Grand Plaza Management necessita de uma plataforma unificada para recepção de hóspedes que atenda simultaneamente aos requisitos legais da Embratur/FNRH, previna fraudes cadastrais via validação algorítmica matemática e assegure controle de acesso administrativo com proteção contra invasão (OWASP Top 10).

---

## 2. Histórias de Usuário Priorizadas (User Stories)

### User Story 1 — Cadastro de Novo Hóspede com Validação Estrita (Prioridade: P1 — Mandatória)

> **Como** recepcionista autenticado no sistema do hotel,  
> **Quero** cadastrar novos hóspedes preenchendo seus dados essenciais (Nome, E-mail, CPF, Telefone, Data de Nascimento e Observações),  
> **Para que** o hóspede seja registrado com identificador universal único (UUID) e seus dados fiquem disponíveis para futuras reservas e check-in.

- **Por que esta prioridade**: É o núcleo funcional do **RF-001** (Semana 1) exigido na rubrica do Prof. Edilberto.
- **Teste Independente**: Preencher o formulário no frontend; o sistema valida o CPF via Módulo 11, grava no banco de dados e exibe a tela de sucesso com o UUID gerado sem recarregar a página.

#### Cenários de Aceite (Gherkin):
1. **Cenário 1.1 (Sucesso - Cadastro Válido)**:
   - **Dado** que o operador preencheu Nome ("Carlos Eduardo Mendes"), E-mail ("carlos@email.com"), CPF válido ("12345678901"), Telefone ("11987654321") e Data de Nascimento válida,
   - **Quando** clicar em "Confirmar Cadastro de Hóspede",
   - **Então** o sistema exibe o spinner de carregamento, envia o payload para `POST /api/v1/hospedes`, grava o registro no banco relacional com chave primária e UUID público e transiciona para o **Estado de Sucesso** exibindo o código gerado.

2. **Cenário 1.2 (Falha - CPF Inválido Módulo 11)**:
   - **Dado** que o operador digitou um CPF com dígitos verificadores incorretos ou todos os números iguais (ex: `111.111.111-11`),
   - **Quando** sair do campo (`blur`) ou tentar salvar,
   - **Então** o campo CPF deve ficar destacado com borda vermelha (`--color-error-border`), o botão salvar é bloqueado e a mensagem contextual *"CPF inválido segundo o algoritmo módulo 11"* é exibida.

3. **Cenário 1.3 (Falha - Conflito de E-mail / Duplicidade)**:
   - **Dado** que o e-mail informado já existe na tabela `tb_hospedes`,
   - **Quando** o backend processar a requisição,
   - **Então** a API deve responder com `HTTP 409 Conflict`, o formulário cancela o loading e exibe *"Este endereço de e-mail já está cadastrado no sistema"* sem apagar os outros dados preenchidos.

---

### User Story 2 — Autenticação de Operadores e Controle de Sessão (Prioridade: P2)

> **Como** operador da recepção ou gerente do hotel,  
> **Quero** autenticar-me com meu e-mail institucional e senha no início do meu turno,  
> **Para que** minhas operações no sistema sejam rastreadas na trilha de auditoria e operadores não-autorizados não acessem os dados dos clientes.

- **Por que esta prioridade**: Garante a governança de segurança OWASP A07 e fornece o contexto de operador para preenchimento de `tb_audit_logs`.
- **Teste Independente**: Fazer login com credenciais de teste (`recepcao@grandplaza.com` / `Hotel@2026Recep`), receber o cookie HttpOnly e acessar a visão administrativa SPA.

#### Cenários de Aceite (Gherkin):
1. **Cenário 2.1 (Login Bem-Sucedido)**:
   - **Dado** que o operador informa credenciais válidas na tela de login,
   - **Quando** submeter o formulário de login,
   - **Então** o backend valida o hash Bcrypt da senha, gera um token aleatório seguro, grava o hash SHA-256 da sessão em `tb_sessoes`, responde com `Set-Cookie: HttpOnly` e a SPA transiciona para a visão do painel de hóspedes.

2. **Cenário 2.2 (Logout com Encerramento de Sessão)**:
   - **Dado** que o operador está autenticado,
   - **Quando** clicar no botão "Encerrar Turno / Sair",
   - **Então** o backend marca a sessão como inativa (`is_active = 0`) em `tb_sessoes`, expira o cookie e a interface retorna suavemente à tela de login.

---

## 3. Regras de Negócio Inegociáveis (RN)

| ID | Regra | Descrição e Validação |
| :---: | :--- | :--- |
| **RN-01** | **E-mail Único** | O e-mail do hóspede deve ser estritamente único no banco de dados (`UNIQUE KEY`). |
| **RN-02** | **CPF Módulo 11** | CPF validado matematicamente nos 2 dígitos verificadores (rejeitar sequências iguais). |
| **RN-03** | **Data de Nascimento** | Não permitir datas no futuro nem anteriores a 01/01/1900. |
| **RN-04** | **Sanitização Anti-XSS** | Textos livres (Nome e Observações) devem sofrer escape HTML antes de armazenamento. |
| **RN-05** | **Auditoria LGPD** | Todo cadastro ou login grava IP de origem e timestamp UTC na tabela `tb_audit_logs`. |
| **RN-06** | **Hash de Senhas** | Senhas de operadores armazenadas exclusivamente em Bcrypt com 12 rounds de salt. |
| **RN-07** | **5 Estados Visuais** | A UI deve obrigatoriamente alternar entre: Vazio, Válido, Loading, Erro e Sucesso. |
| **RN-08** | **Código Comentado** | Cada função e bloco lógico deve conter comentários didáticos para facilitar depuração. |

---

## 4. Requisitos Não-Funcionais (RNF)

| ID | Atributo | Métrica de Aceite |
| :---: | :--- | :--- |
| **RNF-01** | Performance | Tempo de resposta do endpoint `POST /api/v1/hospedes` inferior a 800ms em p95. |
| **RNF-02** | Segurança OWASP | Zero vulnerabilidades de SQL Injection (Prepared Statements obrigatórios). |
| **RNF-03** | Resiliência | Conexão automática com Supabase na nuvem e fallback transparente para SQLite local. |
| **RNF-04** | Acessibilidade | Padrão WCAG AA com foco navegável via teclado e atributos ARIA vinculados. |
