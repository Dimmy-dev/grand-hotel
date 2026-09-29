/**
 * CLIENTE JAVASCRIPT MODULAR (SPA)
 * Sistema Grand Plaza Hotel Management — RF-003 (Gestão e Cadastro de Usuários do Sistema)
 * Diretrizes: regras/front.md, regras/documentação.md e OWASP Top 10
 * 
 * Funcionalidades:
 * 1. Gerenciador de Sessão e Renderização da Topbar com Nome e Nível de Acesso (RBAC).
 * 2. Máquina de 5 Estados Visuais para Cadastro de Operadores (Vazio, Válido, Loading, Erro e Sucesso).
 * 3. Validação de Formulário em Tempo Real (E-mail corporativo e Confirmação de Senha).
 * 4. Listagem Dinâmica e Alternância de Status (Soft Delete) com Proteção contra Auto-Desativação.
 * 5. Consumo de Endpoints REST via Fetch com HttpOnly Cookies transparentes.
 */

// Estado Global da Aplicação Cliente
const AppState = {
  usuarioLogado: null,
  operadores: [],
  hospedes: []
};

// Ícone SVG animado para o Estado 3 (Loading Spinner)
const SPINNER_SVG = `
  <svg class="spinner-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
    <path d="M12 2a10 10 0 0110 10"/>
  </svg>
`;

// ============================================================================
// 1. INICIALIZAÇÃO E CONTROLE DE NAVEGAÇÃO DA SPA
// ============================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Inicializa os manipuladores de eventos da interface
  configurarEventosAutenticacao();
  configurarEventosNavegacao();
  configurarEventosFormularioOperador();
  configurarFiltroCargo();
  configurarEventosModalEdicao();

  // Verifica se o usuário já possui sessão ativa (HttpOnly Cookie)
  verificarSessaoAtiva();
});

/**
 * Consulta o backend para checar se existe um cookie de sessão válido.
 * Popula a topbar superior com o nome e o cargo do usuário logado.
 */
async function verificarSessaoAtiva() {
  try {
    const res = await fetch("/api/v1/auth/me", { credentials: "include" });
    const json = await res.json();

    if (json.success && json.data) {
      // Sessão válida encontrada: armazena dados e exibe painel principal
      AppState.usuarioLogado = json.data;
      renderizarTopbarUsuario(json.data);
      alternarVisao("app");
      carregarListaOperadores();
      carregarListaHospedes();
    } else {
      // Nenhuma sessão ativa: direciona para o login
      alternarVisao("login");
    }
  } catch (err) {
    console.error("[SPA ERROR] Falha ao verificar sessão:", err);
    alternarVisao("login");
  }
}

/**
 * Atualiza os elementos da topbar superior com os dados do operador conectado.
 * Exibe o nome e estiliza o badge conforme o nível de privilégio (RBAC).
 */
function renderizarTopbarUsuario(usuario) {
  const topbarArea = document.getElementById("topbar-user-area");
  const displayNome = document.getElementById("display-user-name");
  const displayCargo = document.getElementById("display-user-role");

  if (!topbarArea || !displayNome || !displayCargo) return;

  topbarArea.style.display = "flex";
  displayNome.textContent = usuario.nome;

  // Formata e estiliza a etiqueta do cargo
  displayCargo.className = "badge-role";
  const cargoUpper = (usuario.cargo || "FUNCIONARIO").toUpperCase();

  if (cargoUpper === "ADMIN") {
    displayCargo.classList.add("badge-role-admin");
    displayCargo.textContent = "ADMINISTRADOR";
  } else if (cargoUpper === "GERENTE") {
    displayCargo.classList.add("badge-role-gerente");
    displayCargo.textContent = "GERENTE";
  } else {
    displayCargo.classList.add("badge-role-funcionario");
    displayCargo.textContent = "FUNCIONÁRIO";
  }

  // Se o usuário não for ADMIN, oculta o formulário de cadastro de operadores por segurança visual
  const cardForm = document.getElementById("card-form-operador");
  if (cardForm) {
    if (cargoUpper === "ADMIN") {
      cardForm.style.display = "block";
    } else {
      cardForm.style.display = "none";
    }
  }
}

/**
 * Alterna de forma suave entre as telas de Login e Aplicação.
 */
function alternarVisao(visao) {
  const viewLogin = document.getElementById("view-login");
  const viewApp = document.getElementById("view-app");
  const topbarArea = document.getElementById("topbar-user-area");

  if (visao === "app") {
    viewLogin.style.display = "none";
    viewApp.style.display = "block";
  } else {
    viewLogin.style.display = "block";
    viewApp.style.display = "none";
    if (topbarArea) topbarArea.style.display = "none";
  }
}

// ============================================================================
// 2. AUTENTICAÇÃO (LOGIN E LOGOUT)
// ============================================================================

function configurarEventosAutenticacao() {
  const formLogin = document.getElementById("form-login");
  const btnLogout = document.getElementById("btn-logout");

  // Submissão do formulário de login
  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const email = document.getElementById("login-email").value.trim();
      const senha = document.getElementById("login-password").value;
      const btnSubmit = document.getElementById("btn-submit-login");
      const btnText = document.getElementById("login-btn-text");
      const bannerErro = document.getElementById("login-error-banner");
      const textoErro = document.getElementById("login-error-text");

      // Estado 3: Loading durante a autenticação
      btnSubmit.disabled = true;
      btnText.innerHTML = `${SPINNER_SVG} <span>Autenticando...</span>`;
      bannerErro.style.display = "none";

      try {
        const res = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, senha })
        });
        const json = await res.json();

        if (json.success && json.data) {
          // Login bem-sucedido
          AppState.usuarioLogado = json.data;
          renderizarTopbarUsuario(json.data);
          alternarVisao("app");
          carregarListaOperadores();
          carregarListaHospedes();
        } else {
          // Estado 4: Erro de credenciais
          bannerErro.style.display = "flex";
          textoErro.textContent = json.error?.message || "E-mail ou senha incorretos.";
        }
      } catch (err) {
        bannerErro.style.display = "flex";
        textoErro.textContent = "Erro ao conectar com o servidor da aplicação.";
      } finally {
        btnSubmit.disabled = false;
        btnText.textContent = "Entrar no Sistema";
      }
    });
  }

  // Configuração dos Botões de Preset de Demonstração (Facilita a Avaliação do Professor)
  const inputEmail = document.getElementById("login-email");
  const inputSenha = document.getElementById("login-password");
  const presetAdmin = document.getElementById("preset-admin");
  const presetGerente = document.getElementById("preset-gerente");
  const presetFuncionario = document.getElementById("preset-funcionario");
  const todosPresets = [presetAdmin, presetGerente, presetFuncionario];

  function selecionarPreset(btnAtivo, email, senha) {
    if (inputEmail) inputEmail.value = email;
    if (inputSenha) inputSenha.value = senha;
    todosPresets.forEach(b => {
      if (b) {
        b.style.borderColor = "var(--border-subtle)";
        b.style.backgroundColor = "var(--bg-surface)";
      }
    });
    if (btnAtivo) {
      btnAtivo.style.borderColor = "#93c5fd";
      btnAtivo.style.backgroundColor = "#eff6ff";
    }
  }

  if (presetAdmin) {
    presetAdmin.addEventListener("click", () => {
      selecionarPreset(presetAdmin, "admin@grandplaza.com", "Hotel@2026Admin");
    });
  }
  if (presetGerente) {
    presetGerente.addEventListener("click", () => {
      selecionarPreset(presetGerente, "gerencia@grandplaza.com", "Hotel@2026Gerente");
    });
  }
  if (presetFuncionario) {
    presetFuncionario.addEventListener("click", () => {
      selecionarPreset(presetFuncionario, "recepcao@grandplaza.com", "Hotel@2026Recep");
    });
  }

  // Encerramento de Turno / Logout
  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          credentials: "include"
        });
      } catch (err) {
        console.error("Falha ao comunicar logout:", err);
      }
      AppState.usuarioLogado = null;
      // Restaura credenciais padrão de Administrador para o próximo teste
      selecionarPreset(presetAdmin, "admin@grandplaza.com", "Hotel@2026Admin");
      alternarVisao("login");
    });
  }
}

// ============================================================================
// 3. NAVEGAÇÃO POR ABAS (TABS)
// ============================================================================

function configurarEventosNavegacao() {
  const tabUsuarios = document.getElementById("tab-nav-usuarios");
  const tabHospedes = document.getElementById("tab-nav-hospedes");
  const paneUsuarios = document.getElementById("pane-usuarios");
  const paneHospedes = document.getElementById("pane-hospedes");

  if (tabUsuarios && tabHospedes) {
    tabUsuarios.addEventListener("click", () => {
      tabUsuarios.classList.add("active");
      tabHospedes.classList.remove("active");
      paneUsuarios.style.display = "block";
      paneHospedes.style.display = "none";
    });

    tabHospedes.addEventListener("click", () => {
      tabHospedes.classList.add("active");
      tabUsuarios.classList.remove("active");
      paneUsuarios.style.display = "none";
      paneHospedes.style.display = "block";
    });
  }
}

// ============================================================================
// 4. CADASTRO DE OPERADORES COM OS 5 ESTADOS VISUAIS (RF-003)
// ============================================================================

function configurarEventosFormularioOperador() {
  const form = document.getElementById("form-novo-operador");
  if (!form) return;

  const campoNome = document.getElementById("op-nome");
  const campoEmail = document.getElementById("op-email");
  const campoSenha = document.getElementById("op-senha");
  const campoConfirm = document.getElementById("op-senha-confirm");
  const campoCargo = document.getElementById("op-cargo");

  const errNome = document.getElementById("err-op-nome");
  const errEmail = document.getElementById("err-op-email");
  const errSenha = document.getElementById("err-op-senha");
  const errConfirm = document.getElementById("err-op-senha-confirm");

  // Validação no evento blur (Estado 2: Válido ou Estado 4: Erro)
  campoNome.addEventListener("blur", () => {
    if (campoNome.value.trim().length < 3) {
      marcarCampoErro(campoNome, errNome, "Nome deve ter ao menos 3 caracteres.");
    } else {
      marcarCampoValido(campoNome, errNome);
    }
  });

  campoEmail.addEventListener("blur", () => {
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campoEmail.value.trim());
    if (!emailValido) {
      marcarCampoErro(campoEmail, errEmail, "Informe um endereço de e-mail corporativo válido.");
    } else {
      marcarCampoValido(campoEmail, errEmail);
    }
  });

  campoSenha.addEventListener("blur", () => {
    if (campoSenha.value.length < 6) {
      marcarCampoErro(campoSenha, errSenha, "A senha deve conter no mínimo 6 caracteres.");
    } else {
      marcarCampoValido(campoSenha, errSenha);
    }
  });

  campoConfirm.addEventListener("input", () => {
    if (campoConfirm.value !== campoSenha.value) {
      marcarCampoErro(campoConfirm, errConfirm, "As senhas não coincidem.");
    } else {
      marcarCampoValido(campoConfirm, errConfirm);
    }
  });

  // Submissão do Formulário
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const bannerSucesso = document.getElementById("user-success-banner");
    const bannerErro = document.getElementById("user-error-banner");
    const textoErro = document.getElementById("user-error-text");
    const textoSucesso = document.getElementById("user-success-text");
    const btnSalvar = document.getElementById("btn-salvar-op");
    const btnSalvarText = document.getElementById("btn-salvar-op-text");

    // Limpa feedbacks anteriores
    bannerSucesso.style.display = "none";
    bannerErro.style.display = "none";

    // Validações prévias
    let temErro = false;
    if (campoNome.value.trim().length < 3) {
      marcarCampoErro(campoNome, errNome, "Nome inválido.");
      temErro = true;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campoEmail.value.trim())) {
      marcarCampoErro(campoEmail, errEmail, "E-mail inválido.");
      temErro = true;
    }
    if (campoSenha.value.length < 6) {
      marcarCampoErro(campoSenha, errSenha, "Senha muito curta.");
      temErro = true;
    }
    if (campoSenha.value !== campoConfirm.value) {
      marcarCampoErro(campoConfirm, errConfirm, "Senhas não coincidem.");
      temErro = true;
    }

    if (temErro) return;

    // Estado 3: Loading com Spinner
    btnSalvar.disabled = true;
    btnSalvarText.innerHTML = `${SPINNER_SVG} <span>Gravando usuário...</span>`;

    const payload = {
      nome: campoNome.value.trim(),
      email: campoEmail.value.trim().toLowerCase(),
      senha: campoSenha.value,
      confirmacao_senha: campoConfirm.value,
      cargo: campoCargo.value
    };

    try {
      const res = await fetch("/api/v1/operadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const json = await res.json();

      if (json.success && json.data) {
        // Estado 5: Sucesso com confirmação
        bannerSucesso.style.display = "flex";
        textoSucesso.textContent = `Usuário "${json.data.nome}" (${json.data.cargo}) cadastrado com sucesso!`;
        form.reset();
        limparEstilosValidacao([campoNome, campoEmail, campoSenha, campoConfirm]);
        carregarListaOperadores();
      } else {
        // Estado 4: Erro da API (ex: e-mail duplicado)
        bannerErro.style.display = "flex";
        textoErro.textContent = json.error?.message || "Não foi possível cadastrar o usuário.";
      }
    } catch (err) {
      bannerErro.style.display = "flex";
      textoErro.textContent = "Falha de comunicação com o servidor.";
    } finally {
      btnSalvar.disabled = false;
      btnSalvarText.textContent = "Salvar Usuário";
    }
  });
}

function marcarCampoErro(input, spanErro, mensagem) {
  input.classList.add("input-error");
  input.classList.remove("input-valid");
  spanErro.textContent = mensagem;
  spanErro.style.display = "flex";
}

function marcarCampoValido(input, spanErro) {
  input.classList.remove("input-error");
  input.classList.add("input-valid");
  spanErro.style.display = "none";
}

function limparEstilosValidacao(campos) {
  campos.forEach(c => {
    c.classList.remove("input-error", "input-valid");
  });
}

// ============================================================================
// 5. LISTAGEM DE USUÁRIOS E GESTÃO DE STATUS (SOFT DELETE)
// ============================================================================

async function carregarListaOperadores() {
  const tbody = document.getElementById("tbody-operadores");
  const filtroCargo = document.getElementById("filtro-cargo-tabela");
  const cargoSelecionado = filtroCargo ? filtroCargo.value : "";

  let url = "/api/v1/operadores";
  if (cargoSelecionado) {
    url += `?cargo=${encodeURIComponent(cargoSelecionado)}`;
  }

  try {
    const res = await fetch(url, { credentials: "include" });
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      AppState.operadores = json.data;
      renderizarTabelaOperadores(json.data);
    }
  } catch (err) {
    console.error("Falha ao listar operadores:", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-error-text); padding: 1.5rem;">Erro ao carregar lista de usuários.</td></tr>`;
  }
}

function renderizarTabelaOperadores(operadores) {
  const tbody = document.getElementById("tbody-operadores");
  if (!tbody) return;

  if (operadores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum usuário cadastrado para os critérios selecionados.</td></tr>`;
    return;
  }

  const isAdmin = AppState.usuarioLogado && AppState.usuarioLogado.cargo === "ADMIN";
  const userLogadoUuid = AppState.usuarioLogado ? AppState.usuarioLogado.uuid : null;

  tbody.innerHTML = operadores.map(op => {
    const isAtivo = op.is_ativo === 1;
    const isSelf = op.uuid === userLogadoUuid;

    // Badge do cargo
    let badgeClass = "badge-role-funcionario";
    if (op.cargo === "ADMIN") badgeClass = "badge-role-admin";
    else if (op.cargo === "GERENTE") badgeClass = "badge-role-gerente";

    // Ações: apenas Admin pode ativar/desativar, e não pode desativar a si mesmo
    // Determinação do status de presença e ativação da conta
    let statusHtml = "";
    if (op.is_ativo === 0) {
      statusHtml = `
        <span class="badge-status badge-status-inativo">
          <span class="dot-status dot-inativo"></span>
          Inativo
        </span>
      `;
    } else if (op.is_online) {
      statusHtml = `
        <span class="badge-status badge-status-online" title="Sessão ativa detectada no sistema">
          <span class="dot-status dot-online"></span>
          Online
        </span>
      `;
    } else {
      statusHtml = `
        <span class="badge-status badge-status-offline" title="Sem sessão ativa no momento">
          <span class="dot-status dot-offline"></span>
          Offline
        </span>
      `;
    }

    // Ações: Administrador pode editar qualquer usuário e desativar contas de terceiros
    let acoesHtml = `<span style="color: var(--text-muted); font-size: 0.775rem;">Sem ações</span>`;
    if (isAdmin) {
      let btnDesativarHtml = "";
      if (isSelf) {
        btnDesativarHtml = `<span style="color: var(--text-muted); font-size: 0.75rem;">(Sua conta)</span>`;
      } else {
        const textoAcao = isAtivo ? "Desativar" : "Reativar";
        const novoStatus = isAtivo ? 0 : 1;
        btnDesativarHtml = `
          <button type="button" class="btn-action-status" onclick="alternarStatusOperador('${op.uuid}', ${novoStatus}, '${op.nome}')">
            ${textoAcao}
          </button>
        `;
      }

      acoesHtml = `
        <div class="actions-cell">
          <button type="button" class="btn-action-edit" onclick="abrirModalEdicao('${op.uuid}')" title="Editar dados cadastrais">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Editar
          </button>
          ${btnDesativarHtml}
        </div>
      `;
    }

    return `
      <tr>
        <td style="font-weight: 600;">${op.nome}</td>
        <td>${op.email}</td>
        <td><span class="badge-role ${badgeClass}">${op.cargo}</span></td>
        <td>${statusHtml}</td>
        <td style="text-align: right;">${acoesHtml}</td>
      </tr>
    `;
  }).join("");
}

function configurarFiltroCargo() {
  const filtro = document.getElementById("filtro-cargo-tabela");
  if (filtro) {
    filtro.addEventListener("change", () => {
      carregarListaOperadores();
    });
  }
}

/**
 * Alterna logicamente o status de ativação do operador (Soft Delete).
 */
window.alternarStatusOperador = async function(uuid, novoStatus, nome) {
  const acao = novoStatus === 0 ? "desativar" : "reativar";
  if (!confirm(`Deseja realmente ${acao} o acesso do usuário "${nome}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/v1/operadores/${uuid}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ is_ativo: novoStatus })
    });
    const json = await res.json();

    if (json.success) {
      carregarListaOperadores();
    } else {
      alert(json.error?.message || "Erro ao atualizar status do operador.");
    }
  } catch (err) {
    alert("Falha de conexão ao atualizar status.");
  }
};

/**
 * Abre o modal de edição e preenche os dados do operador selecionado.
 */
window.abrirModalEdicao = function(uuid) {
  const op = AppState.operadores.find(o => o.uuid === uuid);
  if (!op) return;

  const modal = document.getElementById("modal-editar-operador");
  const inputUuid = document.getElementById("edit-op-uuid");
  const inputNome = document.getElementById("edit-op-nome");
  const inputEmail = document.getElementById("edit-op-email");
  const selectCargo = document.getElementById("edit-op-cargo");
  const inputSenha = document.getElementById("edit-op-senha");
  const inputConfirm = document.getElementById("edit-op-senha-confirm");
  const bannerErro = document.getElementById("modal-edit-error-banner");

  if (!modal) return;

  inputUuid.value = op.uuid;
  inputNome.value = op.nome;
  inputEmail.value = op.email;
  selectCargo.value = op.cargo;
  inputSenha.value = "";
  inputConfirm.value = "";
  bannerErro.style.display = "none";

  modal.style.display = "flex";
};

window.fecharModalEdicao = function() {
  const modal = document.getElementById("modal-editar-operador");
  if (modal) modal.style.display = "none";
};

function configurarEventosModalEdicao() {
  const btnFechar = document.getElementById("btn-fechar-modal-edit");
  const btnCancelar = document.getElementById("btn-cancelar-modal-edit");
  const formEditar = document.getElementById("form-editar-operador");

  if (btnFechar) btnFechar.addEventListener("click", fecharModalEdicao);
  if (btnCancelar) btnCancelar.addEventListener("click", fecharModalEdicao);

  if (formEditar) {
    formEditar.addEventListener("submit", async (e) => {
      e.preventDefault();

      const uuid = document.getElementById("edit-op-uuid").value;
      const nome = document.getElementById("edit-op-nome").value.trim();
      const email = document.getElementById("edit-op-email").value.trim().toLowerCase();
      const cargo = document.getElementById("edit-op-cargo").value;
      const senha = document.getElementById("edit-op-senha").value;
      const confirmacao = document.getElementById("edit-op-senha-confirm").value;
      const bannerErro = document.getElementById("modal-edit-error-banner");
      const textoErro = document.getElementById("modal-edit-error-text");
      const btnSalvar = document.getElementById("btn-salvar-modal-edit");
      const btnText = document.getElementById("btn-salvar-modal-edit-text");

      bannerErro.style.display = "none";

      if (nome.length < 3) {
        bannerErro.style.display = "flex";
        textoErro.textContent = "Nome deve conter no mínimo 3 caracteres.";
        return;
      }

      if (senha && senha.length < 6) {
        bannerErro.style.display = "flex";
        textoErro.textContent = "A nova senha deve ter no mínimo 6 caracteres.";
        return;
      }

      if (senha && senha !== confirmacao) {
        bannerErro.style.display = "flex";
        textoErro.textContent = "As novas senhas não coincidem.";
        return;
      }

      btnSalvar.disabled = true;
      btnText.innerHTML = `${SPINNER_SVG} <span>Salvando alterações...</span>`;

      const payload = { nome, email, cargo };
      if (senha) {
        payload.senha = senha;
        payload.confirmacao_senha = confirmacao;
      }

      try {
        const res = await fetch(`/api/v1/operadores/${uuid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success) {
          fecharModalEdicao();
          carregarListaOperadores();
          // Se o próprio admin logado editou seu nome ou cargo, atualiza a topbar
          if (AppState.usuarioLogado && AppState.usuarioLogado.uuid === uuid) {
            AppState.usuarioLogado.nome = nome;
            AppState.usuarioLogado.cargo = cargo;
            renderizarTopbarUsuario(AppState.usuarioLogado);
          }
        } else {
          bannerErro.style.display = "flex";
          textoErro.textContent = json.error?.message || "Erro ao salvar alterações.";
        }
      } catch (err) {
        bannerErro.style.display = "flex";
        textoErro.textContent = "Falha de conexão ao atualizar dados do operador.";
      } finally {
        btnSalvar.disabled = false;
        btnText.textContent = "Salvar Alterações";
      }
    });
  }
}

// ============================================================================
// 6. LISTAGEM INTEGRADA DE HÓSPEDES
// ============================================================================

async function carregarListaHospedes() {
  const tbody = document.getElementById("tbody-hospedes");
  if (!tbody) return;

  try {
    const res = await fetch("/api/v1/hospedes", { credentials: "include" });
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      if (json.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum hóspede cadastrado ainda.</td></tr>`;
        return;
      }
      tbody.innerHTML = json.data.map(h => `
        <tr>
          <td style="font-weight: 600;">${h.nome}</td>
          <td>${h.email}</td>
          <td>${h.cpf}</td>
          <td>${h.telefone}</td>
          <td>
            <span class="badge-status ${h.is_ativo === 1 ? 'badge-status-ativo' : 'badge-status-inativo'}">
              <span class="dot-status ${h.is_ativo === 1 ? 'dot-ativo' : 'dot-inativo'}"></span>
              ${h.is_ativo === 1 ? 'Ativo' : 'Inativo'}
            </span>
          </td>
        </tr>
      `).join("");
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-error-text); padding: 1.5rem;">Falha ao carregar lista de hóspedes.</td></tr>`;
  }
}
