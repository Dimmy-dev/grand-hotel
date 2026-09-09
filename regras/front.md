# Diretrizes de Arquitetura de Front-End & Design System Antisslop
### Sistema Grand Plaza Hotel Management — Padrão Técnico de Interface e UX

Este documento estabelece as regras de interface, padrões de componentes, acessibilidade (WCAG AA) e gestão de estados para o desenvolvimento frontend, em conformidade com as práticas de `@frontend-developer` e `@react-patterns`.

---

## 1. Princípios Visuais Antisslop (StyleSeed + Baseline UI)

1. **Proibição Estrita de Emojis como Ícones de Interface**:
   - É proibido o uso de emojis (`✅`, `❌`, `📝`, `👤`, `⚠️`) em botões, tabelas, modais ou mensagens de status.
   - Toda iconografia deve utilizar exclusivamente vetores **SVG monocromáticos inline**, configurados com `fill="none"` ou `stroke="currentColor"` e espessura coerente (`stroke-width="1.75"`).

2. **Tipografia e Hierarquia de Neutros (Sem Preto Puro `#000000`)**:
   - Texto Primário: `#0f172a` (Slate 900) ou `#18181b` (Zinc 900).
   - Texto Secundário: `#475569` (Slate 600) ou `#71717a` (Zinc 500).
   - Texto Muted / Placeholders: `#94a3b8` (Slate 400).
   - Superfície Base: `#f8fafc` (Slate 50). Cartões e formulários: `#ffffff`.
   - Proibido o uso de gradientes chamativos em roxo/neon ou animações excessivas que degradem a sobriedade corporativa hoteleira.

3. **Disciplina de Acento Único (Single Accent Palette)**:
   - Acento Principal: Azul Hoteleiro Corporativo (`#1e3a8a` / `#2563eb`).
   - Cores de feedback funcional são estritamente reservadas a exceções:
     - Sucesso: `#16a34a` (Emerald 600) com fundo `#f0fdf4`.
     - Erro/Alerta: `#dc2626` (Red 600) com fundo `#fef2f2`.

4. **Geometria, Cantos e Sombras em Camadas**:
   - Inputs e Botões: Altura padrão de `42px`, `border-radius: 8px` e `padding: 0 14px`.
   - Cartões, Painéis e Modais: `border-radius: 14px`.
   - Sombras difusas e suaves: `box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 10px 15px -3px rgba(0,0,0,0.04)`.

5. **Comentários Obrigatórios e Facilidade de Depuração (Clean Code & Debug)**:
   - Todo o código JavaScript (`app.js`) e CSS deve conter comentários detalhados e didáticos:
     - Comentários de cabeçalho em funções descrevendo objetivo, parâmetros e retorno.
     - Comentários de linha explicando cada etapa do DOM, validações de input, máscaras, chamadas `fetch` à API e transições dos 5 estados visuais.
     - No CSS, agrupar regras por blocos semânticos (ex: `/* --- ESTADOS VISUAIS: LOADING SPINNER --- */`) para manutenção e depuração imediata por qualquer membro da equipe.

6. **Arquitetura de Navegação Single Page (SPA Vanilla)**:
   - Toda a aplicação reside no arquivo único `index.html`, atendendo à exigência do professor de *"página completa em HTML + CSS"*.
   - A interface gerencia duas visões principais através de contêineres semânticos:
     - `<section id="view-login">`: Tela de autenticação com e-mail e senha do operador.
     - `<section id="view-app">`: Painel administrativo com o formulário de cadastro de hóspedes (RF-001) e listagem em tempo real.
   - A transição entre telas ocorre de forma suave via JavaScript (`opacity` e `display`), sem recarregar o navegador.
   - As credenciais de sessão são mantidas automaticamente via `HttpOnly Cookie` com `credentials: "include"` nas chamadas `fetch`.
   - **Persistência Conectada ao Supabase com Resiliência**: O frontend comunica-se diretamente com os endpoints REST do backend conectado ao Supabase na nuvem. Em caso de oscilação transitória de conexão, o repositório cliente (`app.js`) pode manter dados em `localStorage` para assegurar que a demonstração dos 5 estados de tela nunca falhe.

---

## 2. Design Tokens Oficiais (CSS Custom Properties)

Todo o estilo deve consumir as variáveis declaradas no escopo raiz:

```css
:root {
  /* Cores de Superfície e Fundo */
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-subtle: #f1f5f9;

  /* Cores de Texto */
  --text-main: #0f172a;
  --text-muted: #64748b;
  --text-placeholder: #94a3b8;

  /* Marca Corporativa */
  --brand-navy: #1e3a8a;
  --brand-navy-hover: #1e40af;
  --brand-focus-ring: rgba(30, 58, 138, 0.15);

  /* Estados Funcionais */
  --color-success-bg: #f0fdf4;
  --color-success-border: #86efac;
  --color-success-text: #166534;

  --color-error-bg: #fef2f2;
  --color-error-border: #fca5a5;
  --color-error-text: #991b1b;

  /* Bordas */
  --border-subtle: #e2e8f0;
  --border-hover: #cbd5e1;
  --border-active: #1e3a8a;

  /* Raios de Borda */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 14px;

  /* Transições Suaves */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 3. Gestão dos 5 Estados Visuais Obrigatórios (Rubrica - Tópico 4)

A interface deve implementar deterministicamente os 5 estados da máquina de estados visual:

| Estado | Comportamento Visual e Interativo |
| :--- | :--- |
| **1. Inicial (Vazio)** | Campos limpos, placeholders institucionais discretos, botões secundários ativos, botão primário preparado para ação. |
| **2. Preenchido / Válido** | Validação no evento `blur`: contorno validado discretamente, feedback visual inline de conformidade e liberação imediata para submissão. |
| **3. Carregando (Loading)** | Campos do formulário e botões desabilitados (`disabled`), botão primário exibindo indicador animado (spinner SVG) e texto de processamento (`"Gravando informações..."`). |
| **4. Erro de Validação** | Borda destacada em `--color-error-border`, aviso contextual com ícone SVG de alerta posicionado abaixo do campo e foco retornado ao primeiro campo incorreto. |
| **5. Sucesso (Confirmação)** | Card de sucesso com dados do registro, exibição do identificador único (`HSP-2026-XXXX` ou `UUID`) e opções de `"Novo Cadastro"` e `"Ir para Lista"`. |

---

## 4. Requisitos de Acessibilidade (WCAG 2.1 AA) e Formulários

1. **Associação Explícita de Rótulos**:
   - Todo `<input>`, `<select>` ou `<textarea>` deve possuir um `<label>` correspondente com o atributo `for="id_do_campo"`.
2. **Atributos ARIA Dinâmicos**:
   - Erros de validação devem injetar `aria-invalid="true"` e associar a mensagem de erro via `aria-describedby="id_do_erro"`.
3. **Navegabilidade por Teclado**:
   - O foco deve ser destacado com anel visual de alto contraste: `outline: 2px solid var(--brand-navy); outline-offset: 2px;`.
4. **Máscaras de Entrada Inteligentes**:
   - Máscara dinâmica de CPF (`000.000.000-00`) e telefone celular (`(00) 00000-0000`) sem bloquear a colagem de texto via clipboard (evento `paste`).
5. **Responsividade Garantida**:
   - Layout fluido com contêiner centralizado, adaptável desde telas móveis (320px) até desktops corporativos (1920px).
