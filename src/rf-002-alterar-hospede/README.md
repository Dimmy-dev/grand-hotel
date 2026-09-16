# Guia de Execução Local e Homologação — RF-002
### Sistema Grand Plaza Hotel Management — Consulta, Edição e Desativação Segura de Hóspedes (LGPD)

Este módulo implementa a gestão completa do ciclo de vida de hóspedes em conformidade com as diretrizes do Prof. Edilberto Silva (`regras/back.md`, `regras/front.md`, `regras/DB.md` e `regras/documentação.md`).

---

## 🚀 1. Como Executar Localmente no Windows (PowerShell)

### Passo 1: Navegar até a pasta do requisito
```powershell
cd src\rf-002-alterar-hospede
```

### Passo 2: Instalar as dependências
```powershell
pip install -r requirements.txt
```

### Passo 3: Iniciar o Servidor FastAPI
```powershell
python main.py
```
O servidor iniciará automaticamente em: **`http://127.0.0.1:8000`**

> **Resiliência Transparente:** Caso o cluster do Supabase na nuvem não seja configurado via `.env`, o backend ativa automaticamente o banco SQLite local (`hotel_grand_plaza.db`), permitindo testar todos os fluxos offline sem configuração extra.

---

## 🌐 2. Como Acessar e Testar os Novos Recursos do RF-002

1. **Aplicação SPA (Frontend)**:
   - Abra no navegador: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - Realize o login operacional:
     - **E-mail:** `recepcao@grandplaza.com`
     - **Senha:** `Hotel@2026Recep`
   - **Testando a Busca Preditiva:** Digite "Fernando", "Beatriz" ou o CPF no campo de pesquisa acima da tabela. A listagem filtra os hóspedes em tempo real com debounce de 300ms.
   - **Testando os Filtros de Status:** Clique nas pills "Todos", "Ativos" e "Inativos".
   - **Testando a Edição Cadastral:** Clique em "Editar" na linha de qualquer hóspede. O modal abrirá com os dados preenchidos e o **CPF travado para leitura (imutável)**. Altere o telefone ou observações e clique em "Salvar Alterações".
   - **Testando o Soft Delete (LGPD):** Clique no botão "Inativar". O sistema solicitará confirmação e mudará o badge para "Inativo" (cinza), preservando o registro no banco com log de auditoria em `tb_audit_logs`.

2. **Documentação Swagger UI**:
   - [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
