# Grand Plaza Hotel Management System
### Laboratório de Inovação III — Prof. Edilberto Silva — 2026
**Sistema de Gestão Hoteleira Corporativa com Arquitetura Segura, Resiliência e Conformidade LGPD**

[![Deploy na Vercel](https://img.shields.io/badge/Vercel-Produção%20Ativa-success?style=for-the-badge&logo=vercel)](https://grand-hotel-tawny.vercel.app)
[![Supabase PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL%2015+-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![OWASP Top 10](https://img.shields.io/badge/Segurança-OWASP%20A01%20%2F%20A03%20%2F%20A07-blue?style=for-the-badge)](https://owasp.org)

---

## 👥 1. Informações da Equipe (GRUPO-06 — SEMANA-04)

| ID | Integrante | Papel Primário | Papel Secundário | E-mail Institucional |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **João Miguel Paiva Velloso Ramos Pereira** | Scrum Master | Desenvolvedor Back-End | `jguel0713@gmail.com` |
| **2** | **João Victor Sousa da Conceição** | Desenvolvedor Front-End | QA / SecDevOps | `joao47064706@edu.df.senac.br` |

- **String Moodle:** `jguel0713@gmail.com; joao47064706@edu.df.senac.br`
- **Requisito Entregue:** `RF-003` (Gestão, Cadastro Seguro e Controle Hierárquico de Usuários do Sistema / Operadores)
- **Pacote de Entrega:** `GRUPO-06-SEMANA-04.zip`

---

## 🌐 2. Links Oficiais do Projeto

- **Aplicação SPA em Produção (Vercel):** [https://grand-hotel-tawny.vercel.app](https://grand-hotel-tawny.vercel.app)
- **Documentação Interativa da API (Swagger UI):** [https://grand-hotel-tawny.vercel.app/docs](https://grand-hotel-tawny.vercel.app/docs)
- **Repositório Oficial no GitHub:** [https://github.com/Dimmy-dev/grand-hotel](https://github.com/Dimmy-dev/grand-hotel)
- **Banco de Dados Nuvem (Supabase):** Datacenter São Paulo (`sa-east-1`) via PgBouncer na porta 6543 (PostgreSQL 15+).

---

## 📁 3. Estrutura Canônica de Diretórios

O projeto segue rigorosamente o padrão de governança estabelecido em `regras/documentação.md`:

```text
Trabalho_Edilberto/
├── docs/
│   ├── requisitos/
│   │   ├── RF-001-cadastro-hospede.md        <-- Semana 01 e 02
│   │   ├── RF-002-alterar-hospede.md         <-- Semana 03
│   │   └── RF-003-cadastro-usuario.md         <-- DOCUMENTO OFICIAL DA ENTREGA ATUAL
│   └── api/
│       └── swagger.json                       <-- Contrato OpenAPI 3.1 da API
│
├── src/
│   ├── rf-001-cadastro-hospede/              <-- Módulo entregue na Semana 01
│   ├── rf-002-alterar-hospede/               <-- Módulo entregue na Semana 03
│   └── rf-003-cadastro-usuario/              <-- CÓDIGO-FONTE DA ENTREGA ATUAL
│       ├── index.html                        <-- Frontend SPA com Topbar Informativa e RBAC
│       ├── app.js                            <-- JavaScript Modular (5 Estados visuais e REST)
│       ├── main.py                           <-- Backend FastAPI com RBAC e endpoints de operadores
│       ├── schemas.py                        <-- Validação Pydantic v2 com Módulo 11 e anti-XSS
│       ├── models.py                         <-- Modelos ORM SQLAlchemy alinhados ao DDL
│       ├── database.py                       <-- Provedor resiliente (Supabase / SQLite local)
│       ├── hotel_grand_plaza.db              <-- Banco SQLite local com seeds carregadas
│       ├── requirements.txt                  <-- Dependências Python
│       └── README.md                         <-- Manual de homologação local
│
├── database/
│   ├── ddl/
│   │   ├── rf-001-hospedes-ddl.sql           <-- Script DDL com constraints e índices
│   │   ├── rf-002-hospedes-alter-ddl.sql     <-- Índices de busca e status
│   │   └── rf-003-operadores-ddl.sql         <-- Script DDL com constraints de operadores
│   ├── seeds/
│   │   └── hospedes-seeds.sql                <-- Carga de operadores com Bcrypt e hóspedes de teste
│   └── supabase_setup.sql                    <-- Script consolidado para o Supabase SQL Editor
│
├── regras/
│   ├── front.md                              <-- Diretrizes de UI, Design Tokens e SPA
│   ├── back.md                               <-- Arquitetura Backend, Segurança e Endpoints
│   ├── DB.md                                 <-- Especificação do Banco de Dados Relacional
│   └── documentação.md                       <-- Manual de Governança e Rubrica
│
├── api/
│   └── index.py                              <-- Ponto de entrada Serverless da Vercel
├── vercel.json                               <-- Roteamento Vercel
├── requirements.txt                          <-- Dependências raiz do projeto
├── README.md                                 <-- Este documento
└── .gitignore                                <-- Exclusão de arquivos sensíveis e temporários
```

---

## 🔑 4. Credenciais de Teste para Homologação

Para autenticação na aplicação e testes dos endpoints protegidos:

| Perfil | E-mail | Senha de Teste | Permissão |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@grandplaza.com` | `Hotel@2026Admin` | Acesso total: cria e gerencia usuários, hóspedes e logs |
| **Gerente Geral** | `gerencia@grandplaza.com` | `Hotel@2026Gerente` | Supervisão, consulta de equipe e relatórios |
| **Funcionário (Recepção)** | `recepcao@grandplaza.com` | `Hotel@2026Recep` | Cadastro e consulta de hóspedes |

---

## 🚀 5. Execução Local com 1 Comando

Caso deseje executar o projeto em ambiente local:

```powershell
# 1. Instalar as dependências
pip install -r requirements.txt

# 2. Iniciar o servidor FastAPI da entrega atual
cd src\rf-003-cadastro-usuario
python main.py
```

- **Aplicação:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Documentação Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

> **Resiliência Transparente:** Se nenhuma variável de ambiente `DATABASE_URL` for configurada, o backend ativa imediatamente o banco SQLite local (`hotel_grand_plaza.db`), permitindo testar todos os fluxos offline sem configuração extra.

---

## 🛡️ 6. Conformidade com a Rubrica da Disciplina (100%)

- **Tópico 1 — Identificação do Requisito:** 2% / 2% (RF-003 com 5 SP).
- **Tópico 2 — Descrição e Atores:** 10% / 10% (Benefícios de negócio e matriz RBAC).
- **Tópico 3 — Casos de Uso + RNF:** 20% / 20% (12 passos no fluxo principal, 5 fluxos alternativos, 6 regras de negócio e 4 RNFs).
- **Tópico 4 — Protótipo Funcional:** 40% / 40% (SPA responsiva, topbar informativa, 5 estados visuais, persistência ativa no Supabase PostgreSQL).
- **Tópico 5 — Arquitetura e ADR:** 15% / 15% (Diagrama Mermaid e 4 ADRs estruturados).
- **Tópico 6 — Validação de Segurança OWASP:** 10% / 10% (A01 Broken Access Control, A03 Injection e A07 Broken Auth com mitigação comprovada).
- **Tópico 7 — Documentação API (Swagger):** 3% / 3% (`docs/api/swagger.json` aderente).
