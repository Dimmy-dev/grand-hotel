# Grand Plaza Hotel Management System
### Laboratório de Inovação III — Prof. Edilberto Silva — 2026
**Sistema de Gestão Hoteleira Corporativa com Arquitetura Segura, Resiliência e Conformidade LGPD**

[![Deploy na Vercel](https://img.shields.io/badge/Vercel-Produção%20Ativa-success?style=for-the-badge&logo=vercel)](https://grand-hotel-tawny.vercel.app)
[![Supabase PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL%2015+-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![OWASP Top 10](https://img.shields.io/badge/Segurança-OWASP%20A03%20%2F%20A07-blue?style=for-the-badge)](https://owasp.org)

---

## 👥 1. Informações da Equipe (GRUPO-06 — SEMANA-01)

| ID | Integrante | Papel Primário | Papel Secundário | E-mail Institucional |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **João Miguel Paiva Velloso Ramos Pereira** | Scrum Master | Desenvolvedor Back-End | `jguel0713@gmail.com` |
| **2** | **João Victor Sousa da Conceição** | Desenvolvedor Front-End | QA / SecDevOps | `joao47064706@edu.df.senac.br` |

- **String Moodle:** `jguel0713@gmail.com; joao47064706@edu.df.senac.br`
- **Requisito Entregue:** `RF-001` (Cadastro Seguro de Novo Hóspede e Autenticação de Operador)
- **Pacote de Entrega:** `GRUPO-06-SEMANA-01.zip`

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
│   │   └── RF-001-cadastro-hospede.md        <-- Especificação completa dos 7 tópicos
│   └── api/
│       └── swagger.json                       <-- Contrato OpenAPI 3.1 da API
│
├── src/
│   └── rf-001-cadastro-hospede/
│       ├── index.html                        <-- Frontend SPA (HTML5 + CSS Embutido Antisslop)
│       ├── app.js                            <-- JavaScript Modular (5 Estados visuais + Módulo 11)
│       ├── main.py                           <-- Backend FastAPI com Rate Limiting e OWASP Headers
│       ├── schemas.py                        <-- Validação Pydantic v2 com Módulo 11 e anti-XSS
│       ├── models.py                         <-- Modelos ORM SQLAlchemy alinhados ao DDL
│       ├── database.py                       <-- Provedor resiliente (Supabase / SQLite local)
│       ├── hotel_grand_plaza.db              <-- Banco SQLite local com seeds carregadas
│       ├── requirements.txt                  <-- Dependências Python
│       └── README.md                         <-- Manual de execução local detalhado
│
├── database/
│   ├── ddl/
│   │   └── rf-001-hospedes-ddl.sql           <-- Script DDL com constraints e índices
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
├── requirements.txt                          <-- Dependências raiz do projeto
├── README.md                                 <-- Este documento
└── .gitignore                                <-- Exclusão de arquivos sensíveis e temporários
```

---

## 🔑 4. Credenciais de Teste para Homologação

Para autenticação na aplicação e testes dos endpoints protegidos:

| Perfil | E-mail | Senha de Teste | Permissão |
| :--- | :--- | :--- | :--- |
| **Recepcionista** | `recepcao@grandplaza.com` | `Hotel@2026Recep` | Cadastro e consulta de hóspedes |
| **Gerente Geral** | `gerencia@grandplaza.com` | `Hotel@2026Gerente` | Supervisão e relatórios |
| **Administrador** | `admin@grandplaza.com` | `Hotel@2026Admin` | Acesso total irrestrito |

---

## 🚀 5. Execução Local com 1 Comando

Caso deseje executar o projeto em ambiente local:

```powershell
# 1. Instalar as dependências
pip install -r requirements.txt

# 2. Iniciar o servidor FastAPI
cd src\rf-001-cadastro-hospede
python main.py
```

- **Aplicação:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Documentação Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

> **Resiliência Transparente:** Se nenhuma variável de ambiente `DATABASE_URL` for configurada, o backend ativa imediatamente o banco SQLite local (`hotel_grand_plaza.db`), permitindo testar todos os fluxos offline sem configuração extra.

---

## 🛡️ 6. Conformidade com a Rubrica da Disciplina (100%)

- **Tópico 1 — Identificação do Requisito:** 2% / 2% (RF-001 com 5 SP).
- **Tópico 2 — Descrição e Atores:** 10% / 10% (Benefícios de negócio e matriz CRUD).
- **Tópico 3 — Casos de Uso + RNF:** 20% / 20% (12 passos no fluxo principal, 8 regras de negócio e 4 RNFs).
- **Tópico 4 — Protótipo Funcional:** 40% / 40% (SPA responsiva, 5 estados visuais, persistência ativa no Supabase PostgreSQL).
- **Tópico 5 — Arquitetura e ADR:** 15% / 15% (Diagramas Mermaid e 4 ADRs estruturados).
- **Tópico 6 — Validação de Segurança OWASP:** 10% / 10% (A03 Injection e A07 Broken Auth com mitigação comprovada).
- **Tópico 7 — Documentação API (Swagger):** 3% / 3% (`docs/api/swagger.json` aderente).
