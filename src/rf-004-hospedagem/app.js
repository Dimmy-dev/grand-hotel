/**
 * ============================================================================
 * JAVASCRIPT DO PORTAL CORPORATIVO UNIFICADO (GRAND PLAZA HOTEL)
 * Módulos Integrados:
 * - RF-004: Rack Hoteleiro, Governança, Check-in Atômico & Check-out Contábil
 * - RF-001 & RF-002: Gestão Geral de Hóspedes (Cadastro, Busca Preditiva, Edição & Soft Delete)
 * - RF-003: Gestão de Operadores da Equipe (Perfis RBAC, Status Online & Bcrypt)
 *
 * RESILIÊNCIA E ALTA DISPONIBILIDADE:
 * - Comunicação direta com API RESTful FastAPI (Supabase PostgreSQL / SQLite local)
 * - Motor de Contingência Automática Transparente (HTML5 LocalStorage)
 * - Funciona online na nuvem Vercel ou 100% offline localmente.
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
      nome: 'Dimitri Lopes (Administrador)',
      email: 'dimitri61523796@edu.df.senac.br',
      cargo: 'ADMIN',
      is_ativo: 1
    },
    operadores: [
      {
        uuid_publico: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
        nome: 'Dimitri Lopes',
        email: 'dimitri61523796@edu.df.senac.br',
        cargo: 'ADMIN',
        is_ativo: 1,
        is_online: true
      },
      {
        uuid_publico: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
        nome: 'Maria Oliveira (Recepção)',
        email: 'recepcao@grandplaza.com',
        cargo: 'FUNCIONARIO',
        is_ativo: 1,
        is_online: true
      },
      {
        uuid_publico: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
        nome: 'Carlos Eduardo Santos (Gerente)',
        email: 'gerencia@grandplaza.com',
        cargo: 'GERENTE',
        is_ativo: 1,
        is_online: false
      }
    ],
    hospedes: [
      {
        uuid_publico: 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a',
        nome: 'Dr. Fernando Albuquerque',
        cpf: '52998224725',
        email: 'fernando.albuquerque@advocacia.com.br',
        telefone: '(11) 98765-4321',
        data_nascimento: '1982-05-14',
        observacoes: 'Hóspede frequente, prefere andar alto e travesseiro de plumas.',
        is_ativo: 1
      },
      {
        uuid_publico: 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b',
        nome: 'Dra. Beatriz Mendes Santana',
        cpf: '01234567890',
        email: 'beatriz.mendes@clinica.med.br',
        telefone: '(21) 99876-5432',
        data_nascimento: '1989-11-20',
        observacoes: 'Solicita silêncio absoluto para estudos médicos.',
        is_ativo: 1
      },
      {
        uuid_publico: 'f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c',
        nome: 'Eng. Lucas Silveira Prado',
        cpf: '83247829023',
        email: 'lucas.silveira@techconsultoria.com.br',
        telefone: '(31) 97654-3210',
        data_nascimento: '1993-03-08',
        observacoes: 'Check-in sempre tardio devido a voos corporativos.',
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
        descricao: 'Suíte Familiar Luxo com 2 quartos conjugados e antessala',
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
        descricao: 'Suíte Luxo Executiva com dock station e frigobar premium',
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
      OPERADOR: 'grandplaza_operador_v1',
      OPERADORES: 'grandplaza_operadores_v1'
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
      if (!localStorage.getItem(this.KEYS.OPERADORES)) {
        localStorage.setItem(this.KEYS.OPERADORES, JSON.stringify(SEEDS_INICIAIS.operadores));
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

    obterHospedes(termo = '', statusFiltro = '') {
      this.init();
      let lista = JSON.parse(localStorage.getItem(this.KEYS.HOSPEDES) || '[]');
      if (statusFiltro !== '' && statusFiltro !== null && statusFiltro !== undefined) {
        lista = lista.filter(h => String(h.is_ativo) === String(statusFiltro));
      }
      if (termo) {
        const t = termo.toLowerCase().trim();
        lista = lista.filter(h =>
          (h.nome && h.nome.toLowerCase().includes(t)) ||
          (h.cpf && h.cpf.includes(t)) ||
          (h.email && h.email.toLowerCase().includes(t))
        );
      }
      return lista;
    },

    salvarHospede(novo) {
      this.init();
      const lista = JSON.parse(localStorage.getItem(this.KEYS.HOSPEDES) || '[]');
      novo.uuid_publico = novo.uuid_publico || 'hosp-' + Date.now();
      novo.is_ativo = 1;
      lista.unshift(novo);
      localStorage.setItem(this.KEYS.HOSPEDES, JSON.stringify(lista));
      return novo;
    },

    atualizarHospede(uuid, dados) {
      this.init();
      const lista = JSON.parse(localStorage.getItem(this.KEYS.HOSPEDES) || '[]');
      const idx = lista.findIndex(h => h.uuid_publico === uuid);
      if (idx !== -1) {
        lista[idx] = { ...lista[idx], ...dados };
        localStorage.setItem(this.KEYS.HOSPEDES, JSON.stringify(lista));
        return lista[idx];
      }
      throw new Error('Hóspede não localizado.');
    },

    alternarStatusHospede(uuid, novoStatus) {
      this.init();
      const lista = JSON.parse(localStorage.getItem(this.KEYS.HOSPEDES) || '[]');
      const h = lista.find(item => item.uuid_publico === uuid);
      if (h) {
        h.is_ativo = Number(novoStatus);
        localStorage.setItem(this.KEYS.HOSPEDES, JSON.stringify(lista));
        return h;
      }
      throw new Error('Hóspede não localizado.');
    },

    obterOperadores() {
      this.init();
      return JSON.parse(localStorage.getItem(this.KEYS.OPERADORES) || '[]');
    },

    salvarNovoOperador(novo) {
      this.init();
      const lista = JSON.parse(localStorage.getItem(this.KEYS.OPERADORES) || '[]');
      novo.uuid_publico = novo.uuid_publico || 'op-' + Date.now();
      novo.is_ativo = 1;
      novo.is_online = false;
      lista.unshift(novo);
      localStorage.setItem(this.KEYS.OPERADORES, JSON.stringify(lista));
      return novo;
    },

    alternarStatusOperador(uuid, novoStatus) {
      this.init();
      const lista = JSON.parse(localStorage.getItem(this.KEYS.OPERADORES) || '[]');
      const op = lista.find(item => item.uuid_publico === uuid);
      if (op) {
        op.is_ativo = Number(novoStatus);
        localStorage.setItem(this.KEYS.OPERADORES, JSON.stringify(lista));
        return op;
      }
      throw new Error('Operador não localizado.');
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

      quarto.status = 'OCUPADO';
      quarto.hospedagem_ativa = {
        uuid_hospedagem: uuidHospedagem,
        hospede_nome: hospede.nome,
        acompanhantes: acompanhantes || [],
        data_checkin: agora,
        data_prevista_checkout: data_prevista_checkout,
        tarifa_aplicada: Number(quarto.tarifa_base)
      };

      this.salvarAcomodacoes(acomodacoes);
      return novaHospedagem;
    },

    realizarCheckout(uuid_hospedagem) {
      this.init();
      const acomodacoes = this.obterAcomodacoes();
      const hospedagens = JSON.parse(localStorage.getItem(this.KEYS.HOSPEDAGENS) || '[]');

      const hosp = hospedagens.find(h => h.uuid_publico === uuid_hospedagem && h.status === 'ATIVA');
      if (!hosp) throw new Error('Hospedagem ativa não localizada.');

      const agora = new Date();
      hosp.data_checkout = agora.toISOString();
      hosp.status = 'FINALIZADA';

      const inicio = new Date(hosp.data_checkin);
      const diffMs = Math.max(0, agora.getTime() - inicio.getTime());
      const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const diarias = Math.max(1, diffDias);

      hosp.num_diarias = diarias;
      hosp.valor_total = Number(hosp.tarifa_diaria_aplicada) * diarias;

      localStorage.setItem(this.KEYS.HOSPEDAGENS, JSON.stringify(hospedagens));

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
        acomodacao_categoria: quarto ? quarto.categoria : 'STANDARD',
        data_checkin: hosp.data_checkin,
        data_checkout: hosp.data_checkout,
        num_diarias: diarias,
        tarifa_diaria_aplicada: hosp.tarifa_diaria_aplicada,
        valor_total: hosp.valor_total,
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
    operadores: [],
    activeTab: 'view-rack',
    filtroStatus: 'TODOS',
    filtroCategoria: '',
    filtroHospedesStatus: '1',
    termoBuscaHospedes: '',
    modoOffline: false
  };

  // ELEMENTOS DO DOM
  const dom = {
    // Cabeçalho e Sessão
    dbIndicator: document.getElementById('db-indicator'),
    dbName: document.getElementById('db-name'),
    operatorName: document.getElementById('operator-name'),
    operatorRole: document.getElementById('operator-role'),
    btnLogout: document.getElementById('btn-logout'),

    // Navegação de Abas
    navTabs: document.querySelectorAll('.nav-tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    badgeTotalQuartos: document.getElementById('badge-total-quartos'),
    badgeTotalHospedes: document.getElementById('badge-total-hospedes'),
    badgeTotalOperadores: document.getElementById('badge-total-operadores'),

    // Métricas Operacionais do Rack (RF-004)
    statDisponiveis: document.getElementById('stat-disponiveis'),
    statOcupados: document.getElementById('stat-ocupados'),
    statLimpeza: document.getElementById('stat-limpeza'),
    statManutencao: document.getElementById('stat-manutencao'),
    statTaxa: document.getElementById('stat-taxa'),

    // Filtros e Grid do Rack
    filterBtns: document.querySelectorAll('.filter-btn'),
    filterCategory: document.getElementById('filter-category'),
    btnAtualizarRack: document.getElementById('btn-atualizar-rack'),
    countTodos: document.getElementById('count-todos'),
    countDisp: document.getElementById('count-disp'),
    countOcup: document.getElementById('count-ocup'),
    countLimp: document.getElementById('count-limp'),
    countManut: document.getElementById('count-manut'),
    roomsGrid: document.getElementById('rooms-grid'),

    // Métricas e Elementos de Hóspedes (RF-001/002)
    statTotalHospedes: document.getElementById('stat-total-hospedes'),
    statHospedesAtivos: document.getElementById('stat-hospedes-ativos'),
    statHospedesInativos: document.getElementById('stat-hospedes-inativos'),
    searchHospedes: document.getElementById('search-hospedes'),
    filterHospedesStatus: document.getElementById('filter-hospedes-status'),
    btnAbrirCriarHospede: document.getElementById('btn-abrir-criar-hospede'),
    tableHospedesCount: document.getElementById('table-hospedes-count'),
    tbodyHospedes: document.getElementById('tbody-hospedes'),

    // Métricas e Elementos de Operadores (RF-003)
    statTotalOperadores: document.getElementById('stat-total-operadores'),
    statOperadoresAtivos: document.getElementById('stat-operadores-ativos'),
    statOperadoresOnline: document.getElementById('stat-operadores-online'),
    btnAbrirCriarOperador: document.getElementById('btn-abrir-criar-operador'),
    tableOperadoresCount: document.getElementById('table-operadores-count'),
    tbodyOperadores: document.getElementById('tbody-operadores'),

    // Modais do Rack
    modalCheckin: document.getElementById('modal-checkin'),
    btnCloseCheckin: document.getElementById('btn-close-checkin-modal'),
    btnCancelarCheckin: document.getElementById('btn-cancelar-checkin'),
    btnConfirmarCheckin: document.getElementById('btn-confirmar-checkin'),
    checkinQuartoNum: document.getElementById('checkin-modal-quarto-num'),
    checkinQuartoUuid: document.getElementById('checkin-quarto-uuid'),
    checkinQuartoTarifa: document.getElementById('checkin-quarto-tarifa'),
    checkinModalCapacidadeBadge: document.getElementById('checkin-modal-capacidade-badge'),
    checkinHospedeSelect: document.getElementById('checkin-hospede-select'),
    checkinSegundoHospedeSelect: document.getElementById('checkin-segundo-hospede-select'),
    groupSegundoHospede: document.getElementById('group-segundo-hospede'),
    groupOutrosAcompanhantes: document.getElementById('group-outros-acompanhantes'),
    checkinDataSaida: document.getElementById('checkin-data-saida'),
    checkinAcompanhantes: document.getElementById('checkin-acompanhantes'),
    checkinObservacoes: document.getElementById('checkin-observacoes'),
    checkinTarifaPreview: document.getElementById('checkin-tarifa-preview'),

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

    // Modais de Hóspede
    modalCriarHospede: document.getElementById('modal-criar-hospede'),
    formCriarHospede: document.getElementById('form-criar-hospede'),
    btnCloseCriarHospede: document.getElementById('btn-close-criar-hospede-modal'),
    btnCancelarCriarHospede: document.getElementById('btn-cancelar-criar-hospede'),
    hospedeCriarNome: document.getElementById('hospede-criar-nome'),
    hospedeCriarCpf: document.getElementById('hospede-criar-cpf'),
    hospedeCriarDataNasc: document.getElementById('hospede-criar-data-nasc'),
    hospedeCriarEmail: document.getElementById('hospede-criar-email'),
    hospedeCriarTelefone: document.getElementById('hospede-criar-telefone'),
    hospedeCriarObs: document.getElementById('hospede-criar-obs'),

    modalEditarHospede: document.getElementById('modal-editar-hospede'),
    formEditarHospede: document.getElementById('form-editar-hospede'),
    btnCloseEditarHospede: document.getElementById('btn-close-editar-hospede-modal'),
    btnCancelarEditarHospede: document.getElementById('btn-cancelar-editar-hospede'),
    hospedeEditarUuid: document.getElementById('hospede-editar-uuid'),
    hospedeEditarNome: document.getElementById('hospede-editar-nome'),
    hospedeEditarCpf: document.getElementById('hospede-editar-cpf'),
    hospedeEditarTelefone: document.getElementById('hospede-editar-telefone'),
    hospedeEditarEmail: document.getElementById('hospede-editar-email'),
    hospedeEditarObs: document.getElementById('hospede-editar-obs'),

    // Modal de Operador
    modalCriarOperador: document.getElementById('modal-criar-operador'),
    formCriarOperador: document.getElementById('form-criar-operador'),
    btnCloseCriarOperador: document.getElementById('btn-close-criar-operador-modal'),
    btnCancelarCriarOperador: document.getElementById('btn-cancelar-criar-operador'),
    operadorCriarNome: document.getElementById('operador-criar-nome'),
    operadorCriarEmail: document.getElementById('operador-criar-email'),
    operadorCriarCargo: document.getElementById('operador-criar-cargo'),
    operadorCriarSenha: document.getElementById('operador-criar-senha'),
    operadorCriarConfSenha: document.getElementById('operador-criar-conf-senha'),

    // Modal Login & Toasts
    modalLogin: document.getElementById('modal-login'),
    formLogin: document.getElementById('form-login'),
    loginEmail: document.getElementById('login-email'),
    loginSenha: document.getElementById('login-senha'),
    toastContainer: document.getElementById('toast-container')
  };

  // --------------------------------------------------------------------------
  // UTILITÁRIOS VISUAIS E DE MÁSCARA
  // --------------------------------------------------------------------------
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

  function formatarCpf(cpf) {
    if (!cpf) return '-';
    const limpo = String(cpf).replace(/\D/g, '');
    if (limpo.length !== 11) return cpf;
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
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

  // --------------------------------------------------------------------------
  // MOTOR DE COMUNICAÇÃO HTTP COM CONTINGÊNCIA TRANSPARENTE
  // --------------------------------------------------------------------------
  async function apiFetch(endpoint, options = {}) {
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
      const timeoutId = setTimeout(() => controller.abort(), 3500);
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
      console.warn(`[RESILIÊNCIA] Falha ao contatar API (${endpoint}: ${err.message}). Ativando LocalStorage seguro...`);
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

    // /api/v1/auth/me
    if (endpoint.startsWith('/api/v1/auth/me')) {
      return LocalRepo.obterOperador();
    }

    // /api/v1/auth/login
    if (endpoint.startsWith('/api/v1/auth/login')) {
      const body = JSON.parse(options.body || '{}');
      const op = LocalRepo.obterOperador();
      op.email = body.email || op.email;
      LocalRepo.salvarOperador(op);
      return op;
    }

    // /api/v1/auth/logout
    if (endpoint.startsWith('/api/v1/auth/logout')) {
      return { mensagem: 'Sessão encerrada com sucesso.' };
    }

    // /api/v1/diagnostico/banco
    if (endpoint.startsWith('/api/v1/diagnostico/banco')) {
      return {
        motor: 'HTML5 LocalStorage (Contingência Total)',
        supabase_ativo: false,
        total_quartos: LocalRepo.obterAcomodacoes().length,
        hospedagens_ativas: 0,
        total_hospedes: LocalRepo.obterHospedes().length,
        total_operadores: LocalRepo.obterOperadores().length
      };
    }

    // /api/v1/acomodacoes
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

    // /api/v1/hospedagens/checkin
    if (endpoint.startsWith('/api/v1/hospedagens/checkin') && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      return LocalRepo.realizarCheckin(body);
    }

    // /api/v1/hospedagens/{id}/checkout
    if (endpoint.includes('/checkout') && method === 'POST') {
      const partes = endpoint.split('/');
      const uuidHosp = partes[4];
      return LocalRepo.realizarCheckout(uuidHosp);
    }

    // /api/v1/hospedes
    if (endpoint.startsWith('/api/v1/hospedes')) {
      if (method === 'GET') {
        const urlObj = new URL(endpoint, window.location.origin);
        const termo = urlObj.searchParams.get('termo') || '';
        const statusFiltro = urlObj.searchParams.get('is_ativo');
        return LocalRepo.obterHospedes(termo, statusFiltro);
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        return LocalRepo.salvarHospede(body);
      }
      if (method === 'PUT') {
        const partes = endpoint.split('/');
        const uuid = partes[4];
        const body = JSON.parse(options.body || '{}');
        return LocalRepo.atualizarHospede(uuid, body);
      }
      if (method === 'PATCH' && endpoint.includes('/status')) {
        const partes = endpoint.split('/');
        const uuid = partes[4];
        const body = JSON.parse(options.body || '{}');
        return LocalRepo.alternarStatusHospede(uuid, body.is_ativo);
      }
    }

    // /api/v1/operadores
    if (endpoint.startsWith('/api/v1/operadores')) {
      if (method === 'GET') {
        return LocalRepo.obterOperadores();
      }
      if (method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        return LocalRepo.salvarNovoOperador(body);
      }
      if (method === 'PATCH' && endpoint.includes('/status')) {
        const partes = endpoint.split('/');
        const uuid = partes[4];
        const body = JSON.parse(options.body || '{}');
        return LocalRepo.alternarStatusOperador(uuid, body.is_ativo);
      }
    }

    throw new Error('Operação offline executada com sucesso.');
  }

  // --------------------------------------------------------------------------
  // GERENCIAMENTO DE ABAS DA SINGLE PAGE APPLICATION (SPA)
  // --------------------------------------------------------------------------
  function switchTab(tabId) {
    state.activeTab = tabId;

    // Atualiza botões
    dom.navTabs.forEach(tab => {
      if (tab.dataset.tab === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Atualiza visões
    dom.tabContents.forEach(view => {
      if (view.id === tabId) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    // Dispara carregamentos dedicados
    if (tabId === 'view-rack') {
      carregarRack();
    } else if (tabId === 'view-hospedes') {
      carregarHospedes();
    } else if (tabId === 'view-operadores') {
      carregarOperadores();
    }
  }

  // --------------------------------------------------------------------------
  // AUTENTICAÇÃO E PERFIL DO OPERADOR
  // --------------------------------------------------------------------------
  async function verificarAutenticacao() {
    try {
      const operador = await apiFetch('/api/v1/auth/me');
      state.operador = operador;
      dom.operatorName.textContent = operador.nome;
      dom.operatorRole.textContent = operador.cargo;
      fecharModalLogin();
      carregarDadosIniciais();
    } catch {
      abrirModalLogin();
    }
  }

  function carregarDadosIniciais() {
    carregarRack();
    carregarHospedes();
    carregarOperadores();
    verificarDiagnosticoBanco();
  }

  async function verificarDiagnosticoBanco() {
    try {
      const diag = await apiFetch('/api/v1/diagnostico/banco');
      if (diag.supabase_ativo) {
        dom.dbName.textContent = 'Supabase Cloud (PostgreSQL)';
        dom.dbIndicator.style.backgroundColor = '#22c55e';
        dom.dbIndicator.style.boxShadow = '0 0 8px #22c55e';
      } else {
        dom.dbName.textContent = 'SQLite Local (' + diag.motor + ')';
        dom.dbIndicator.style.backgroundColor = '#eab308';
        dom.dbIndicator.style.boxShadow = '0 0 8px #eab308';
      }

      if (dom.badgeTotalQuartos) dom.badgeTotalQuartos.textContent = diag.total_quartos;
      if (dom.badgeTotalHospedes) dom.badgeTotalHospedes.textContent = diag.total_hospedes;
      if (dom.badgeTotalOperadores) dom.badgeTotalOperadores.textContent = diag.total_operadores;
    } catch {
      ativarModoLocalStorage();
    }
  }

  async function efetuarLogin(e) {
    e.preventDefault();
    const email = dom.loginEmail.value.trim();
    const senha = dom.loginSenha.value;

    try {
      const op = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha })
      });
      state.operador = op;
      dom.operatorName.textContent = op.nome;
      dom.operatorRole.textContent = op.cargo;
      fecharModalLogin();
      exibirToast(`Bem-vindo(a), ${op.nome}! Sessão iniciada.`);
      carregarDadosIniciais();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  async function efetuarLogout() {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // Ignora erro no logout
    }
    state.operador = null;
    abrirModalLogin();
    exibirToast('Sessão encerrada com sucesso.');
  }

  function abrirModalLogin() {
    dom.modalLogin.classList.add('active');
  }

  function fecharModalLogin() {
    dom.modalLogin.classList.remove('active');
  }

  // --------------------------------------------------------------------------
  // MÓDULO 1: RACK HOTELEIRO & HOSPEDAGENS (RF-004)
  // --------------------------------------------------------------------------
  async function carregarRack() {
    try {
      let endpoint = '/api/v1/acomodacoes';
      if (state.filtroCategoria) {
        endpoint += `?categoria=${state.filtroCategoria}`;
      }
      const acomodacoes = await apiFetch(endpoint);
      state.acomodacoes = acomodacoes;
      renderizarRack();
      atualizarContadoresRack();
      if (dom.badgeTotalQuartos) {
        dom.badgeTotalQuartos.textContent = acomodacoes.length;
      }
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  function atualizarContadoresRack() {
    const total = state.acomodacoes.length;
    const disp = state.acomodacoes.filter(q => q.status === 'DISPONIVEL').length;
    const ocup = state.acomodacoes.filter(q => q.status === 'OCUPADO').length;
    const limp = state.acomodacoes.filter(q => q.status === 'LIMPEZA').length;
    const manut = state.acomodacoes.filter(q => q.status === 'MANUTENCAO').length;

    dom.statDisponiveis.textContent = disp;
    dom.statOcupados.textContent = ocup;
    dom.statLimpeza.textContent = limp;
    dom.statManutencao.textContent = manut;

    const taxa = total > 0 ? Math.round((ocup / total) * 100) : 0;
    dom.statTaxa.textContent = `${taxa}%`;

    dom.countTodos.textContent = total;
    dom.countDisp.textContent = disp;
    dom.countOcup.textContent = ocup;
    dom.countLimp.textContent = limp;
    dom.countManut.textContent = manut;
  }

  function renderizarRack() {
    dom.roomsGrid.innerHTML = '';

    let lista = state.acomodacoes;
    if (state.filtroStatus !== 'TODOS') {
      lista = lista.filter(q => q.status === state.filtroStatus);
    }

    if (lista.length === 0) {
      dom.roomsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px; text-align: center; color: var(--text-muted); background: var(--bg-surface); border-radius: var(--radius-lg); border: 1px dashed var(--border-subtle);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; color: var(--text-placeholder);">
            <circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          <div style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">Nenhum quarto localizado neste filtro</div>
          <p style="font-size: 0.85rem; margin-top: 4px;">Alterne o status ou categoria acima para visualizar outras acomodações.</p>
        </div>
      `;
      return;
    }

    lista.forEach(quarto => {
      const card = document.createElement('div');
      card.className = 'room-card';

      let statusClasse = 'badge-disponivel';
      let statusTexto = 'Disponível';
      let acaoBtnHtml = '';

      if (quarto.status === 'DISPONIVEL') {
        statusClasse = 'badge-disponivel';
        statusTexto = 'Disponível';
        acaoBtnHtml = `
          <button class="btn-action btn-action-checkin" onclick="abrirModalCheckin('${quarto.uuid_publico}', '${quarto.numero}', ${quarto.tarifa_base}, ${quarto.capacidade})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
            Fazer Check-in (${quarto.capacidade} vagas)
          </button>
        `;
      } else if (quarto.status === 'OCUPADO') {
        statusClasse = 'badge-ocupado';
        statusTexto = 'Ocupado';
        const hospUuid = quarto.hospedagem_ativa ? quarto.hospedagem_ativa.uuid_hospedagem : '';
        const hospNome = quarto.hospedagem_ativa ? quarto.hospedagem_ativa.hospede_nome : 'Hóspede';
        const dataCheckin = quarto.hospedagem_ativa ? quarto.hospedagem_ativa.data_checkin : '';
        const tarifa = quarto.hospedagem_ativa ? quarto.hospedagem_ativa.tarifa_aplicada : quarto.tarifa_base;

        acaoBtnHtml = `
          <button class="btn-action btn-action-checkout" onclick="abrirModalCheckout('${hospUuid}', '${quarto.numero}', '${hospNome}', '${dataCheckin}', ${tarifa})">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Fazer Check-out
          </button>
        `;
      } else if (quarto.status === 'LIMPEZA') {
        statusClasse = 'badge-limpeza';
        statusTexto = 'Limpeza';
        acaoBtnHtml = `
          <button class="btn-action btn-action-limpar" onclick="liberarQuarto('${quarto.uuid_publico}', '${quarto.numero}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Liberar Quarto
          </button>
        `;
      } else if (quarto.status === 'MANUTENCAO') {
        statusClasse = 'badge-manutencao';
        statusTexto = 'Manutenção';
        acaoBtnHtml = `
          <button class="btn-action btn-action-limpar" onclick="liberarQuarto('${quarto.uuid_publico}', '${quarto.numero}')">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Concluir Manutenção
          </button>
        `;
      }

      let hospedeInfoHtml = '';
      if (quarto.status === 'OCUPADO' && quarto.hospedagem_ativa) {
        const hospNome = quarto.hospedagem_ativa.hospede_nome;
        const acomp = quarto.hospedagem_ativa.acompanhantes || [];
        let acompanhantesTexto = '';
        if (acomp && acomp.length > 0) {
          acompanhantesTexto = `
            <div style="color: #1e3a8a; font-size: 0.77rem; margin-top: 3px; border-top: 1px dashed #bfdbfe; padding-top: 3px;">
              👥 <strong>2º Hóspede / Acomp.:</strong> ${acomp.join(', ')}
            </div>
          `;
        }
        hospedeInfoHtml = `
          <div style="margin-top: 10px; padding: 10px 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); font-size: 0.8rem;">
            <div style="font-weight: 600; color: #1e40af; margin-bottom: 2px;">
              👤 <strong>Titular:</strong> ${hospNome}
            </div>
            ${acompanhantesTexto}
            <div style="color: #475569; font-size: 0.74rem; margin-top: 4px;">
              Entrada: ${formatarDataHora(quarto.hospedagem_ativa.data_checkin)}
            </div>
          </div>
        `;
      }

      card.innerHTML = `
        <div>
          <div class="room-header">
            <div class="room-number-wrap">
              <span class="room-number">${quarto.numero}</span>
              <span class="room-floor">${quarto.andar}º Andar</span>
            </div>
            <span class="status-badge ${statusClasse}">
              ${statusTexto}
            </span>
          </div>

          <div class="room-details">
            <div class="room-category">${quarto.categoria}</div>
            <div class="room-desc">${quarto.descricao || 'Acomodação executiva climatizada com enxoval completo.'}</div>

            <div class="room-specs">
              <span>👥 Capacidade: Até ${quarto.capacidade} hóspede(s)</span>
              <span>🏷️ ${formatarMoeda(quarto.tarifa_base)}/dia</span>
            </div>

            ${hospedeInfoHtml}
          </div>
        </div>

        <div style="margin-top: 16px;">
          ${acaoBtnHtml}
        </div>
      `;

      dom.roomsGrid.appendChild(card);
    });
  }

  // Check-in Modal Logic
  window.abrirModalCheckin = async function (uuidQuarto, numeroQuarto, tarifa, capacidade = 2) {
    dom.checkinQuartoUuid.value = uuidQuarto;
    dom.checkinQuartoNum.textContent = numeroQuarto;
    dom.checkinQuartoTarifa.value = tarifa;
    dom.checkinTarifaPreview.textContent = formatarMoeda(tarifa);

    if (dom.checkinModalCapacidadeBadge) {
      dom.checkinModalCapacidadeBadge.textContent = `Até ${capacidade} hóspede(s)`;
    }

    if (dom.groupSegundoHospede) {
      dom.groupSegundoHospede.style.display = capacidade >= 2 ? 'block' : 'none';
    }

    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    amanha.setHours(12, 0, 0, 0);
    const tzOffset = amanha.getTimezoneOffset() * 60000;
    const localISOTime = new Date(amanha.getTime() - tzOffset).toISOString().slice(0, 16);
    dom.checkinDataSaida.value = localISOTime;

    dom.checkinHospedeSelect.innerHTML = '<option value="">Carregando catálogo de hóspedes...</option>';
    if (dom.checkinSegundoHospedeSelect) {
      dom.checkinSegundoHospedeSelect.innerHTML = '<option value="">Nenhum 2º hóspede (ocupação individual)</option>';
    }
    dom.modalCheckin.classList.add('active');

    try {
      const hospedes = await apiFetch('/api/v1/hospedes?is_ativo=1');
      dom.checkinHospedeSelect.innerHTML = '<option value="">Selecione o 1º hóspede (titular)...</option>';
      if (dom.checkinSegundoHospedeSelect) {
        dom.checkinSegundoHospedeSelect.innerHTML = '<option value="">Nenhum 2º hóspede (ocupação individual)</option>';
      }

      hospedes.forEach(h => {
        const opt1 = document.createElement('option');
        opt1.value = h.uuid || h.uuid_publico;
        opt1.textContent = `${h.nome} (CPF: ${formatarCpf(h.cpf)})`;
        dom.checkinHospedeSelect.appendChild(opt1);

        if (dom.checkinSegundoHospedeSelect && capacidade >= 2) {
          const opt2 = document.createElement('option');
          opt2.value = h.uuid || h.uuid_publico;
          opt2.textContent = `${h.nome} (CPF: ${formatarCpf(h.cpf)})`;
          dom.checkinSegundoHospedeSelect.appendChild(opt2);
        }
      });
    } catch {
      dom.checkinHospedeSelect.innerHTML = '<option value="">Erro ao carregar hóspedes</option>';
    }
  };

  function fecharModalCheckin() {
    dom.modalCheckin.classList.remove('active');
  }

  async function confirmarCheckin() {
    const uuid_acomodacao = dom.checkinQuartoUuid.value;
    const uuid_hospede = dom.checkinHospedeSelect.value;
    const data_prevista_checkout = dom.checkinDataSaida.value;
    const acompanhantesStr = dom.checkinAcompanhantes.value.trim();
    const observacoes = dom.checkinObservacoes.value.trim();

    if (!uuid_hospede) {
      exibirToast('Selecione o 1º hóspede (titular) para o check-in.', 'error');
      return;
    }
    if (!data_prevista_checkout) {
      exibirToast('Informe a data prevista de check-out.', 'error');
      return;
    }

    // Coleta do 2º hóspede e acompanhantes adicionais
    const acompanhantes = [];
    if (dom.checkinSegundoHospedeSelect && dom.checkinSegundoHospedeSelect.value) {
      if (dom.checkinSegundoHospedeSelect.value === uuid_hospede) {
        exibirToast('O 2º hóspede não pode ser a mesma pessoa do titular.', 'error');
        return;
      }
      const opt = dom.checkinSegundoHospedeSelect.options[dom.checkinSegundoHospedeSelect.selectedIndex];
      if (opt && opt.text) {
        acompanhantes.push(opt.text);
      }
    }

    if (acompanhantesStr) {
      const extras = acompanhantesStr.split(',').map(s => s.trim()).filter(Boolean);
      acompanhantes.push(...extras);
    }

    // Validação estrita de lotação máxima do quarto
    const quarto = state.acomodacoes.find(q => q.uuid_publico === uuid_acomodacao);
    const maxCapacidade = quarto ? quarto.capacidade : 2;
    const totalPessoas = 1 + acompanhantes.length;

    if (totalPessoas > maxCapacidade) {
      exibirToast(`A capacidade deste quarto é de até ${maxCapacidade} hóspede(s). Você informou ${totalPessoas}.`, 'error');
      return;
    }

    try {
      await apiFetch('/api/v1/hospedagens/checkin', {
        method: 'POST',
        body: JSON.stringify({
          uuid_acomodacao,
          uuid_hospede,
          data_prevista_checkout,
          acompanhantes,
          observacoes
        })
      });

      const msgHospedes = acompanhantes.length > 0 
        ? `Check-in de 2 pessoas concluído com sucesso!` 
        : `Check-in concluído com sucesso!`;

      exibirToast(`${msgHospedes} Quarto agora está OCUPADO.`);
      fecharModalCheckin();
      carregarRack();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  // Check-out Modal Logic
  window.abrirModalCheckout = function (uuidHospedagem, numeroQuarto, nomeHospede, dataCheckin, tarifa) {
    dom.checkoutHospedagemUuid.value = uuidHospedagem;
    dom.checkoutQuartoNum.textContent = numeroQuarto;
    dom.checkoutHospedeNome.textContent = nomeHospede;
    dom.checkoutDataEntrada.textContent = formatarDataHora(dataCheckin);

    const agora = new Date();
    dom.checkoutDataSaida.textContent = formatarDataHora(agora.toISOString());
    dom.checkoutTarifaDiaria.textContent = formatarMoeda(tarifa);

    const inicio = new Date(dataCheckin || agora);
    const diffMs = Math.max(0, agora.getTime() - inicio.getTime());
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diarias = Math.max(1, diffDias);

    dom.checkoutDiariasCount.textContent = `${diarias} diária(s)`;
    const total = diarias * Number(tarifa);
    dom.checkoutValorTotal.textContent = formatarMoeda(total);

    dom.modalCheckout.classList.add('active');
  };

  function fecharModalCheckout() {
    dom.modalCheckout.classList.remove('active');
  }

  async function confirmarCheckout() {
    const uuidHosp = dom.checkoutHospedagemUuid.value;
    if (!uuidHosp) {
      exibirToast('Identificador de estadia inválido.', 'error');
      return;
    }

    try {
      const comprovante = await apiFetch(`/api/v1/hospedagens/${uuidHosp}/checkout`, {
        method: 'POST'
      });

      exibirToast(`Check-out finalizado! Total apurado: ${formatarMoeda(comprovante.valor_total)}. Quarto enviado para LIMPEZA.`);
      fecharModalCheckout();
      carregarRack();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

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

  // --------------------------------------------------------------------------
  // MÓDULO 2: GESTÃO DE HÓSPEDES (RF-001 & RF-002)
  // --------------------------------------------------------------------------
  async function carregarHospedes() {
    try {
      let endpoint = '/api/v1/hospedes';
      const params = [];
      if (state.filtroHospedesStatus !== '') {
        params.push(`is_ativo=${state.filtroHospedesStatus}`);
      }
      if (state.termoBuscaHospedes) {
        params.push(`termo=${encodeURIComponent(state.termoBuscaHospedes)}`);
      }
      if (params.length > 0) {
        endpoint += '?' + params.join('&');
      }

      const lista = await apiFetch(endpoint);
      state.hospedes = lista;
      renderizarHospedes();
      atualizarContadoresHospedes();
      if (dom.badgeTotalHospedes) {
        dom.badgeTotalHospedes.textContent = lista.length;
      }
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  function atualizarContadoresHospedes() {
    const todos = state.hospedes;
    const ativos = todos.filter(h => h.is_ativo === 1).length;
    const inativos = todos.filter(h => h.is_ativo === 0).length;

    if (dom.statTotalHospedes) dom.statTotalHospedes.textContent = todos.length;
    if (dom.statHospedesAtivos) dom.statHospedesAtivos.textContent = ativos;
    if (dom.statHospedesInativos) dom.statHospedesInativos.textContent = inativos;
    if (dom.tableHospedesCount) dom.tableHospedesCount.textContent = `${todos.length} hóspede(s) listado(s)`;
  }

  function renderizarHospedes() {
    if (!dom.tbodyHospedes) return;
    dom.tbodyHospedes.innerHTML = '';

    if (state.hospedes.length === 0) {
      dom.tbodyHospedes.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px; color: var(--text-muted);">
            Nenhum hóspede localizado para os filtros informados.
          </td>
        </tr>
      `;
      return;
    }

    state.hospedes.forEach(h => {
      const tr = document.createElement('tr');
      const uuid = h.uuid || h.uuid_publico;
      const isAtivo = h.is_ativo === 1;

      tr.innerHTML = `
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${h.nome}</div>
          ${h.observacoes ? `<div style="font-size: 0.75rem; color: var(--text-muted);">${h.observacoes}</div>` : ''}
        </td>
        <td style="font-family: monospace; font-size: 0.85rem;">${formatarCpf(h.cpf)}</td>
        <td>${h.email}</td>
        <td>${h.telefone}</td>
        <td>
          <span class="status-badge ${isAtivo ? 'badge-disponivel' : 'badge-manutencao'}">
            ${isAtivo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 8px;">
            <button class="btn-action-icon" onclick="editarHospede('${uuid}')" title="Alterar dados (RF-002)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            <button class="btn-action-icon ${isAtivo ? 'danger' : ''}" onclick="alternarStatusHospede('${uuid}', ${isAtivo ? 0 : 1})" title="${isAtivo ? 'Desativar hóspede' : 'Reativar hóspede'}">
              ${isAtivo ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        </td>
      `;
      dom.tbodyHospedes.appendChild(tr);
    });
  }

  // Modais de Cadastro e Edição de Hóspede
  function abrirModalCriarHospede() {
    dom.formCriarHospede.reset();
    dom.modalCriarHospede.classList.add('active');
  }

  function fecharModalCriarHospede() {
    dom.modalCriarHospede.classList.remove('active');
  }

  window.editarHospede = function (uuid) {
    const h = state.hospedes.find(item => (item.uuid || item.uuid_publico) === uuid);
    if (!h) {
      exibirToast('Hóspede não localizado para edição.', 'error');
      return;
    }

    dom.hospedeEditarUuid.value = uuid;
    dom.hospedeEditarNome.value = h.nome;
    dom.hospedeEditarCpf.value = formatarCpf(h.cpf);
    dom.hospedeEditarTelefone.value = h.telefone;
    dom.hospedeEditarEmail.value = h.email;
    dom.hospedeEditarObs.value = h.observacoes || '';

    dom.modalEditarHospede.classList.add('active');
  };

  function fecharModalEditarHospede() {
    dom.modalEditarHospede.classList.remove('active');
  }

  window.alternarStatusHospede = async function (uuid, novoStatus) {
    const acaoTexto = novoStatus === 1 ? 'ativar' : 'desativar';
    if (!confirm(`Deseja realmente ${acaoTexto} este hóspede no sistema?`)) {
      return;
    }

    try {
      await apiFetch(`/api/v1/hospedes/${uuid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_ativo: novoStatus })
      });
      exibirToast(`Status do hóspede atualizado com sucesso.`);
      carregarHospedes();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  };

  async function salvarCriarHospede(e) {
    e.preventDefault();
    const nome = dom.hospedeCriarNome.value.trim();
    const cpf = dom.hospedeCriarCpf.value.replace(/\D/g, '');
    const data_nascimento = dom.hospedeCriarDataNasc.value;
    const email = dom.hospedeCriarEmail.value.trim();
    const telefone = dom.hospedeCriarTelefone.value.trim();
    const observacoes = dom.hospedeCriarObs.value.trim();

    try {
      await apiFetch('/api/v1/hospedes', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          cpf,
          data_nascimento,
          email,
          telefone,
          observacoes: observacoes || null
        })
      });

      exibirToast(`Hóspede "${nome}" cadastrado com sucesso (RF-001)!`);
      fecharModalCriarHospede();
      carregarHospedes();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  async function salvarEditarHospede(e) {
    e.preventDefault();
    const uuid = dom.hospedeEditarUuid.value;
    const nome = dom.hospedeEditarNome.value.trim();
    const telefone = dom.hospedeEditarTelefone.value.trim();
    const email = dom.hospedeEditarEmail.value.trim();
    const observacoes = dom.hospedeEditarObs.value.trim();

    try {
      await apiFetch(`/api/v1/hospedes/${uuid}`, {
        method: 'PUT',
        body: JSON.stringify({
          nome,
          telefone,
          email,
          observacoes: observacoes || null
        })
      });

      exibirToast(`Dados do hóspede atualizados com sucesso (RF-002)!`);
      fecharModalEditarHospede();
      carregarHospedes();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // MÓDULO 3: GESTÃO DE OPERADORES & USUÁRIOS (RF-003)
  // --------------------------------------------------------------------------
  async function carregarOperadores() {
    try {
      const lista = await apiFetch('/api/v1/operadores');
      state.operadores = lista;
      renderizarOperadores();
      atualizarContadoresOperadores();
      if (dom.badgeTotalOperadores) {
        dom.badgeTotalOperadores.textContent = lista.length;
      }
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  function atualizarContadoresOperadores() {
    const todos = state.operadores;
    const ativos = todos.filter(op => op.is_ativo === 1).length;
    const online = todos.filter(op => op.is_online).length;

    if (dom.statTotalOperadores) dom.statTotalOperadores.textContent = todos.length;
    if (dom.statOperadoresAtivos) dom.statOperadoresAtivos.textContent = ativos;
    if (dom.statOperadoresOnline) dom.statOperadoresOnline.textContent = online;
    if (dom.tableOperadoresCount) dom.tableOperadoresCount.textContent = `${todos.length} operador(es)`;
  }

  function renderizarOperadores() {
    if (!dom.tbodyOperadores) return;
    dom.tbodyOperadores.innerHTML = '';

    if (state.operadores.length === 0) {
      dom.tbodyOperadores.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px; color: var(--text-muted);">
            Nenhum operador localizado no sistema.
          </td>
        </tr>
      `;
      return;
    }

    state.operadores.forEach(op => {
      const tr = document.createElement('tr');
      const uuid = op.uuid || op.uuid_publico;
      const isAtivo = op.is_ativo === 1;

      let cargoBadgeClass = 'badge-cargo-funcionario';
      if (op.cargo === 'ADMIN') cargoBadgeClass = 'badge-cargo-admin';
      else if (op.cargo === 'GERENTE') cargoBadgeClass = 'badge-cargo-gerente';

      tr.innerHTML = `
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${op.nome}</div>
        </td>
        <td>${op.email}</td>
        <td>
          <span class="status-badge ${cargoBadgeClass}">${op.cargo}</span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${op.is_online ? '#22c55e' : '#cbd5e1'};"></span>
            <span style="font-size: 0.8rem; color: ${op.is_online ? '#166534' : 'var(--text-muted)'};">
              ${op.is_online ? 'Online' : 'Offline'}
            </span>
          </div>
        </td>
        <td>
          <span class="status-badge ${isAtivo ? 'badge-disponivel' : 'badge-manutencao'}">
            ${isAtivo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
        <td style="text-align: right;">
          <button class="btn-action-icon ${isAtivo ? 'danger' : ''}" onclick="alternarStatusOperador('${uuid}', ${isAtivo ? 0 : 1})" title="${isAtivo ? 'Desativar acesso' : 'Reativar operador'}">
            ${isAtivo ? 'Desativar' : 'Ativar'}
          </button>
        </td>
      `;
      dom.tbodyOperadores.appendChild(tr);
    });
  }

  function abrirModalCriarOperador() {
    dom.formCriarOperador.reset();
    dom.modalCriarOperador.classList.add('active');
  }

  function fecharModalCriarOperador() {
    dom.modalCriarOperador.classList.remove('active');
  }

  window.alternarStatusOperador = async function (uuid, novoStatus) {
    const acaoTexto = novoStatus === 1 ? 'ativar' : 'desativar';
    if (!confirm(`Deseja realmente ${acaoTexto} este operador no sistema?`)) {
      return;
    }

    try {
      await apiFetch(`/api/v1/operadores/${uuid}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_ativo: novoStatus })
      });
      exibirToast('Status do operador atualizado com sucesso.');
      carregarOperadores();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  };

  async function salvarCriarOperador(e) {
    e.preventDefault();
    const nome = dom.operadorCriarNome.value.trim();
    const email = dom.operadorCriarEmail.value.trim();
    const cargo = dom.operadorCriarCargo.value;
    const senha = dom.operadorCriarSenha.value;
    const confirmacao_senha = dom.operadorCriarConfSenha.value;

    if (senha !== confirmacao_senha) {
      exibirToast('A senha e a confirmação de senha não coincidem.', 'error');
      return;
    }

    try {
      await apiFetch('/api/v1/operadores', {
        method: 'POST',
        body: JSON.stringify({
          nome,
          email,
          cargo,
          senha,
          confirmacao_senha
        })
      });

      exibirToast(`Operador "${nome}" cadastrado com sucesso (RF-003)!`);
      fecharModalCriarOperador();
      carregarOperadores();
    } catch (err) {
      exibirToast(err.message, 'error');
    }
  }

  // --------------------------------------------------------------------------
  // INICIALIZAÇÃO DE EVENTOS E ESCUTAS DOM
  // --------------------------------------------------------------------------
  function inicializarEventos() {
    // 1. Abas de Navegação
    dom.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetView = tab.dataset.tab;
        switchTab(targetView);
      });
    });

    // 2. Filtros do Rack
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
      verificarDiagnosticoBanco();
      exibirToast('Rack hoteleiro e indicadores sincronizados.');
    });

    // 3. Modais do Rack
    dom.btnCloseCheckin.addEventListener('click', fecharModalCheckin);
    dom.btnCancelarCheckin.addEventListener('click', fecharModalCheckin);
    dom.btnConfirmarCheckin.addEventListener('click', confirmarCheckin);

    dom.btnCloseCheckout.addEventListener('click', fecharModalCheckout);
    dom.btnCancelarCheckout.addEventListener('click', fecharModalCheckout);
    dom.btnConfirmarCheckout.addEventListener('click', confirmarCheckout);

    // 4. Hóspedes (Filtros, Debounce e Modais)
    let searchDebounceTimer = null;
    if (dom.searchHospedes) {
      dom.searchHospedes.addEventListener('input', (e) => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
          state.termoBuscaHospedes = e.target.value;
          carregarHospedes();
        }, 300);
      });
    }

    if (dom.filterHospedesStatus) {
      dom.filterHospedesStatus.addEventListener('change', (e) => {
        state.filtroHospedesStatus = e.target.value;
        carregarHospedes();
      });
    }

    if (dom.btnAbrirCriarHospede) {
      dom.btnAbrirCriarHospede.addEventListener('click', abrirModalCriarHospede);
    }
    if (dom.btnCloseCriarHospede) {
      dom.btnCloseCriarHospede.addEventListener('click', fecharModalCriarHospede);
    }
    if (dom.btnCancelarCriarHospede) {
      dom.btnCancelarCriarHospede.addEventListener('click', fecharModalCriarHospede);
    }
    if (dom.formCriarHospede) {
      dom.formCriarHospede.addEventListener('submit', salvarCriarHospede);
    }

    if (dom.btnCloseEditarHospede) {
      dom.btnCloseEditarHospede.addEventListener('click', fecharModalEditarHospede);
    }
    if (dom.btnCancelarEditarHospede) {
      dom.btnCancelarEditarHospede.addEventListener('click', fecharModalEditarHospede);
    }
    if (dom.formEditarHospede) {
      dom.formEditarHospede.addEventListener('submit', salvarEditarHospede);
    }

    // 5. Operadores (Modais)
    if (dom.btnAbrirCriarOperador) {
      dom.btnAbrirCriarOperador.addEventListener('click', abrirModalCriarOperador);
    }
    if (dom.btnCloseCriarOperador) {
      dom.btnCloseCriarOperador.addEventListener('click', fecharModalCriarOperador);
    }
    if (dom.btnCancelarCriarOperador) {
      dom.btnCancelarCriarOperador.addEventListener('click', fecharModalCriarOperador);
    }
    if (dom.formCriarOperador) {
      dom.formCriarOperador.addEventListener('submit', salvarCriarOperador);
    }

    // 6. Autenticação
    dom.btnLogout.addEventListener('click', efetuarLogout);
    dom.formLogin.addEventListener('submit', efetuarLogin);
  }

  // Inicialização no carregamento
  LocalRepo.init();
  inicializarEventos();
  verificarAutenticacao();

})();
