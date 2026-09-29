# Guia de Execução Local e Homologação — RF-003
### Sistema Grand Plaza Hotel Management — Gestão e Cadastro de Usuários do Sistema (Operadores)

Este módulo implementa o gerenciamento de operadores e colaboradores do hotel com controle de permissões baseado em funções (RBAC), hash seguro de senhas via Bcrypt, topbar de identificação e trilha de auditoria LGPD, em conformidade com as diretrizes do Prof. Edilberto Silva (`regras/back.md`, `regras/front.md`, `regras/DB.md` e `regras/documentação.md`).

---

## 🚀 1. Como Executar Localmente no Windows (PowerShell)

### Passo 1: Navegar até o diretório do módulo
```powershell
cd src\rf-003-cadastro-usuario
```

### Passo 2: Instalar as dependências necessárias
```powershell
pip install -r requirements.txt
```

### Passo 3: Iniciar o servidor local FastAPI
```powershell
python main.py
```
O servidor será disponibilizado em: **`http://127.0.0.1:8000`**

> **Resiliência Transparente:** Caso nenhuma variável `DATABASE_URL` seja fornecida no `.env`, o backend ativa imediatamente o banco SQLite local (`hotel_grand_plaza.db`) com criação automática das tabelas e seeds de teste, permitindo testar tudo 100% offline.

---

## 🌐 2. Como Homologar e Testar os Novos Recursos

1. **Acessar a SPA no Navegador**:
   - Abra [http://127.0.0.1:8000](http://127.0.0.1:8000)
2. **Autenticação como Administrador**:
   - **E-mail:** `admin@grandplaza.com`
   - **Senha:** `Hotel@2026Admin`
3. **Verificação da Topbar Informativa**:
   - Observe no canto superior direito: o nome do usuário (`Administrador do Sistema`) e o badge em azul escuro `[ADMINISTRADOR]`.
4. **Cadastro de Novo Usuário**:
   - Preencha o formulário: Nome, E-mail corporativo, escolha o cargo (`FUNCIONARIO`, `GERENTE` ou `ADMIN`), digite a senha e confirme-a.
   - Clique em "Salvar Usuário": veja a transição do spinner de carregamento e a exibição do banner de sucesso. O usuário aparece instantaneamente na tabela abaixo.
5. **Alternância de Status (Soft Delete)**:
   - Na linha de qualquer usuário (exceto sua própria conta ativa), clique em "Desativar". O badge mudará para "Inativo" e o evento será registrado na trilha de auditoria.
6. **Teste com Outros Cargos**:
   - Clique em "Sair" e entre como `recepcao@grandplaza.com` (`Hotel@2026Recep`):
   - A topbar exibirá `Maria Oliveira (Recepção)` com badge `[FUNCIONÁRIO]`, e o formulário de cadastro de operadores fica oculto por restrição de segurança.

---

## 📖 3. Documentação Swagger UI
- Acesso interativo: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
