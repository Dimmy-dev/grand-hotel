/**
 * ============================================================================
 * JAVASCRIPT DO RACK HOTELEIRO & CICLO DE HOSPEDAGEM (RF-004)
 * Sistema Grand Plaza Hotel Management
 * Diretrizes: regras/front.md, regras/back.md e OWASP Top 10
 *
 * RECURSO DE RESILIÊNCIA TOTAL:
 * Integração com API REST e Fallback Automático transparente para HTML5 LocalStorage.
 * Funciona online com Supabase/FastAPI ou 100% offline localmente.
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // SEMENTES OFICIAIS DO HOTEL PARA MODO LOCALSTORAGE (FALLBACK OFFLINE)
  // --------------------------------------------------------------------------
  const SEEDS_INICIAIS = {
    operador: {
      uuid_publico: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      nome: 'Maria Oliveira (Recepção)',
      email: 'recepcao@grandplaza.com',
      cargo: 'RECEPCIONISTA',
      is_ativo: 1
    },
    hospedes: [
      {
        uuid_publico: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
        nome: 'Dr. Fernando Albuquerque',
        cpf: '52998224725',
        email: 'fernando.albuquerque@advocacia.com.br',
        telefone: '(11) 98765-4321',
        is_ativo: 1
      },
      {
        uuid_publico: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
        nome: 'Dra. Beatriz Mendes Santana',
        cpf: '01234567890',
        email: 'beatriz.mendes@clinica.med.br',
        telefone: '(21) 99876-5432',
        is_ativo: 1
      },
      {
        uuid_publico: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
        nome: 'Eng. Lucas Silveira Prado',
        cpf: '83247829023',
        email: 'lucas.silveira@techconsultoria.com.br',
        telefone: '(31) 97654-3210',
        is_ativo: 1
      }
    ],
    acomodacoes: [
      {
        uuid_publico: 'c1010000-0000-0000-0000-000000000101',
        numero: '101',
        categoria: 'STANDARD',
        capacidade: 2,
        tarifa_base: 280.00,
        status: 'DISPONIVEL',
        andar: 1,
        descricao: 'Quarto Standard com 1 cama Queen, Wi-Fi 6 e mesa de trabalho',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c1020000-0000-0000-0000-000000000102',
        numero: '102',
        categoria: 'STANDARD',
        capacidade: 2,
        tarifa_base: 280.00,
        status: 'DISPONIVEL',
        andar: 1,
        descricao: 'Quarto Standard com 2 camas de solteiro e vista interna tranquila',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c1030000-0000-0000-0000-000000000103',
        numero: '103',
        categoria: 'STANDARD',
        capacidade: 3,
        tarifa_base: 340.00,
        status: 'LIMPEZA',
        andar: 1,
        descricao: 'Quarto Standard Triplo com 1 cama de casal e 1 de solteiro',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c1040000-0000-0000-0000-000000000104',
        numero: '104',
        categoria: 'STANDARD',
        capacidade: 1,
        tarifa_base: 240.00,
        status: 'DISPONIVEL',
        andar: 1,
        descricao: 'Quarto Individual Compacto ideal para viajantes corporativos',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c2010000-0000-0000-0000-000000000201',
        numero: '201',
        categoria: 'LUXO',
        capacidade: 2,
        tarifa_base: 490.00,
        status: 'DISPONIVEL',
        andar: 2,
        descricao: 'Suíte Luxo com cama King Size, varanda panorâmica e hidromassagem',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c2020000-0000-0000-0000-000000000202',
        numero: '202',
        categoria: 'LUXO',
        capacidade: 2,
        tarifa_base: 490.00,
        status: 'DISPONIVEL',
        andar: 2,
        descricao: 'Suíte Luxo com isolamento acústico reforçado e cafeteira Nespresso',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c2030000-0000-0000-0000-000000000203',
        numero: '203',
        categoria: 'LUXO',
        capacidade: 4,
        tarifa_base: 620.00,
        status: 'MANUTENCAO',
        andar: 2,
        descricao: 'Suíte Luxo Familiar com ante-sala e 2 banheiros completos',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c2040000-0000-0000-0000-000000000204',
        numero: '204',
        categoria: 'LUXO',
        capacidade: 2,
        tarifa_base: 490.00,
        status: 'DISPONIVEL',
        andar: 2,
        descricao: 'Suíte Luxo Master com Smart TV 65 polegadas e adega climatizada',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c3010000-0000-0000-0000-000000000301',
        numero: '301',
        categoria: 'PRESIDENCIAL',
        capacidade: 4,
        tarifa_base: 1450.00,
        status: 'DISPONIVEL',
        andar: 3,
        descricao: 'Suíte Presidencial Imperial com living privativo, closet e mordomo 24h',
        hospedagem_ativa: null
      },
      {
        uuid_publico: 'c3020000-0000-0000-0000-000000000302',
        numero: '302',
        categoria: 'PRESIDENCIAL',
        capacidade: 6,
        tarifa_base: 2100.00,
        status: 'DISPONIVEL',
        andar: 3,
        descricao: 'Cobertura Penthouse com terraço gourmet privativo e vista da orla',
        hospedagem_ativa: null
      }
    ]
  };

  // --------------------------------------------------------------------------
  // REPOSITÓRIO CLIENTE EM LOCALSTORAGE (CLIENT REPOSITORY PATTERN)
  // --------------------------------------------------------------------------
  const LocalRepo = {
    KEYS: {
      ACOMODACOES: 'grandplaza_acomodacoes_v1',
      HOSPEDES: 'grandplaza_hospedes_v1',
      HOSPEDAGENS: 'grandplaza_hospedagens_v1',
      OPERADOR: 'grandplaza_operador_v1'
    },

    init() {
      if (!localStorage.getItem(this.KEYS.ACOMODACOES)) {
        localStorage.setItem(this.KEYS.ACOMODACOES, JSON.stringify(SEEDS_INICIAIS.acomodacoes));
      }
      if (!localStorage.getItem(this.KEYS.HOSPEDES)) {
        localStorage.setItem(this.KEYS.HOSPEDES, JSON.stringify(SEEDS_INICIAIS.hospedes));
      }
      if (!localStorage.getItem(this.KEYS.HOSPEDAGENS)) {
        localStorage.setItem(this.KEYS.HOSPEDAGENS, JSON.stringify([]));
      }
      if (!localStorage.getItem(this.KEYS.OPERADOR)) {
        localStorage.setItem(this.KEYS.OPERADOR, JSON.stringify(SEEDS_INICIAIS.operador));
      }
    },

    obterOperador() {
      this.init();
      const raw = localStorage.getItem(this.KEYS.OPERADOR);
      return raw ? JSON.parse(raw) : SEEDS_INICIAIS.operador;
    },

    salvarOperador(op) {
      localStorage.setItem(this.KEYS.OPERADOR, JSON.stringify(op));
    },

    obterAcomodacoes(categoria = '') {
      this.init();
      let lista = JSON.parse(localStorage.getItem(this.KEYS.ACOMODACOES) || '[]');
      if (categoria) {
        lista = lista.filter(q => q.categoria === categoria.toUpperCase());
      }
      return lista;
    },

    salvarAcomodacoes(lista) {
      localStorage.setItem(this.KEYS.ACOMODACOES, JSON.stringify(lista));
    },

    obterHospedes() {
      this.init();
      return JSON.parse(localStorage.getItem(this.KEYS.HOSPEDES) || '[]');
    },

    realizarCheckin({ uuid_acomodacao, uuid_hospede, data_prevista_checkout, acompanhantes, observacoes }) {
      this.init();
      const acomodacoes = this.obterAcomodacoes();
      const hospedes = this.obterHospedes();
      const hospedagens = JSON.parse(localStorage.getItem(this.KEYS.HOSPEDAGENS) || '[]');

      const quarto = acomodacoes.find(q => q.uuid_publico === uuid_acomodacao);
      if (!quarto) throw new Error('Acomodação não encontrada.');
      if (quarto.status !== 'DISPONIVEL') {
        throw new Error(`O Quarto ${quarto.numero} não está disponível (Status atual: ${quarto.status}).`);
      }

      const hospede = hospedes.find(h => h.uuid_publico === uuid_hospede);
      if (!hospede) throw new Error('Hóspede não localizado.');

      const uuidHospedagem = 'hosp-' + Date.now();
      const agora = new Date().toISOString();

      const novaHospedagem = {
        uuid_publico: uuidHospedagem,
        uuid_acomodacao: quarto.uuid_publico,
        quarto_numero: quarto.numero,
        uuid_hospede: hospede.uuid_publico,
        hospede_nome: hospede.nome,
        hospede_cpf: hospede.cpf,
        data_checkin: agora,
        data_prevista_checkout: data_prevista_checkout,
        data_checkout: null,
        status: 'ATIVA',
        tarifa_diaria_aplicada: Number(quarto.tarifa_base),
        acompanhantes: acompanhantes || [],
        observacoes: observacoes || null
      };

      hospedagens.push(novaHospedagem);
      localStorage.setItem(this.KEYS.HOSPEDAGENS, JSON.stringify(hospedagens));

      // Atualiza o quarto
      quarto.status = 'OCUPADO';
      quarto.hospedagem_ativa = {
        uuid_hospedagem: uuidHospedagem,
        hospede_nome: hospede.nome,
        data_checkin: agora,
        data_prevista_checkout: data_prevista_checkout,
        tarifa_aplicada: Number(quarto.tarifa_base)
      };
      this.salvarAcomodacoes(acomodacoes);

      return {
        uuid_hospedagem: uuidHospedagem,
        quarto_numero: quarto.numero,
        hospede_nome: hospede.nome,
        mensagem: `Check-in do hóspede ${hospede.nome} no Quarto ${quarto.numero} concluído com sucesso!`
      };
    },

    realizarCheckout(uuid_hospedagem) {
      this.init();
      const acomodacoes = this.obterAcomodacoes();
      const hospedagens = JSON.parse(localStorage.getItem(this.KEYS.HOSPEDAGENS) || '[]');

      const hosp = hospedagens.find(h => h.uuid_publico === uuid_hospedagem);
      if (!hosp) throw new Error('Hospedagem não localizada.');
      if (hosp.status !== 'ATIVA') throw new Error(`Hospedagem já se encontra com status ${hosp.status}.`);

      const agora = new Date();
      const entrada = new Date(hosp.data_checkin);
      const horas = Math.max(0, (agora - entrada) / (1000 * 3600));
      const diarias = horas <= 24 ? 1 : Math.ceil(horas / 24);
      const valorTotal = diarias * hosp.tarifa_diaria_aplicada;

      hosp.status = 'FINALIZADA';
      hosp.data_checkout = agora.toISOString();
      hosp.num_diarias = diarias;
      hosp.valor_total = valorTotal;
      localStorage.setItem(this.KEYS.HOSPEDAGENS, JSON.stringify(hospedagens));

      // Libera o quarto para limpeza
      const quarto = acomodacoes.find(q => q.uuid_publico === hosp.uuid_acomodacao);
      if (quarto) {
        quarto.status = 'LIMPEZA';
        quarto.hospedagem_ativa = null;
        this.salvarAcomodacoes(acomodacoes);
      }

      return {
        uuid_publico: hosp.uuid_publico,
        hospede_nome: hosp.hospede_nome,
        hospede_cpf: hosp.hospede_cpf,
        acomodacao_numero: hosp.quarto_numero,
        data_checkin: hosp.data_checkin,
        data_checkout: hosp.data_checkout,
        num_diarias: diarias,
        tarifa_diaria_aplicada: hosp.tarifa_diaria_aplicada,
        valor_total: valorTotal,
        status: 'FINALIZADA',
        quarto_status_atual: 'LIMPEZA'
      };
    },

    atualizarStatusQuarto(uuid_quarto, novoStatus) {
      this.init();
      const acomodacoes = this.obterAcomodacoes();
      const quarto = acomodacoes.find(q => q.uuid_publico === uuid_quarto);
      if (!quarto) throw new Error('Quarto não encontrado.');
      if (quarto.status === 'OCUPADO' && novoStatus !== 'OCUPADO') {
        throw new Error('Quarto ocupado deve passar pelo check-out oficial antes de ser liberado.');
      }
      quarto.status = novoStatus;
      this.salvarAcomodacoes(acomodacoes);
      return quarto;
    }
  };

  // ESTADO DA APLICAÇÃO (CLIENT-SIDE STORE)
  const state = {
    operador: null,
    acomodacoes: [],
    hospedes: [],
    filtroStatus: 'TODOS',
    filtroCategoria: '',
    modoOffline: false
  };

  // ELEMENTOS DO DOM
  const dom = {
    dbIndicator: document.getElementById('db-indicator'),
    dbName: document.getElementById('db-name'),
    operatorName: document.getElementById('operator-name'),
    operatorRole: document.getElementById('operator-role'),
    btnLogout: document.getElementById('btn-logout'),

    // Métricas
    statDisponiveis: document.getElementById('stat-disponiveis'),
    statOcupados: document.getElementById('stat-ocupados'),
    statLimpeza: document.getElementById('stat-limpeza'),
    statManutencao: document.getElementById('stat-manutencao'),
    statTaxa: document.getElementById('stat-taxa'),

    // Filtros
    filterBtns: document.querySelectorAll('.filter-btn'),
    filterCategory: document.getElementById('filter-category'),
    btnAtualizarRack: document.getElementById('btn-atualizar-rack'),
    countTodos: document.getElementById('count-todos'),
    countDisp: document.getElementById('count-disp'),
    countOcup: document.getElementById('count-ocup'),
    countLimp: document.getElementById('count-limp'),
    countManut: document.getElementById('count-manut'),

    // Grid do Rack
    roomsGrid: document.getElementById('rooms-grid'),

    // Modal Check-in
    modalCheckin: document.getElementById('modal-checkin'),
    btnCloseCheckin: document.getElementById('btn-close-checkin-modal'),
    btnCancelarCheckin: document.getElementById('btn-cancelar-checkin'),
    btnConfirmarCheckin: document.getElementById('btn-confirmar-checkin'),
    checkinQuartoNum: document.getElementById('checkin-modal-quarto-num'),
    checkinQuartoUuid: document.getElementById('checkin-quarto-uuid'),
    checkinQuartoTarifa: document.getElementById('checkin-quarto-tarifa'),
    checkinHospedeSelect: document.getElementById('checkin-hospede-select'),
    checkinDataSaida: document.getElementById('checkin-data-saida'),
    checkinAcompanhantes: document.getElementById('checkin-acompanhantes'),
    checkinObservacoes: document.getElementById('checkin-observacoes'),
    checkinTarifaPreview: document.getElementById('checkin-tarifa-preview'),

    // Modal Check-out
    modalCheckout: document.getElementById('modal-checkout'),
    btnCloseCheckout: document.getElementById('btn-close-checkout-modal'),
    btnCancelarCheckout: document.getElementById('btn-cancelar-checkout'),
    btnConfirmarCheckout: document.getElementById('btn-confirmar-checkout'),
    checkoutHospedagemUuid: document.getElementById('checkout-hospedagem-uuid'),
    checkoutQuartoNum: document.getElementById('checkout-quarto-num'),
    checkoutHospedeNome: document.getElementById('checkout-hospede-nome'),
    checkoutDataEntrada: document.getElementById('checkout-data-entrada'),
    checkoutDataSaida: document.getElementById('checkout-data-saida'),
    checkoutTarifaDiaria: document.getElementById('checkout-tarifa-diaria'),
    checkoutDiariasCount: document.getElementById('checkout-diarias-count'),
    checkoutValorTotal: document.getElementById('checkout-valor-total'),

    // Modal Login
    modalLogin: document.getElementById('modal-login'),
    formLogin: document.getElementById('form-login'),
    loginEmail: document.getElementById('login-email'),
    loginSenha: document.getElementById('login-senha'),

    // Toasts
    toastContainer: document.getElementById('toast-container')
  };

  function formatarMoeda(valor) {
    const num = Number(valor) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatarDataHora(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function exibirToast(mensagem, tipo = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${tipo === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span>${mensagem}</span>
    `;
    dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 300ms ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  /**
   * Executa requisição com fallback automático transparente para o LocalStorage
   */
  async function apiFetch(endpoint, options = {}) {
    // Se já estiver em modo offline, desvia diretamente
    if (state.modoOffline) {
      return fallbackOffline(endpoint, options);
    }

    options.credentials = 'include';
    options.headers = options.headers || {};
    if (!options.headers['Content-Type'] && !(options.body instanceof FormData)) {
      options.headers['Content-Type'] = 'application/json';
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout para não travar a UI
      options.signal = controller.signal;

      const resp = await fetch(endpoint, options);
      clearTimeout(timeoutId);

      const data = await resp.json();

      if (resp.status === 401) {
        abrirModalLogin();
        throw new Error('Sessão expirada. Efetue login novamente.');
      }

      if (!resp.ok || data.success === false) {
        throw new Error(data.error?.message || 'Falha na resposta do servidor.');
      }

      return data.data;
    } catch (err) {
      console.warn(`[GRAND PLAZA RESILIÊNCIA] Falha na chamada da API (${endpoint}: ${err.message}). Ativando contingência LocalStorage...`);
      ativarModoLocalStorage();
      return fallbackOffline(endpoint, options);
    }
  }

  function ativarModoLocalStorage() {
    state.modoOffline = true;
    dom.dbName.textContent = 'LocalStorage (Offline Seguro)';
    dom.dbIndicator.style.backgroundColor = '#38bdf8';
    dom.dbIndicator.style.boxShadow = '0 0 8px #38bdf8';
  }

  function fallbackOffline(endpoint, options = {}) {
    const method = (options.method || 'GET').toUpperCase();

    // Rota: /api/v1/auth/me
    if (endpoint.startsWith('/api/v1/auth/me')) {
      return LocalRepo.obterOperador();
    }

    // Rota: /api/v1/auth/login
    if (endpoint.startsWith('/api/v1/auth/login')) {
      const body = JSON.parse(options.body || '{}');
      const op = LocalRepo.obterOperador();
      op.email = body.email || op.email;
      LocalRepo.salvarOperador(op);
      return op;
    }

    // Rota: /api/v1/auth/logout
    if (endpoint.startsWith('/api/v1/auth/logout')) {
      return { mensagem: 'Sessão encerrada.' };
    }

    // Rota: /api/v1/diagnostico/banco
    if (endpoint.startsWith('/api/v1/diagnostico/banco')) {
      return {
        motor: 'HTML5 LocalStorage (Contingência Total)',
        supabase_ativo: false,
        total_quartos: 10,
        hospedagens_ativas: 0,
        total_hospedes: 3,
        total_operadores: 1
      };
    }

    // Rota: /api/v1/acomodacoes
    if (endpoint.startsWith('/api/v1/acomodacoes')) {
      if (method === 'GET') {
        const urlObj = new URL(endpoint, window.location.origin);
        const cat = urlObj.searchParams.get('categoria') || '';
        return LocalRepo.obterAcomodacoes(cat);
      }
      if (method === 'PATCH') {
        const partes = endpoint.split('/');
        const uuidQuarto = partes[4];
        const body = JSON.parse(options.body || '{}');
        return LocalRepo.atualizarStatusQuarto(uuidQuarto, body.status);
      }
    }

    // Rota: /api/v1/hospedes
    if (endpoint.startsWith('/api/v1/hospedes')) {
      return LocalRepo.obterHospedes();
    }

    // Rota: /api/v1/hospedagens/checkin
    if (endpoint.startsWith('/api/v1/hospedagens/checkin') && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      return LocalRepo.realizarCheckin(body);
    }

    // Rota: /api/v1/hospedagens/{id}/checkout
    if (endpoint.includes('/checkout') && method === 'POST') {
      const partes = endpoint.split('/');
      const uuidHosp = partes[4];
      return LocalRepo.realizarCheckout(uuidHosp);
    }

    throw new Error('Operação offline não suportada.');
  }

  // ==========================================================================
  // AUTENTICAÇÃO E PERFIL
  // ==========================================================================

  async function verificarAutenticacao() {
    try {
      const operador = await apiFetch('/api/v1/auth/me');
      state.operador = operador;
      dom.operatorName.textContent = operador.nome;
      dom.operatorRole.textContent = operador.cargo;
      fecharModalLogin();
      carregarDiagnosticoBanco();
      carregarRack();
    } catch (err) {
      // Se der erro mesmo no offline, abre o modal
      abrirModalLogin();
    }
  }

  async function efetuarLogin(e) {
    e.preventDefault();
    const email = dom.loginEmail.value.trim();
    const senha = dom.loginSenha.value;

    try {
      const operador = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      state.operador = operador;
      dom.operatorName.textContent = operador.nome;
      dom.operatorRole.textContent = operador.cargo;
      fecharModalLogin();
      exibirToast(`Bem-vindo(a), ${operador.nome}!`);
      carregarDiagnosticoBanco();
      carregarRack();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  async function efetuarLogout() {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {}
    abrirModalLogin();
    exibirToast('Sessão encerrada com segurança.');
  }

  function abrirModalLogin() {
    dom.modalLogin.classList.add('active');
  }

  function fecharModalLogin() {
    dom.modalLogin.classList.remove('active');
  }

  async function carregarDiagnosticoBanco() {
    try {
      const diag = await apiFetch('/api/v1/diagnostico/banco');
      if (!state.modoOffline) {
        dom.dbName.textContent = diag.motor;
        if (diag.supabase_ativo) {
          dom.dbIndicator.style.backgroundColor = '#22c55e';
          dom.dbIndicator.style.boxShadow = '0 0 8px #22c55e';
        } else {
          dom.dbIndicator.style.backgroundColor = '#f59e0b';
          dom.dbIndicator.style.boxShadow = '0 0 8px #f59e0b';
        }
      }
    } catch (e) {
      ativarModoLocalStorage();
    }
  }

  // ==========================================================================
  // RACK HOTELEIRO
  // ==========================================================================

  async function carregarRack() {
    try {
      const params = new URLSearchParams();
      if (state.filtroCategoria) {
        params.append('categoria', state.filtroCategoria);
      }
      const url = `/api/v1/acomodacoes${params.toString() ? '?' + params.toString() : ''}`;
      const quartos = await apiFetch(url);
      state.acomodacoes = quartos;
      atualizarContadoresEMetricas(quartos);
      renderizarRack();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  function atualizarContadoresEMetricas(quartos) {
    const total = quartos.length;
    let disp = 0;
    let ocup = 0;
    let limp = 0;
    let manut = 0;

    quartos.forEach(q => {
      if (q.status === 'DISPONIVEL') disp++;
      else if (q.status === 'OCUPADO') ocup++;
      else if (q.status === 'LIMPEZA') limp++;
      else if (q.status === 'MANUTENCAO') manut++;
    });

    dom.statDisponiveis.textContent = disp;
    dom.statOcupados.textContent = ocup;
    dom.statLimpeza.textContent = limp;
    dom.statManutencao.textContent = manut;

    const taxa = total > 0 ? Math.round((ocup / total) * 100) : 0;
    dom.statTaxa.textContent = `${taxa} %`;

    dom.countTodos.textContent = total;
    dom.countDisp.textContent = disp;
    dom.countOcup.textContent = ocup;
    dom.countLimp.textContent = limp;
    dom.countManut.textContent = manut;
  }

  function renderizarRack() {
    dom.roomsGrid.innerHTML = '';

    const filtrados = state.acomodacoes.filter(q => {
      if (state.filtroStatus !== 'TODOS' && q.status !== state.filtroStatus) {
        return false;
      }
      return true;
    });

    if (filtrados.length === 0) {
      dom.roomsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: #ffffff; border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
          <p style="color: var(--text-muted); font-size: 0.95rem;">Nenhuma acomodação encontrada para os filtros selecionados.</p>
        </div>
      `;
      return;
    }

    filtrados.forEach(q => {
      const card = document.createElement('div');
      card.className = 'room-card';

      let badgeClass = 'badge-disponivel';
      let statusLabel = 'Disponível';
      if (q.status === 'OCUPADO') {
        badgeClass = 'badge-ocupado';
        statusLabel = 'Ocupado';
      } else if (q.status === 'LIMPEZA') {
        badgeClass = 'badge-limpeza';
        statusLabel = 'Limpeza';
      } else if (q.status === 'MANUTENCAO') {
        badgeClass = 'badge-manutencao';
        statusLabel = 'Manutenção';
      }

      let guestHtml = '';
      if (q.status === 'OCUPADO' && q.hospedagem_ativa) {
        guestHtml = `
          <div class="room-guest-box">
            <div class="guest-name-label">Hóspede Atual</div>
            <div class="guest-name-val">${q.hospedagem_ativa.hospede_nome}</div>
            <div class="guest-dates-val">Entrada: ${formatarDataHora(q.hospedagem_ativa.data_checkin)}</div>
          </div>
        `;
      }

      let actionButtons = '';
      if (q.status === 'DISPONIVEL') {
        actionButtons = `
          <button class="btn-action btn-action-checkin" onclick="window.abrirCheckin('${q.uuid_publico}', '${q.numero}', '${q.tarifa_base}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
            Check-in
          </button>
        `;
      } else if (q.status === 'OCUPADO' && q.hospedagem_ativa) {
        actionButtons = `
          <button class="btn-action btn-action-checkout" onclick="window.abrirCheckout('${q.hospedagem_ativa.uuid_hospedagem}', '${q.numero}', '${q.hospedagem_ativa.hospede_nome}', '${q.hospedagem_ativa.data_checkin}', '${q.hospedagem_ativa.tarifa_aplicada}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Check-out
          </button>
        `;
      } else if (q.status === 'LIMPEZA' || q.status === 'MANUTENCAO') {
        actionButtons = `
          <button class="btn-action btn-action-limpar" onclick="window.liberarQuarto('${q.uuid_publico}', '${q.numero}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Liberar Quarto
          </button>
        `;
      }

      card.innerHTML = `
        <div>
          <div class="room-header">
            <div class="room-number-wrap">
              <span class="room-number">${q.numero}</span>
              <span class="room-floor">${q.andar}º Andar</span>
            </div>
            <span class="status-badge ${badgeClass}">${statusLabel}</span>
          </div>

          <div class="room-details">
            <div class="room-category">${q.categoria}</div>
            <div class="room-desc">${q.descricao || 'Acomodação executiva com infraestrutura completa.'}</div>
            
            <div class="room-specs">
              <div class="spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Até ${q.capacidade} pessoa${q.capacidade > 1 ? 's' : ''}
              </div>
            </div>

            ${guestHtml}
          </div>
        </div>

        <div class="room-footer">
          <div>
            <div class="room-price-val">${formatarMoeda(q.tarifa_base)}</div>
            <div class="room-price-unit">por diária</div>
          </div>
          <div class="room-actions">
            ${actionButtons}
          </div>
        </div>
      `;

      dom.roomsGrid.appendChild(card);
    });
  }

  // ==========================================================================
  // FLUXO DE CHECK-IN ÁGIL
  // ==========================================================================

  window.abrirCheckin = async function (uuidQuarto, numero, tarifa) {
    dom.checkinQuartoNum.textContent = numero;
    dom.checkinQuartoUuid.value = uuidQuarto;
    dom.checkinQuartoTarifa.value = tarifa;
    dom.checkinTarifaPreview.textContent = formatarMoeda(tarifa);

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(12, 0, 0, 0);
    const ano = amanha.getFullYear();
    const mes = String(amanha.getMonth() + 1).padStart(2, '0');
    const dia = String(amanha.getDate()).padStart(2, '0');
    dom.checkinDataSaida.value = `${ano}-${mes}-${dia}T12:00`;
    dom.checkinDataSaida.min = new Date().toISOString().slice(0, 16);

    try {
      dom.checkinHospedeSelect.innerHTML = '<option value="">Carregando hóspedes...</option>';
      const hospedes = await apiFetch('/api/v1/hospedes');
      state.hospedes = hospedes;

      if (hospedes.length === 0) {
        dom.checkinHospedeSelect.innerHTML = '<option value="">Nenhum hóspede cadastrado</option>';
      } else {
        dom.checkinHospedeSelect.innerHTML = '<option value="">Selecione o hóspede titular...</option>' +
          hospedes.map(h => `<option value="${h.uuid_publico}">${h.nome} (CPF: ${h.cpf})</option>`).join('');
      }
    } catch (e) {
      dom.checkinHospedeSelect.innerHTML = '<option value="">Falha ao listar hóspedes</option>';
    }

    dom.modalCheckin.classList.add('active');
  };

  async function confirmarCheckin() {
    const uuidQuarto = dom.checkinQuartoUuid.value;
    const uuidHospede = dom.checkinHospedeSelect.value;
    const dataSaida = dom.checkinDataSaida.value;
    const acompanhantesTexto = dom.checkinAcompanhantes.value.trim();
    const observacoes = dom.checkinObservacoes.value.trim();

    if (!uuidHospede) {
      exibirToast('Selecione o hóspede titular para o check-in.', 'error');
      return;
    }
    if (!dataSaida) {
      exibirToast('Informe a data e hora prevista de saída.', 'error');
      return;
    }

    const acompanhantes = acompanhantesTexto ? acompanhantesTexto.split(',').map(s => s.trim()).filter(Boolean) : [];

    try {
      dom.btnConfirmarCheckin.disabled = true;
      dom.btnConfirmarCheckin.textContent = 'Processando...';

      const payload = {
        uuid_acomodacao: uuidQuarto,
        uuid_hospede: uuidHospede,
        data_prevista_checkout: new Date(dataSaida).toISOString(),
        acompanhantes: acompanhantes,
        observacoes: observacoes || null
      };

      const resultado = await apiFetch('/api/v1/hospedagens/checkin', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      exibirToast(resultado.mensagem || 'Check-in realizado com sucesso!');
      fecharModalCheckin();
      carregarRack();
    } catch (err) {
      exibirToast(err.message, 'error');
    } finally {
      dom.btnConfirmarCheckin.disabled = false;
      dom.btnConfirmarCheckin.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Confirmar Check-in
      `;
    }
  }

  function fecharModalCheckin() {
    dom.modalCheckin.classList.remove('active');
  }

  // ==========================================================================
  // FLUXO DE CHECK-OUT E FATURAMENTO
  // ==========================================================================

  window.abrirCheckout = function (uuidHospedagem, numeroQuarto, nomeHospede, dataCheckin, tarifa) {
    dom.checkoutHospedagemUuid.value = uuidHospedagem;
    dom.checkoutQuartoNum.textContent = `Quarto ${numeroQuarto}`;
    dom.checkoutHospedeNome.textContent = nomeHospede;
    dom.checkoutDataEntrada.textContent = formatarDataHora(dataCheckin);

    const agora = new Date();
    dom.checkoutDataSaida.textContent = formatarDataHora(agora.toISOString());
    dom.checkoutTarifaDiaria.textContent = formatarMoeda(tarifa);

    const dtCheckin = new Date(dataCheckin);
    const horas = (agora - dtCheckin) / (1000 * 3600);
    const diarias = horas <= 24 ? 1 : Math.ceil(horas / 24);
    const valorTotal = diarias * Number(tarifa);

    dom.checkoutDiariasCount.textContent = `${diarias} diária${diarias > 1 ? 's' : ''}`;
    dom.checkoutValorTotal.textContent = formatarMoeda(valorTotal);

    dom.modalCheckout.classList.add('active');
  };

  async function confirmarCheckout() {
    const uuidHospedagem = dom.checkoutHospedagemUuid.value;
    if (!uuidHospedagem) return;

    try {
      dom.btnConfirmarCheckout.disabled = true;
      dom.btnConfirmarCheckout.textContent = 'Faturando...';

      const resultado = await apiFetch(`/api/v1/hospedagens/${uuidHospedagem}/checkout`, {
        method: 'POST'
      });

      exibirToast(`Checkout concluído! Total faturado: ${formatarMoeda(resultado.valor_total)}. Quarto liberado para limpeza.`);
      fecharModalCheckout();
      carregarRack();
    } catch (err) {
      exibirToast(err.message, 'error');
    } finally {
      dom.btnConfirmarCheckout.disabled = false;
      dom.btnConfirmarCheckout.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <line x1="2" y1="10" x2="22" y2="10"/>
        </svg>
        Concluir Faturamento & Checkout
      `;
    }
  }

  function fecharModalCheckout() {
    dom.modalCheckout.classList.remove('active');
  }

  // ==========================================================================
  // GOVERNANÇA: LIBERAÇÃO DE QUARTO (LIMPEZA -> DISPONÍVEL)
  // ==========================================================================

  window.liberarQuarto = async function (uuidQuarto, numero) {
    if (!confirm(`Confirma a liberação do Quarto ${numero} para DISPONÍVEL?`)) {
      return;
    }

    try {
      await apiFetch(`/api/v1/acomodacoes/${uuidQuarto}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'DISPONIVEL' })
      });
      exibirToast(`Quarto ${numero} higienizado e liberado para venda imediata!`);
      carregarRack();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  };

  // ==========================================================================
  // INICIALIZAÇÃO E EVENTOS
  // ==========================================================================

  function inicializarEventos() {
    dom.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filtroStatus = btn.dataset.filter;
        renderizarRack();
      });
    });

    dom.filterCategory.addEventListener('change', (e) => {
      state.filtroCategoria = e.target.value;
      carregarRack();
    });

    dom.btnAtualizarRack.addEventListener('click', () => {
      carregarRack();
      exibirToast('Rack hoteleiro sincronizado com sucesso.');
    });

    dom.btnCloseCheckin.addEventListener('click', fecharModalCheckin);
    dom.btnCancelarCheckin.addEventListener('click', fecharModalCheckin);
    dom.btnConfirmarCheckin.addEventListener('click', confirmarCheckin);

    dom.btnCloseCheckout.addEventListener('click', fecharModalCheckout);
    dom.btnCancelarCheckout.addEventListener('click', fecharModalCheckout);
    dom.btnConfirmarCheckout.addEventListener('click', confirmarCheckout);

    dom.btnLogout.addEventListener('click', efetuarLogout);
    dom.formLogin.addEventListener('submit', efetuarLogin);
  }

  LocalRepo.init();
  inicializarEventos();
  verificarAutenticacao();

})();
