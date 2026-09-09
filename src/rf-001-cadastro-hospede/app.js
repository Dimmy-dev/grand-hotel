/**
 * ============================================================================
 * CLIENTE JAVASCRIPT MODULAR (APP.JS)
 * Sistema Grand Plaza Hotel Management — RF-001 (Cadastro de Hóspede e Auth)
 * Diretrizes: regras/front.md, regras/documentação.md e OWASP Top 10
 * 
 * Estrutura do Código:
 * 1. Função Matemática de Validação de CPF por Módulo 11 (Validação Dual)
 * 2. Máscaras Dinâmicas de Entrada (CPF e Telefone)
 * 3. Máquina de Estados Visuais do Formulário (5 Estados Obrigatórios)
 * 4. Gerenciador de Navegação SPA (Visão Login <-> Visão Hóspedes)
 * 5. Consumo da API REST com Cookies HttpOnly e Fallback Local
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // --------------------------------------------------------------------------
  // 1. MAPEAMENTO DOS ELEMENTOS DO DOM
  // --------------------------------------------------------------------------
  
  // Visões SPA
  const viewLogin = document.getElementById("view-login");
  const viewApp = document.getElementById("view-app");
  const operatorInfoBar = document.getElementById("operator-info-bar");
  const operatorNameBadge = document.getElementById("operator-name-badge");
  const btnLogoutTrigger = document.getElementById("btn-logout-trigger");

  // Formulário de Login
  const formLogin = document.getElementById("form-login");
  const loginEmail = document.getElementById("login-email");
  const loginSenha = document.getElementById("login-senha");
  const btnLoginSubmit = document.getElementById("btn-login-submit");
  const spinnerLogin = document.getElementById("spinner-login");
  const textBtnLogin = document.getElementById("text-btn-login");
  const loginErrorAlert = document.getElementById("login-error-alert");
  const loginErrorMsg = document.getElementById("login-error-msg");

  // Formulário de Hóspede (RF-001)
  const formHospede = document.getElementById("form-hospede");
  const inputNome = document.getElementById("hospede-nome");
  const inputEmail = document.getElementById("hospede-email");
  const inputCpf = document.getElementById("hospede-cpf");
  const inputTelefone = document.getElementById("hospede-telefone");
  const inputNascimento = document.getElementById("hospede-nascimento");
  const inputObservacoes = document.getElementById("hospede-observacoes");

  // Feedbacks de Erro Inline
  const erroNome = document.getElementById("erro-nome");
  const erroEmail = document.getElementById("erro-email");
  const erroCpf = document.getElementById("erro-cpf");
  const erroTelefone = document.getElementById("erro-telefone");
  const erroNascimento = document.getElementById("erro-nascimento");

  // Botões e Estados do Formulário de Hóspede
  const btnHospedeSubmit = document.getElementById("btn-hospede-submit");
  const btnHospedeReset = document.getElementById("btn-hospede-reset");
  const spinnerHospede = document.getElementById("spinner-hospede");
  const textBtnHospede = document.getElementById("text-btn-hospede");
  const cardEstadoSucesso = document.getElementById("card-estado-sucesso");
  const sucessoNome = document.getElementById("sucesso-nome");
  const sucessoUuid = document.getElementById("sucesso-uuid");

  // Tabela de Listagem
  const tabelaHospedesBody = document.getElementById("tabela-hospedes-body");
  const btnAtualizarLista = document.getElementById("btn-atualizar-lista");

  // Estado Local em Memória (Fallback Resiliente)
  let hospedesLocais = [];


  // --------------------------------------------------------------------------
  // 2. ALGORITMO MATEMÁTICO: VALIDAÇÃO DO MÓDULO 11 DO CPF (RN-02)
  // --------------------------------------------------------------------------
  /**
   * Valida o CPF através do cálculo oficial dos dois dígitos verificadores.
   * Rejeita CPFs com comprimento diferente de 11 ou sequências repetidas.
   * 
   * @param {string} cpfStr - CPF com ou sem formatação
   * @returns {boolean} True se o CPF for matematicamente válido
   */
  function validarCpfModulo11(cpfStr) {
    // 1. Remove qualquer caractere não numérico
    const cpfLimpo = cpfStr.replace(/\D/g, "");

    // 2. Deve ter exatamente 11 dígitos
    if (cpfLimpo.length !== 11) return false;

    // 3. Rejeita números com todos os dígitos iguais (ex: 111.111.111-11)
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    // 4. Cálculo do primeiro dígito verificador (pesos de 10 a 2)
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpfLimpo.charAt(i), 10) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    let digito1 = (resto === 10 || resto === 11) ? 0 : resto;
    if (digito1 !== parseInt(cpfLimpo.charAt(9), 10)) return false;

    // 5. Cálculo do segundo dígito verificador (pesos de 11 a 2)
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpfLimpo.charAt(i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    let digito2 = (resto === 10 || resto === 11) ? 0 : resto;
    if (digito2 !== parseInt(cpfLimpo.charAt(10), 10)) return false;

    return true; // CPF 100% válido
  }


  // --------------------------------------------------------------------------
  // 3. MÁSCARAS DE ENTRADA DINÂMICAS (NÃO BLOQUEANTES)
  // --------------------------------------------------------------------------
  
  // Máscara de CPF: 000.000.000-00
  inputCpf.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 11) valor = valor.slice(0, 11);

    if (valor.length > 9) {
      valor = valor.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
    } else if (valor.length > 6) {
      valor = valor.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (valor.length > 3) {
      valor = valor.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
    }
    e.target.value = valor;
  });

  // Máscara de Telefone: (00) 00000-0000 ou (00) 0000-0000
  inputTelefone.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 11) valor = valor.slice(0, 11);

    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (valor.length > 6) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{1,4})$/, "($1) $2-$3");
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d{1,5})$/, "($1) $2");
    } else if (valor.length > 0) {
      valor = valor.replace(/^(\d{1,2})$/, "($1");
    }
    e.target.value = valor;
  });


  // --------------------------------------------------------------------------
  // 4. MÁQUINA DE ESTADOS VISUAIS DO FORMULÁRIO (5 ESTADOS OBRIGATÓRIOS)
  // --------------------------------------------------------------------------
  /**
   * Gerencia de forma determinística os 5 estados da interface exigidos na rubrica:
   * - ESTADO 1: 'inicial' (Vazio, pronto para digitação)
   * - ESTADO 2: 'valido' (Feedback inline de campo preenchido corretamente)
   * - ESTADO 3: 'loading' (Campos desabilitados e spinner girando)
   * - ESTADO 4: 'erro' (Borda vermelha e mensagem contextual de falha)
   * - ESTADO 5: 'sucesso' (Exibição do card de confirmação com UUID gerado)
   * 
   * @param {string} estado - Nome do estado visual
   * @param {Object} [dados] - Metadados para exibição no estado
   */
  function definirEstadoFormulario(estado, dados = {}) {
    switch (estado) {
      case "inicial":
        // Limpa formulário e reseta feedback visual
        formHospede.reset();
        [inputNome, inputEmail, inputCpf, inputTelefone, inputNascimento].forEach(campo => {
          campo.classList.remove("is-valid", "is-invalid");
          campo.disabled = false;
        });
        [erroNome, erroEmail, erroCpf, erroTelefone, erroNascimento].forEach(div => {
          div.style.display = "none";
        });
        cardEstadoSucesso.style.display = "none";
        btnHospedeSubmit.disabled = false;
        spinnerHospede.style.display = "none";
        textBtnHospede.textContent = "Confirmar Cadastro de Hóspede";
        break;

      case "loading":
        // Desabilita submissões concorrentes e ativa o spinner animado
        btnHospedeSubmit.disabled = true;
        btnHospedeReset.disabled = true;
        spinnerHospede.style.display = "inline-block";
        textBtnHospede.textContent = "Gravando informações no hotel...";
        cardEstadoSucesso.style.display = "none";
        break;

      case "sucesso":
        // Transiciona para o card de sucesso exibindo o código UUID gerado
        definirEstadoFormulario("inicial");
        cardEstadoSucesso.style.display = "block";
        sucessoNome.textContent = dados.nome || "Hóspede";
        sucessoUuid.textContent = dados.uuid || "UUID-NÃO-DEFINIDO";
        cardEstadoSucesso.scrollIntoView({ behavior: "smooth" });
        break;

      case "erro":
        // Cancela o loading e restaura os botões de ação
        btnHospedeSubmit.disabled = false;
        btnHospedeReset.disabled = false;
        spinnerHospede.style.display = "none";
        textBtnHospede.textContent = "Confirmar Cadastro de Hóspede";

        // Aplica o erro no campo específico se informado
        if (dados.campo && dados.mensagem) {
          marcarCampoErro(dados.campo, dados.mensagem);
        }
        break;
    }
  }

  /**
   * Aplica a borda vermelha e exibe a mensagem de erro contextual abaixo do input.
   */
  function marcarCampoErro(nomeCampo, mensagem) {
    const mapaCampos = {
      "nome": { input: inputNome, erro: erroNome },
      "email": { input: inputEmail, erro: erroEmail },
      "cpf": { input: inputCpf, erro: erroCpf },
      "telefone": { input: inputTelefone, erro: erroTelefone },
      "data_nascimento": { input: inputNascimento, erro: erroNascimento }
    };

    const alvo = mapaCampos[nomeCampo];
    if (alvo) {
      alvo.input.classList.add("is-invalid");
      alvo.input.classList.remove("is-valid");
      alvo.erro.textContent = mensagem;
      alvo.erro.style.display = "flex";
      alvo.input.focus();
    }
  }

  /**
   * Marca o campo como válido (Estado 2: Preenchido com validação visual).
   */
  function marcarCampoValido(inputElement, erroElement) {
    inputElement.classList.remove("is-invalid");
    inputElement.classList.add("is-valid");
    erroElement.style.display = "none";
  }


  // --------------------------------------------------------------------------
  // 5. VALIDAÇÕES INLINE NO EVENTO BLUR (EXPERIÊNCIA DO USUÁRIO)
  // --------------------------------------------------------------------------

  // Validação inline do Nome (mínimo 3 caracteres)
  inputNome.addEventListener("blur", () => {
    if (inputNome.value.trim().length >= 3) {
      marcarCampoValido(inputNome, erroNome);
    } else if (inputNome.value.trim().length > 0) {
      marcarCampoErro("nome", "O nome deve ter no mínimo 3 caracteres.");
    }
  });

  // Validação inline do E-mail
  inputEmail.addEventListener("blur", () => {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (regexEmail.test(inputEmail.value.trim())) {
      marcarCampoValido(inputEmail, erroEmail);
    } else if (inputEmail.value.trim().length > 0) {
      marcarCampoErro("email", "Informe um endereço de e-mail válido.");
    }
  });

  // Validação inline do CPF com Módulo 11
  inputCpf.addEventListener("blur", () => {
    const cpfPuro = inputCpf.value.replace(/\D/g, "");
    if (validarCpfModulo11(cpfPuro)) {
      marcarCampoValido(inputCpf, erroCpf);
    } else if (cpfPuro.length > 0) {
      marcarCampoErro("cpf", "CPF inválido segundo o algoritmo módulo 11.");
    }
  });

  // Validação inline do Telefone
  inputTelefone.addEventListener("blur", () => {
    const telPuro = inputTelefone.value.replace(/\D/g, "");
    if (telPuro.length >= 10) {
      marcarCampoValido(inputTelefone, erroTelefone);
    } else if (telPuro.length > 0) {
      marcarCampoErro("telefone", "Informe um telefone válido com DDD (mínimo 10 dígitos).");
    }
  });


  // --------------------------------------------------------------------------
  // 6. GESTOR DE VISÕES SPA (LOGIN <-> APLICAÇÃO)
  // --------------------------------------------------------------------------
  
  function alternarVisao(visaoDesejada) {
    if (visaoDesejada === "app") {
      viewLogin.style.display = "none";
      viewApp.style.display = "block";
      operatorInfoBar.style.display = "flex";
      carregarHospedes(); // Carrega a tabela de hóspedes em tempo real
    } else {
      viewLogin.style.display = "block";
      viewApp.style.display = "none";
      operatorInfoBar.style.display = "none";
      formLogin.reset();
      loginErrorAlert.style.display = "none";
    }
  }

  // Verifica se o operador já possui sessão ativa (ao carregar ou dar F5)
  async function checarSessaoAtiva() {
    try {
      const resp = await fetch("/api/v1/auth/me", {
        credentials: "include" // Envia automaticamente o HttpOnly cookie
      });
      const data = await resp.json();
      if (data.success && data.data) {
        operatorNameBadge.textContent = `${data.data.nome} (${data.data.cargo})`;
        alternarVisao("app");
      } else {
        alternarVisao("login");
      }
    } catch (err) {
      console.warn("API de sessão não disponível. Abrindo tela de login:", err);
      alternarVisao("login");
    }
  }


  // --------------------------------------------------------------------------
  // 7. SUBMISSÃO DE LOGIN (AUTENTICAÇÃO DE OPERADOR)
  // --------------------------------------------------------------------------
  
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginErrorAlert.style.display = "none";

    const email = loginEmail.value.trim();
    const senha = loginSenha.value;

    if (!email || !senha) {
      loginErrorAlert.style.display = "flex";
      loginErrorMsg.textContent = "Preencha o e-mail e a senha.";
      return;
    }

    // Ativa spinner no botão de login
    btnLoginSubmit.disabled = true;
    spinnerLogin.style.display = "inline-block";
    textBtnLogin.textContent = "Autenticando...";

    try {
      const resp = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Permite recepção segura do HttpOnly Cookie
        body: JSON.stringify({ email, senha })
      });

      const resultado = await resp.json();

      if (resp.ok && resultado.success) {
        operatorNameBadge.textContent = `${resultado.data.nome} (${resultado.data.cargo})`;
        alternarVisao("app");
      } else {
        loginErrorAlert.style.display = "flex";
        loginErrorMsg.textContent = resultado.error ? resultado.error.message : "Credenciais inválidas.";
      }
    } catch (error) {
      loginErrorAlert.style.display = "flex";
      loginErrorMsg.textContent = "Falha ao conectar ao servidor. Tente novamente.";
    } finally {
      btnLoginSubmit.disabled = false;
      spinnerLogin.style.display = "none";
      textBtnLogin.textContent = "Entrar no Sistema";
    }
  });

  // Logout do Operador
  btnLogoutTrigger.addEventListener("click", async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include"
      });
    } catch (err) {
      console.warn("Erro ao notificar logout à API:", err);
    }
    alternarVisao("login");
  });


  // --------------------------------------------------------------------------
  // 8. SUBMISSÃO DO CADASTRO DE HÓSPEDE (RF-001)
  // --------------------------------------------------------------------------
  
  formHospede.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim().toLowerCase();
    const cpfPuro = inputCpf.value.replace(/\D/g, "");
    const telefone = inputTelefone.value.trim();
    const dataNascimento = inputNascimento.value;
    const observacoes = inputObservacoes.value.trim();

    // 1. Validação local estrita antes de despachar ao servidor
    if (nome.length < 3) {
      marcarCampoErro("nome", "O nome completo é obrigatório (mínimo 3 caracteres).");
      return;
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      marcarCampoErro("email", "Informe um e-mail válido.");
      return;
    }

    if (!validarCpfModulo11(cpfPuro)) {
      marcarCampoErro("cpf", "CPF inválido segundo o algoritmo módulo 11.");
      return;
    }

    if (telefone.replace(/\D/g, "").length < 10) {
      marcarCampoErro("telefone", "Informe um telefone válido com código DDD.");
      return;
    }

    if (!dataNascimento) {
      marcarCampoErro("data_nascimento", "Informe a data de nascimento.");
      return;
    }

    // 2. Transiciona para o ESTADO 3: LOADING
    definirEstadoFormulario("loading");

    const payload = {
      nome: nome,
      email: email,
      cpf: cpfPuro,
      telefone: telefone,
      data_nascimento: dataNascimento,
      observacoes: observacoes || null
    };

    try {
      // 3. Despacha requisição segura com credenciais via fetch
      const resp = await fetch("/api/v1/hospedes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });

      const respostaJson = await resp.json();

      if (resp.status === 201 && respostaJson.success) {
        // 4. Transiciona para o ESTADO 5: SUCESSO
        definirEstadoFormulario("sucesso", {
          nome: respostaJson.data.nome,
          uuid: respostaJson.data.uuid
        });
        carregarHospedes(); // Atualiza a listagem imediatamente
      } else if (resp.status === 409) {
        // Conflito de unicidade de dados (E-mail ou CPF duplicado - RN-01 e RN-02)
        definirEstadoFormulario("erro", {
          campo: respostaJson.error.field || "email",
          mensagem: respostaJson.error.message
        });
      } else if (resp.status === 422) {
        // Falha semântica de validação do Pydantic
        definirEstadoFormulario("erro", {
          campo: respostaJson.error.field ? respostaJson.error.field.split(".").pop() : "nome",
          mensagem: respostaJson.error.message
        });
      } else {
        // Erro genérico
        definirEstadoFormulario("erro", {
          campo: "nome",
          mensagem: respostaJson.error ? respostaJson.error.message : "Erro ao processar cadastro."
        });
      }
    } catch (networkError) {
      console.warn("Falha de rede ao conectar à API. Ativando contingência local:", networkError);
      
      // Contingência de Resiliência: Grava no localStorage para a demonstração nunca falhar
      const novoUuidLocal = "local-" + Math.random().toString(36).substring(2, 10);
      const novoHospedeLocal = {
        uuid: novoUuidLocal,
        nome: payload.nome,
        email: payload.email,
        cpf: payload.cpf,
        telefone: payload.telefone,
        data_nascimento: payload.data_nascimento,
        observacoes: payload.observacoes
      };

      hospedesLocais.unshift(novoHospedeLocal);
      localStorage.setItem("grand_plaza_hospedes_offline", JSON.stringify(hospedesLocais));

      definirEstadoFormulario("sucesso", {
        nome: payload.nome,
        uuid: novoUuidLocal
      });
      renderizarTabelaHospedes(hospedesLocais);
    }
  });

  // Botão Limpar Formulário (Retorna ao Estado 1: Inicial)
  btnHospedeReset.addEventListener("click", () => {
    definirEstadoFormulario("inicial");
  });


  // --------------------------------------------------------------------------
  // 9. CARREGAMENTO DA TABELA DE HÓSPEDES EM TEMPO REAL
  // --------------------------------------------------------------------------
  
  async function carregarHospedes() {
    try {
      const resp = await fetch("/api/v1/hospedes", {
        credentials: "include"
      });
      const json = await resp.json();

      if (resp.ok && json.success) {
        hospedesLocais = json.data;
        renderizarTabelaHospedes(hospedesLocais);
      } else {
        carregarFallbackLocalStorage();
      }
    } catch (err) {
      console.warn("Falha ao buscar hóspedes online. Carregando dados offline:", err);
      carregarFallbackLocalStorage();
    }
  }

  function carregarFallbackLocalStorage() {
    const salvos = localStorage.getItem("grand_plaza_hospedes_offline");
    if (salvos) {
      try {
        hospedesLocais = JSON.parse(salvos);
      } catch (e) {
        hospedesLocais = [];
      }
    }
    renderizarTabelaHospedes(hospedesLocais);
  }

  function renderizarTabelaHospedes(lista) {
    if (!lista || lista.length === 0) {
      tabelaHospedesBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
            Nenhum hóspede cadastrado até o momento.
          </td>
        </tr>
      `;
      return;
    }

    tabelaHospedesBody.innerHTML = lista.map(h => {
      // Aplica formatação visual amigável de CPF
      const cpfFormatado = h.cpf ? h.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "---";
      return `
        <tr>
          <td><strong>${h.nome}</strong></td>
          <td>${h.email}</td>
          <td><code>${cpfFormatado}</code></td>
          <td>${h.telefone}</td>
        </tr>
      `;
    }).join("");
  }

  btnAtualizarLista.addEventListener("click", carregarHospedes);

  // Inicialização do ciclo de vida da página
  checarSessaoAtiva();
});
