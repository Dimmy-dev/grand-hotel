# Guia de Execução Local e Homologação — RF-001
### Sistema Grand Plaza Hotel Management — Cadastro Seguro de Hóspede e Autenticação

Este módulo implementa a aplicação SPA completa (HTML5 + CSS Embutido + JavaScript) e a API REST em **Python 3.11+ com FastAPI e SQLAlchemy**, em estrita conformidade com `regras/back.md`, `regras/front.md`, `regras/DB.md` e `regras/documentação.md`.

---

## 🚀 1. Como Executar Localmente no Windows (PowerShell)

### Passo 1: Navegar até a pasta do requisito
```powershell
cd src\rf-001-cadastro-hospede
```

### Passo 2: Instalar as dependências
```powershell
pip install -r requirements.txt
```

### Passo 3: Configurar o Banco de Dados (Nuvem ou Local)
- **Opção A — Supabase PostgreSQL na Nuvem (Ativo)**:
  Basta copiar o arquivo `.env.example` para `.env` (ou usar as variáveis de ambiente):
  ```powershell
  cp .env.example .env
  ```
  O backend conectará diretamente ao cluster PostgreSQL 15+ no datacenter de São Paulo (`sa-east-1`) via PgBouncer na porta `6543`.
  
- **Opção B — Resiliência Transparente Local (Offline / Fallback)**:
  Se o arquivo `.env` for removido ou o host da nuvem estiver inacessível, o sistema ativa **automaticamente** o banco SQLite local embutido (`hotel_grand_plaza.db`), carregando tabelas DDL e 3 operadores de teste com esforço zero de configuração.

### Passo 4: Iniciar o Servidor FastAPI
```powershell
python main.py
```
O servidor iniciará automaticamente em: **`http://127.0.0.1:8000`**

---

## 🌐 2. Como Acessar a Aplicação e a Documentação

1. **Aplicação SPA Completa (Frontend)**:
   - Abra no navegador: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - A tela inicial carregará o painel de **Acesso Operacional (Login)**.

2. **Documentação Interativa da API (Swagger UI / OpenAPI)**:
   - Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
   - Especificação JSON nativa: [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

3. **Exportação do Contrato Swagger**:
   - Para reexportar o arquivo oficial exigido no edital (`docs/api/swagger.json`), acesse:
     `http://127.0.0.1:8000/export-swagger-json`

---

## 👥 3. Credenciais de Teste para o Professor / Avaliador

Conforme registrado em `regras/senhas.md`, os seguintes operadores estão pré-carregados no banco:

| Papel | E-mail de Acesso | Senha de Teste | Permissões |
| :--- | :--- | :--- | :--- |
| **Recepcionista** | `recepcao@grandplaza.com` | `Hotel@2026Recep` | Cadastro e listagem de hóspedes |
| **Gerente Geral** | `gerencia@grandplaza.com` | `Hotel@2026Gerente` | Supervisão e auditoria |
| **Administrador** | `admin@grandplaza.com` | `Hotel@2026Admin` | Acesso total irrestrito |

---

## 🧪 4. Como Testar os 5 Estados de Tela (Rubrica - Tópico 4)

1. **Estado 1 (Vazio / Inicial)**:
   - Após logar, o formulário de cadastro é exibido limpo, com botões ativos e campos prontos para entrada.
2. **Estado 2 (Preenchido / Válido)**:
   - Preencha os campos e saia com `Tab` ou clique fora (`blur`).
   - O CPF aplica a máscara `000.000.000-00` e valida o algoritmo Módulo 11 (ex: use o CPF válido `52998224725`). A borda fica confirmada suavemente em verde.
3. **Estado 3 (Carregando / Loading)**:
   - Clique em *"Confirmar Cadastro de Hóspede"*. O botão desabilita cliques concorrentes e exibe o spinner SVG animado com o texto *"Gravando informações no hotel..."*.
4. **Estado 4 (Erro de Validação Contextual)**:
   - Digite um CPF com números repetidos (ex: `111.111.111-11`) ou tente cadastrar o mesmo e-mail duas vezes. O sistema cancela o loading e destaca o campo afetado com borda vermelha e mensagem explicativa.
5. **Estado 5 (Sucesso com UUID Gerado)**:
   - Ao cadastrar um hóspede válido, a tela transiciona para o card de sucesso verde, exibindo o nome do hóspede e o seu **Identificador Único Universal (UUID)** gerado, adicionando o hóspede instantaneamente à tabela da direita.

---

## 🔒 5. Conexão com Supabase na Nuvem (Produção / Vercel)

Para apontar o backend para a nuvem gerenciada do Supabase:
```powershell
$env:DATABASE_URL="postgresql://postgres.[SEU-PROJETO]:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
python main.py
```
O backend detectará a variável `DATABASE_URL` e ativará a engine PostgreSQL com pooler de conexões para alto volume.
