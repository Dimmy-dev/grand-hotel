# RF-004 — Sistema de Hospedagem, Check-in, Check-out e Rack Hoteleiro
### Grand Plaza Hotel Management System — Sprint Semana 05

---

## 📋 Visão Geral
Este módulo implementa o núcleo da operação hoteleira:
* **Rack Hoteleiro Interativo**: Grid visual responsivo com métricas de ocupação em tempo real e status dos quartos (Disponível, Ocupado, Limpeza, Manutenção).
* **Check-in Ágil com Bloqueio Anti-Overbooking**: Vinculação atômica de hóspede a quarto com lock pessimista em linha (`SELECT FOR UPDATE`).
* **Check-out & Faturamento Inicial**: Cálculo automático das diárias consumidas (mínimo de 1 diária) e valor total devido com liberação para limpeza.
* **Governança de Quartos**: Transição de quartos higienizados para o status disponível.
* **Resiliência Dual**: Operação em produção no **Supabase PostgreSQL 15+** ou em modo de avaliação offline no **SQLite local** (`hotel_grand_plaza.db`).

---

## 🚀 Como Executar Localmente

### 1. Instalar as dependências:
```bash
pip install -r requirements.txt
```

### 2. Iniciar o servidor FastAPI:
```bash
uvicorn main:app --reload --port 8000
```

### 3. Acessar a aplicação:
* **SPA (Interface do Rack Hoteleiro)**: `http://localhost:8000`
* **Swagger (Documentação Interativa da API)**: `http://localhost:8000/docs`

---

## 🔑 Credenciais de Teste

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| **Recepção** | `recepcao@grandplaza.com` | `Hotel@2026Recep` |
| **Gerência** | `gerencia@grandplaza.com` | `Hotel@2026Gerente` |
| **Administrador** | `admin@grandplaza.com` | `Hotel@2026Admin` |

---

## 🧪 Roteiro Rápido de Homologação
1. Abra `http://localhost:8000` e faça login com `recepcao@grandplaza.com` / `Hotel@2026Recep`.
2. Visualize o grid de quartos nos andares 1 a 3.
3. No **Quarto 101**, clique em **Check-in**. Selecione o hóspede *Dr. Fernando Albuquerque*, defina a data prevista de saída e confirme.
4. O Quarto 101 torna-se **Ocupado**.
5. Clique em **Check-out** no Quarto 101 e conclua o faturamento.
6. O Quarto 101 transita para **Limpeza**.
7. Clique em **Liberar Quarto** para retorná-lo a **Disponível**.
