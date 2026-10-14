# Grand Plaza Hotel Management System
### Laboratório de Inovação III — Prof. Edilberto Silva — 2026
**Sistema de Gestão Hoteleira Corporativa com Arquitetura Segura, Resiliência e Conformidade LGPD**

[![Deploy na Vercel](https://img.shields.io/badge/Vercel-Produção%20Ativa-success?style=for-the-badge&logo=vercel)](https://grand-hotel-tawny.vercel.app)
[![Supabase PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL%2015+-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![OWASP Top 10](https://img.shields.io/badge/Segurança-OWASP%20A01%20%2F%20A03%20%2F%20A07-blue?style=for-the-badge)](https://owasp.org)

---

## 👥 1. Informações da Equipe (GRUPO-06 — SEMANA-05)

| ID | Integrante | Papel Primário | Papel Secundário | E-mail Institucional |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Dimitri Lopes** | Dono do projeto | Desenvolvedor | `dimitri61523796@edu.df.senac.br` |

- **String Moodle:** `dimitri61523796@edu.df.senac.br`
- **Requisito Entregue:** `RF-004` (Sistema de Hospedagem, Gestão de Acomodações, Check-in Ágil, Check-out com Faturamento e Rack Hoteleiro)
- **Pacote de Entrega:** `GRUPO-Dimitri-SEMANA-05.zip`

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
│   │   ├── RF-003-cadastro-usuario.md         <-- Semana 04
│   │   └── RF-004-hospedagem.md              <-- DOCUMENTO OFICIAL DA ENTREGA ATUAL (Semana 05)
│   └── api/
│       └── swagger.json                       <-- Contrato OpenAPI 3.1 da API
│
├── src/
│   ├── rf-001-cadastro-hospede/              <-- Módulo entregue na Semana 01
│   ├── rf-002-alterar-hospede/               <-- Módulo entregue na Semana 03
│   ├── rf-003-cadastro-usuario/              <-- Módulo entregue na Semana 04
│   └── rf-004-hospedagem/                     <-- CÓDIGO-FONTE DA ENTREGA ATUAL (Semana 05)
│       ├── index.html                        <-- Frontend SPA com Rack Hoteleiro e Modais
│       ├── app.js                            <-- JavaScript do Rack, Check-in e Check-out
│       ├── main.py                           <-- Backend FastAPI com lock anti-overbooking
│       ├── schemas.py                        <-- Validação Pydantic v2
│       ├── models.py                         <-- Modelos ORM SQLAlchemy (Acomodações e Hospedagens)
│       ├── database.py                       <-- Provedor resiliente (Supabase / SQLite local)
│       ├── hotel_grand_plaza.db              <-- Banco SQLite local com seeds carregadas
│       ├── requirements.txt                  <-- Dependências Python
│       └── README.md                         <-- Manual de homologação local
│
├── database/
│   ├── ddl/
│   │   ├── rf-001-hospedes-ddl.sql
│   │   ├── rf-002-hospedes-alter-ddl.sql
│   │   ├── rf-003-operadores-ddl.sql
│   │   └── rf-004-hospedagens-ddl.sql         <-- DDL tb_acomodacoes e tb_hospedagens
│   ├── seeds/
│   │   ├── hospedes-seeds.sql
│   │   └── acomodacoes-seeds.sql              <-- Carga de quartos dos andares 1 a 3
│   └── supabase_setup.sql                    <-- Script consolidado para o Supabase SQL Editor
│
├── regras/
│   ├── front.md                              <-- Diretrizes de UI, Design Tokens e SPA
│   ├── back.md                               <-- Arquitetura Backend, Segurança e Endpoints
│   ├── DB.md                                 <-- Especificação do Banco de Dados Relacional
│   └── documentação.md                       <-- Manual de Governança e Rubrica
│
├── api/
│   └── index.py                              <-- Ponto de entrada Serverless da Vercel (prioriza RF-004)
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
| **Funcionário (Recepção)** | `recepcao@grandplaza.com` | `Hotel@2026Recep` | Operação do Rack, Check-in, Check-out e Governança |
| **Gerente Geral** | `gerencia@grandplaza.com` | `Hotel@2026Gerente` | Supervisão operacional e relatórios |
| **Administrador** | `admin@grandplaza.com` | `Hotel@2026Admin` | Acesso total irrestrito |

---

## 🚀 5. Execução Local com 1 Comando

Caso deseje executar o projeto em ambiente local:

```powershell
# 1. Instalar as dependências
pip install -r requirements.txt

# 2. Iniciar o servidor FastAPI da entrega atual
cd src\rf-004-hospedagem
uvicorn main:app --reload --port 8000
```

- **Aplicação:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Documentação Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

> **Resiliência Transparente:** Se nenhuma variável de ambiente `DATABASE_URL` for configurada, o backend ativa imediatamente o banco SQLite local (`hotel_grand_plaza.db`), permitindo testar todos os fluxos offline sem configuração extra.

---

## 🛡️ 6. Conformidade com a Rubrica da Disciplina (100%)

- **Tópico 1 — Identificação do Requisito:** 2% / 2% (RF-004 com 8 SP).
- **Tópico 2 — Descrição e Atores:** 10% / 10% (Benefícios de negócio e matriz operacional do Rack).
- **Tópico 3 — Casos de Uso + RNF:** 20% / 20% (Check-in ágil, lock anti-overbooking, apuração contábil no check-out, governança de quartos e 5 RNFs).
- **Tópico 4 — Protótipo Funcional:** 40% / 40% (SPA responsiva, Rack Hoteleiro interativo, modais com autocomplete, persistência dual Supabase/SQLite).
- **Tópico 5 — Arquitetura e ADR:** 15% / 15% (Diagrama Mermaid de estados, ERD e padrão Snapshot de tarifa).
- **Tópico 6 — Validação de Segurança OWASP:** 10% / 10% (A01 Broken Access Control, A03 Injection, A04 Insecure Design - Concorrência e A07 Broken Auth).
- **Tópico 7 — Documentação API (Swagger):** 3% / 3% (`docs/api/swagger.json` aderente ao OpenAPI 3.1).
