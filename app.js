/* ============================================================
   app.js — Sistema COLIH Médicos Parceiros JW
   Organização:
     1.  Banco de dados (localStorage simulando PostgreSQL)
     2.  Dados de demonstração iniciais
     3.  Estado global da sessão
     4.  Utilitários gerais
     5.  Sistema de permissões
     6.  Login e Logout
     7.  Navegação entre páginas e abas do admin
     8.  Dashboard
     9.  Médicos — CRUD (criar, ler, atualizar, deletar)
    10.  Usuários — CRUD
    11.  Área pública — Busca com paginação
    12.  Botão SQL Schema (somente para usuários logados)
    13.  Inicialização
============================================================ */


/* ────────────────────────────────────────────
   1. BANCO DE DADOS
   Usa localStorage para simular PostgreSQL.
   Em produção: substituir get/set por chamadas
   fetch() para uma API REST (Node.js / Python).

   Exemplo de troca:
     get medicos() → fetch('/api/medicos')
     set medicos(v) → fetch('/api/medicos', { method:'POST', body:JSON.stringify(v) })
──────────────────────────────────────────── */
const DB = {
  get usuarios() {
    return JSON.parse(localStorage.getItem('colih_usuarios') || '[]');
  },
  set usuarios(v) {
    localStorage.setItem('colih_usuarios', JSON.stringify(v));
  },

  get medicos() {
    return JSON.parse(localStorage.getItem('colih_medicos') || '[]');
  },
  set medicos(v) {
    localStorage.setItem('colih_medicos', JSON.stringify(v));
  },

  // ── Listas controladas: área, cidade e região ──
  // Garantem padronização nos cadastros de médicos.
  get areas() {
    return JSON.parse(localStorage.getItem('colih_areas') || '[]');
  },
  set areas(v) {
    localStorage.setItem('colih_areas', JSON.stringify(v));
  },

  get cidades() {
    return JSON.parse(localStorage.getItem('colih_cidades') || '[]');
  },
  set cidades(v) {
    localStorage.setItem('colih_cidades', JSON.stringify(v));
  },

  get regioes() {
    return JSON.parse(localStorage.getItem('colih_regioes') || '[]');
  },
  set regioes(v) {
    localStorage.setItem('colih_regioes', JSON.stringify(v));
  },
};


/* ────────────────────────────────────────────
   2. DADOS DE DEMONSTRAÇÃO
   Carregados apenas na primeira visita (localStorage vazio).
   Remove este bloco quando conectar ao banco real.
──────────────────────────────────────────── */
function initDemo() {
  // Usuários demo: admin (supremo), um líder e um sub-líder
  if (DB.usuarios.length === 0) {
    DB.usuarios = [
      { id: 1, nome: 'Administrador',  username: 'admin',      senha: 'admin123', tipo: 'supremo',  criadoPor: 'sistema'    },
      { id: 2, nome: 'João Líder',     username: 'joao.lider', senha: '123456',   tipo: 'lider',    criadoPor: 'admin'      },
      { id: 3, nome: 'Maria Sub',      username: 'maria.sub',  senha: '123456',   tipo: 'sublider', criadoPor: 'joao.lider' },
    ];
  }

  // Médicos demo com dados fictícios
  if (DB.medicos.length === 0) {
    DB.medicos = [
      { id: 1,  nome: 'Dr. Carlos Eduardo Mendes',  area: 'Cardiologia',          subarea: 'Eletrofisiologia',        cidade: 'Chapecó - SC',    regiao: 'Oeste Catarinense', telPessoal: '(49) 99812-3456', telComercial: '(49) 3300-1234', obs: 'Atende sem transfusão. Muito colaborativo.',              criadoPor: 'admin'      },
      { id: 2,  nome: 'Dra. Ana Paula Ramos',        area: 'Cirurgia Geral',       subarea: 'Cirurgia Sem Sangue',     cidade: 'Xanxerê - SC',    regiao: 'Oeste Catarinense', telPessoal: '(49) 99755-9900', telComercial: '(49) 3300-5678', obs: 'Especialista em cirurgia minimamente invasiva.',          criadoPor: 'admin'      },
      { id: 3,  nome: 'Dr. Roberto Souza',           area: 'Ortopedia',            subarea: 'Joelho e Quadril',        cidade: 'Concórdia - SC',  regiao: 'Alto Uruguai',      telPessoal: '(49) 99600-1122', telComercial: '',               obs: '',                                                       criadoPor: 'joao.lider' },
      { id: 4,  nome: 'Dra. Fernanda Lima',          area: 'Neurologia',           subarea: 'Neurologia Clínica',      cidade: 'Chapecó - SC',    regiao: 'Oeste Catarinense', telPessoal: '(49) 99400-2233', telComercial: '(49) 3301-9900', obs: 'Parceira de longa data.',                                criadoPor: 'admin'      },
      { id: 5,  nome: 'Dr. Marcos Vinicius Pinto',   area: 'Pediatria',            subarea: 'Neonatologia',            cidade: 'Joaçaba - SC',    regiao: 'Meio-Oeste',        telPessoal: '(49) 99300-4455', telComercial: '(49) 3302-1100', obs: '',                                                       criadoPor: 'joao.lider' },
      { id: 6,  nome: 'Dra. Juliana Corrêa',         area: 'Ginecologia',          subarea: 'Obstetrícia',             cidade: 'São Miguel do Oeste - SC', regiao: 'Extremo Oeste', telPessoal: '(49) 99200-5566', telComercial: '',          obs: 'Excelente atendimento humanizado.',                      criadoPor: 'maria.sub'  },
      { id: 7,  nome: 'Dr. Paulo Henrique Nunes',    area: 'Hematologia',          subarea: 'Tratamento Sem Sangue',   cidade: 'Florianópolis - SC', regiao: 'Grande Florianópolis', telPessoal: '(48) 99100-6677', telComercial: '(48) 3303-2200', obs: 'Referência em hematologia sem transfusão.',           criadoPor: 'admin'      },
      { id: 8,  nome: 'Dra. Cristina Oliveira',      area: 'Anestesiologia',       subarea: '',                        cidade: 'Chapecó - SC',    regiao: 'Oeste Catarinense', telPessoal: '(49) 99000-7788', telComercial: '(49) 3304-3300', obs: 'Trabalha com técnicas bloodless.',                       criadoPor: 'admin'      },
      { id: 9,  nome: 'Dr. Thiago Almeida Braga',    area: 'Urologia',             subarea: 'Urologia Oncológica',     cidade: 'Blumenau - SC',   regiao: 'Vale do Itajaí',    telPessoal: '(47) 98900-8899', telComercial: '',               obs: '',                                                       criadoPor: 'joao.lider' },
      { id: 10, nome: 'Dra. Letícia Machado',        area: 'Oftalmologia',         subarea: '',                        cidade: 'Joinville - SC',  regiao: 'Norte Catarinense', telPessoal: '(47) 98800-9900', telComercial: '(47) 3305-4400', obs: 'Atende às sextas-feiras.',                               criadoPor: 'maria.sub'  },
      { id: 11, nome: 'Dr. Renato Bittencourt',      area: 'Cardiologia',          subarea: 'Cardiologia Intervencionista', cidade: 'Lages - SC', regiao: 'Serrana',          telPessoal: '(49) 98700-1010', telComercial: '',               obs: '',                                                       criadoPor: 'admin'      },
      { id: 12, nome: 'Dra. Simone Pereira',         area: 'Endocrinologia',       subarea: 'Diabetes e Tireoide',     cidade: 'Chapecó - SC',    regiao: 'Oeste Catarinense', telPessoal: '(49) 98600-1111', telComercial: '(49) 3306-5500', obs: 'Parceira nova, muito atenciosa.',                        criadoPor: 'joao.lider' },
    ];
  }

  // ── Listas de cadastros controlados ──
  // Geradas automaticamente a partir dos médicos demo (evita cadastro manual na demo)
  if (DB.areas.length === 0) {
    const areasUnicas = [...new Set(DB.medicos.map(m => m.area).filter(Boolean))].sort();
    DB.areas = areasUnicas.map((nome, i) => ({ id: i + 1, nome }));
  }
  if (DB.cidades.length === 0) {
    const cidadesUnicas = [...new Set(DB.medicos.map(m => m.cidade).filter(Boolean))].sort();
    DB.cidades = cidadesUnicas.map((nome, i) => ({ id: i + 1, nome }));
  }
  if (DB.regioes.length === 0) {
    const regioesUnicas = [...new Set(DB.medicos.map(m => m.regiao).filter(Boolean))].sort();
    DB.regioes = regioesUnicas.map((nome, i) => ({ id: i + 1, nome }));
  }
}


/* ────────────────────────────────────────────
   3. ESTADO GLOBAL DA SESSÃO
──────────────────────────────────────────── */
let currentUser    = null;   // Usuário atualmente logado (null = não logado)
let confirmCallback = null;  // Função a executar ao confirmar exclusão


/* ────────────────────────────────────────────
   4. UTILITÁRIOS GERAIS
──────────────────────────────────────────── */

/** Gera um ID único baseado em timestamp + random */
function uid() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

/** Retorna as iniciais (até 2 letras) de um nome completo */
function initials(nome) {
  return nome
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Exibe uma notificação toast temporária no canto superior direito
 * @param {string} msg   - Mensagem a exibir
 * @param {string} type  - 'success' | 'error' | 'warn'
 */
function toast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');

  // Define a classe CSS de cor conforme o tipo
  el.className = `toast-custom ${type === 'error' ? 'error' : type === 'warn' ? 'warning' : ''}`;

  // Ícone Bootstrap Icons conforme o tipo
  const icon =
    type === 'success' ? 'check-circle-fill text-success'  :
    type === 'error'   ? 'x-circle-fill text-danger'       :
                         'exclamation-circle-fill text-warning';

  el.innerHTML = `<i class="bi bi-${icon} me-2"></i>${msg}`;
  container.appendChild(el);

  // Remove o toast após 3,5 segundos
  setTimeout(() => el.remove(), 3500);
}

/**
 * Abre o modal de confirmação antes de executar uma ação destrutiva
 * @param {string}   title - Título do modal
 * @param {string}   msg   - Mensagem de aviso
 * @param {Function} cb    - Callback executado ao confirmar
 */
function showConfirm(title, msg, cb) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent   = msg;
  confirmCallback = cb;
  document.getElementById('confirmOverlay').style.display = 'flex';
}

/** Fecha o modal de confirmação sem executar nada */
function closeConfirm() {
  document.getElementById('confirmOverlay').style.display = 'none';
  confirmCallback = null;
}

// Ao clicar em "Confirmar" no modal de exclusão
document.getElementById('confirmOkBtn').onclick = () => {
  if (confirmCallback) confirmCallback();
  closeConfirm();
};


/* ────────────────────────────────────────────
   5. SISTEMA DE PERMISSÕES
   Hierarquia: usuario (1) → sublider (2) → lider (3) → supremo (4)
──────────────────────────────────────────── */

/** Mapa de nível numérico por tipo de usuário */
const NIVEL = { usuario: 1, sublider: 2, lider: 3, supremo: 4 };

/**
 * Verifica se o usuário logado tem permissão para determinada ação
 * @param {string} acao - Nome da ação a verificar
 * @returns {boolean}
 */
function pode(acao) {
  if (!currentUser) return false;
  const n = NIVEL[currentUser.tipo] || 0;
  switch (acao) {
    case 'verUsuarios':      return n >= 2;  // sublider em diante
    case 'cadUsuario':       return n >= 2;
    case 'delUsuario':       return n >= 3;  // lider em diante
    case 'delMedicoAlheio':  return n >= 3;
    case 'editMedicoAlheio': return n >= 3;
    case 'setSupremo':       return n >= 4;  // apenas supremo
    default:                 return false;
  }
}

/**
 * Verifica se o usuário atual pode excluir um usuário específico
 * Regra: só pode excluir quem tem nível MENOR que o seu (e não a si mesmo)
 * @param {Object} alvo - Objeto do usuário a ser excluído
 * @returns {boolean}
 */
function podeDelUsuario(alvo) {
  if (!currentUser) return false;
  if (alvo.username === currentUser.username) return false; // não pode deletar a si mesmo
  return NIVEL[currentUser.tipo] > NIVEL[alvo.tipo];
}


/* ────────────────────────────────────────────
   6. LOGIN E LOGOUT
──────────────────────────────────────────── */

/** Abre o modal de login e limpa os campos */
function openLogin() {
  document.getElementById('loginErro').style.display = 'none';
  document.getElementById('loginUser').value  = '';
  document.getElementById('loginSenha').value = '';
  new bootstrap.Modal(document.getElementById('modalLogin')).show();
}

/** Processa tentativa de login (verifica usuário e senha no DB) */
function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const senha    = document.getElementById('loginSenha').value;

  // Busca o usuário no banco local
  const usuario = DB.usuarios.find(u => u.username === username && u.senha === senha);

  if (!usuario) {
    // Credenciais inválidas — exibe mensagem de erro
    document.getElementById('loginErro').style.display = 'block';
    return;
  }

  // Login bem-sucedido
  currentUser = usuario;
  bootstrap.Modal.getInstance(document.getElementById('modalLogin'))?.hide();
  updateNavbar();
  showAdmin();
  atualizarBotaoSQL(); // Mostra botão SQL agora que está logado
  toast(`Bem-vindo, ${usuario.nome.split(' ')[0]}! 👋`);
}

/** Encerra a sessão do usuário */
function logout() {
  currentUser = null;
  showPublic();
  updateNavbar();
  atualizarBotaoSQL(); // Remove botão SQL da área pública
  toast('Sessão encerrada.', 'warn');
}

/**
 * Atualiza os botões da navbar conforme o estado de login
 * Logado: mostra Sair e Admin | Não logado: mostra Área Restrita
 */
function updateNavbar() {
  document.getElementById('btnNavLogin').style.display   = currentUser ? 'none' : '';
  document.getElementById('btnNavLogout').style.display  = currentUser ? ''     : 'none';
  document.getElementById('btnNavAdmin').style.display   = currentUser ? ''     : 'none';
  document.getElementById('btnNavPublic').style.display  = currentUser ? ''     : 'none';
}


/* ────────────────────────────────────────────
   7. NAVEGAÇÃO ENTRE PÁGINAS E ABAS DO ADMIN
──────────────────────────────────────────── */

/** Exibe a área pública e esconde o painel admin */
function showPublic() {
  document.getElementById('publicArea').classList.add('active');
  document.getElementById('adminPanel').classList.remove('active');
  // Garante que o select de áreas e os resultados iniciais sejam carregados
  populateAreaSelect();
  mostrarDestaques(); // Exibe os destaques iniciais (sem busca ativa)
}

/** Exibe o painel admin (requer login) */
function showAdmin() {
  if (!currentUser) { openLogin(); return; }

  document.getElementById('publicArea').classList.remove('active');
  document.getElementById('adminPanel').classList.add('active');

  // Preenche o nome e nível do usuário na sidebar
  document.getElementById('sidebarUserName').textContent = currentUser.nome;
  document.getElementById('sidebarUserRole').textContent = currentUser.tipo.toUpperCase();

  // Mostra ou esconde as abas de gerenciamento de usuários conforme permissão
  const temPermissao = pode('verUsuarios');
  document.getElementById('tab-usuarios').style.display    = temPermissao ? '' : 'none';
  document.getElementById('tab-cadUsuario').style.display  = temPermissao ? '' : 'none';

  showTab('dashboard'); // Começa sempre no dashboard
}

/**
 * Alterna entre as abas do painel admin
 * @param {string} tab - Nome da aba: 'dashboard' | 'medicos' | 'cadMedico' | 'usuarios' | 'cadUsuario'
 */
function showTab(tab) {
  // Esconde todas as seções de conteúdo
  ['Dashboard', 'Medicos', 'CadMedico', 'Usuarios', 'CadUsuario'].forEach(t => {
    document.getElementById('tab' + t).style.display = 'none';
  });

  // Remove destaque ativo de todos os itens da sidebar
  document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));

  // Mostra a seção correspondente
  const nomePascal = tab.charAt(0).toUpperCase() + tab.slice(1);
  document.getElementById('tab' + nomePascal).style.display = '';

  // Destaca o item correto na sidebar
  const sideEl = document.getElementById('tab-' + tab);
  if (sideEl) sideEl.classList.add('active');

  // Chama a função de renderização de cada aba ao abri-la.
  // cadMedico/cadUsuario SÓ limpam quando acessados pelo menu — nunca quando
  // vêm de editarMedico/editarUsuario (flag _editando protege os dados já preenchidos).
  if (tab === 'dashboard')  renderDashboard();
  if (tab === 'medicos')    renderTabelaMedicos();
  if (tab === 'usuarios')   renderTabelaUsuarios();
  if (tab === 'cadMedico'  && !window._editandoMedico)  limparFormMedico();
  if (tab === 'cadUsuario' && !window._editandoUsuario) limparFormUsuario();
  window._editandoMedico  = false;
  window._editandoUsuario = false;
}


/* ────────────────────────────────────────────
   8. DASHBOARD
   Exibe estatísticas e últimos médicos cadastrados
──────────────────────────────────────────── */
function renderDashboard() {
  const medicos  = DB.medicos;
  const usuarios = DB.usuarios;

  // Conta as áreas únicas de atuação
  const areas = [...new Set(medicos.map(m => m.area).filter(Boolean))];

  // Atualiza os boxes de estatísticas
  document.getElementById('statMedicos').textContent  = medicos.length;
  document.getElementById('statUsuarios').textContent = usuarios.length;
  document.getElementById('statAreas').textContent    = areas.length;

  // Exibe os 10 médicos cadastrados mais recentemente
  const recentes = [...medicos].reverse().slice(0, 10);
  const el = document.getElementById('dashMedicos');

  if (!recentes.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-person-heart"></i>Nenhum médico cadastrado ainda.</div>`;
    return;
  }

  el.innerHTML = `
    <div class="table-responsive">
      <table class="table table-admin">
        <thead><tr><th>Nome</th><th>Área</th><th>Cidade</th></tr></thead>
        <tbody>
          ${recentes.map(m => `
            <tr>
              <td><strong>${m.nome}</strong></td>
              <td>${m.area}</td>
              <td>${m.cidade}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}


/* ────────────────────────────────────────────
   9. MÉDICOS — CRUD
──────────────────────────────────────────── */

/** Salva um médico novo ou atualiza o existente (se medicoEditId estiver preenchido) */
function salvarMedico() {
  const id          = document.getElementById('medicoEditId').value;
  const nome        = document.getElementById('mNome').value.trim();
  // Lê dos campos hidden que guardam o valor validado do autocomplete
  const area        = document.getElementById('mAreaVal').value;
  const cidade      = document.getElementById('mCidadeVal').value;
  const telPessoal  = document.getElementById('mTelPessoal').value.trim();

  // Validação dos campos obrigatórios
  if (!nome || !area || !cidade || !telPessoal) {
    toast('Preencha os campos obrigatórios (*)', 'error');
    return;
  }

  const medicos = DB.medicos;

  if (id) {
    // ── EDIÇÃO ──
    const idx = medicos.findIndex(m => m.id == id);
    if (idx >= 0) {
      // Verifica permissão: dono do registro OU nível líder+
      if (medicos[idx].criadoPor !== currentUser.username && !pode('editMedicoAlheio')) {
        toast('Sem permissão para editar este médico.', 'error');
        return;
      }
      // Atualiza os campos mantendo os que não foram alterados
      medicos[idx] = {
        ...medicos[idx],
        nome,
        area,
        subarea:       document.getElementById('mSubarea').value.trim(),
        cidade,
        regiao:        document.getElementById('mRegiaoVal').value,
        telPessoal,
        telComercial:  document.getElementById('mTelComercial').value.trim(),
        obs:           document.getElementById('mObs').value.trim(),
      };
      toast('Médico atualizado com sucesso!');
    }
  } else {
    // ── NOVO CADASTRO ──
    medicos.push({
      id:            uid(),
      nome,
      area,
      subarea:       document.getElementById('mSubarea').value.trim(),
      cidade,
      regiao:        document.getElementById('mRegiaoVal').value,
      telPessoal,
      telComercial:  document.getElementById('mTelComercial').value.trim(),
      obs:           document.getElementById('mObs').value.trim(),
      criadoPor:     currentUser.username,
    });
    toast('Médico cadastrado com sucesso!');
  }

  DB.medicos = medicos;
  atualizarTodosSelects(); // Atualiza selects e datalists com novos dados
  showTab('medicos');
}

/** Preenche o formulário com os dados do médico para edição */
function editarMedico(id) {
  const m = DB.medicos.find(x => x.id == id);
  if (!m) return;

  // Verifica permissão de edição
  if (m.criadoPor !== currentUser.username && !pode('editMedicoAlheio')) {
    toast('Você só pode editar médicos que você mesmo cadastrou.', 'error');
    return;
  }

  // Garante que os selects tenham as opções antes de tentar selecionar um valor
  atualizarTodosSelects();

  // Preenche os campos do formulário
  document.getElementById('medicoEditId').value    = m.id;
  document.getElementById('mNome').value           = m.nome;
  document.getElementById('mSubarea').value        = m.subarea       || '';
  document.getElementById('mTelPessoal').value     = m.telPessoal;
  document.getElementById('mTelComercial').value   = m.telComercial  || '';
  document.getElementById('mObs').value            = m.obs           || '';

  // Selects → agora são autocomplete customizados
  acSetValor('mArea',   m.area   || '');
  acSetValor('mCidade', m.cidade || '');
  acSetValor('mRegiao', m.regiao || '');

  document.getElementById('titleCadMedico').textContent = 'Editar Médico';
  // Seta flag para que showTab não apague os dados que acabamos de preencher
  window._editandoMedico = true;
  showTab('cadMedico');
}

/** Abre o modal de confirmação e exclui o médico após confirmação */
function excluirMedico(id) {
  const m = DB.medicos.find(x => x.id == id);
  if (!m) return;

  // Verifica permissão de exclusão
  if (m.criadoPor !== currentUser.username && !pode('delMedicoAlheio')) {
    toast('Você não tem permissão para excluir este médico.', 'error');
    return;
  }

  showConfirm(
    'Excluir médico?',
    `Deseja excluir "${m.nome}"? Esta ação não pode ser desfeita.`,
    () => {
      DB.medicos = DB.medicos.filter(x => x.id != id);
      renderTabelaMedicos();
      toast('Médico excluído.', 'warn');
    }
  );
}

/** Limpa todos os campos do formulário de médico */
function limparFormMedico() {
  ['medicoEditId','mNome','mSubarea','mTelPessoal','mTelComercial','mObs']
    .forEach(id => document.getElementById(id).value = '');
  // Reseta os autocompletes customizados
  acSetValor('mArea',   '');
  acSetValor('mCidade', '');
  acSetValor('mRegiao', '');
  document.getElementById('titleCadMedico').textContent = 'Cadastrar Médico';
  atualizarTodosSelects();
}

/* ────────────────────────────────────────────
   AUTOCOMPLETE — Sugestões para Área, Cidade e Região
   Evita duplicatas com nomes diferentes (ex: "Chapecó" vs "Chapecó - SC").
   Sugere valores já cadastrados conforme o usuário digita.
──────────────────────────────────────────── */

/**
 * Atualiza os <datalist> com os valores únicos já cadastrados no banco.
 * Chamado ao abrir o formulário e após cada salvamento.
 */
function atualizarSugestoesAutocomplete() {
  const medicos = DB.medicos;

  // Coleta valores únicos de cada campo (ignora vazios, ordena alfabeticamente)
  const areas   = [...new Set(medicos.map(m => m.area).filter(Boolean))].sort();
  const subareas= [...new Set(medicos.map(m => m.subarea).filter(Boolean))].sort();
  const cidades = [...new Set(medicos.map(m => m.cidade).filter(Boolean))].sort();
  const regioes = [...new Set(medicos.map(m => m.regiao).filter(Boolean))].sort();

  // Preenche cada datalist com as opções
  preencherDatalist('dlArea',    areas);
  preencherDatalist('dlSubarea', subareas);
  preencherDatalist('dlCidade',  cidades);
  preencherDatalist('dlRegiao',  regioes);
}

/**
 * Preenche um elemento <datalist> com um array de opções
 * @param {string} id      - ID do datalist
 * @param {Array}  opcoes  - Lista de strings para sugerir
 */
function preencherDatalist(id, opcoes) {
  const dl = document.getElementById(id);
  if (!dl) return;
  dl.innerHTML = opcoes.map(o => `<option value="${o}">`).join('');
}

/** Cancela edição e volta para a listagem */
function cancelarEdicaoMedico() {
  limparFormMedico();
  showTab('medicos');
}

/** Renderiza a tabela de médicos no admin */
function renderTabelaMedicos() {
  const medicos = DB.medicos;
  const tb = document.getElementById('tabelaMedicos');

  if (!medicos.length) {
    tb.innerHTML = `<tr><td colspan="8">
      <div class="empty-state"><i class="bi bi-person-heart"></i>Nenhum médico cadastrado.</div>
    </td></tr>`;
    return;
  }

  tb.innerHTML = medicos.map(m => {
    const podeEdit = m.criadoPor === currentUser.username || pode('editMedicoAlheio');
    const podeDel  = m.criadoPor === currentUser.username || pode('delMedicoAlheio');

    return `<tr>
      <td><strong>${m.nome}</strong></td>
      <td>
        ${m.area}
        ${m.subarea ? `<br><small class="text-muted">${m.subarea}</small>` : ''}
      </td>
      <td>${m.cidade}</td>
      <td>${m.regiao || '—'}</td>
      <td>${m.telPessoal}</td>
      <td>${m.telComercial || '—'}</td>
      <td><small class="text-muted">${m.criadoPor}</small></td>
      <td>
        ${podeEdit ? `<button class="btn-edit-soft me-1" onclick="editarMedico(${m.id})"><i class="bi bi-pencil"></i></button>` : ''}
        ${podeDel  ? `<button class="btn-danger-soft"    onclick="excluirMedico(${m.id})"><i class="bi bi-trash"></i></button>`  : ''}
      </td>
    </tr>`;
  }).join('');
}


/* ────────────────────────────────────────────
   10. USUÁRIOS — CRUD
──────────────────────────────────────────── */

/** Salva um usuário novo ou atualiza o existente */
function salvarUsuario() {
  if (!pode('cadUsuario')) { toast('Sem permissão.', 'error'); return; }

  const id       = document.getElementById('usuarioEditId').value;
  const nome     = document.getElementById('uNome').value.trim();
  const username = document.getElementById('uUser').value.trim();
  const senha    = document.getElementById('uSenha').value;
  const tipo     = document.getElementById('uTipo').value;

  // Validação básica
  if (!nome || !username) {
    toast('Nome e usuário são obrigatórios.', 'error');
    return;
  }

  // Impede criar usuário com nível igual ou superior ao seu (exceto supremo)
  if (NIVEL[tipo] >= NIVEL[currentUser.tipo] && currentUser.tipo !== 'supremo') {
    toast('Você não pode criar usuário com nível igual ou superior ao seu.', 'error');
    return;
  }

  const usuarios = DB.usuarios;

  if (id) {
    // ── EDIÇÃO ──
    const idx = usuarios.findIndex(u => u.id == id);
    if (idx >= 0) {
      // Atualiza, mantendo a senha antiga se nenhuma nova foi informada
      usuarios[idx] = { ...usuarios[idx], nome, username, tipo, ...(senha ? { senha } : {}) };
      toast('Usuário atualizado!');
    }
  } else {
    // ── NOVO CADASTRO ──
    if (!senha) { toast('Informe uma senha.', 'error'); return; }
    if (usuarios.find(u => u.username === username)) {
      toast('Nome de usuário já existe.', 'error');
      return;
    }
    usuarios.push({ id: uid(), nome, username, senha, tipo, criadoPor: currentUser.username });
    toast('Usuário cadastrado!');
  }

  DB.usuarios = usuarios;
  showTab('usuarios');
}

/** Preenche o formulário para edição de um usuário */
function editarUsuario(id) {
  const u = DB.usuarios.find(x => x.id == id);
  if (!u) return;

  document.getElementById('usuarioEditId').value = u.id;
  document.getElementById('uNome').value         = u.nome;
  document.getElementById('uUser').value         = u.username;
  document.getElementById('uSenha').value        = ''; // Senha nunca é pré-preenchida
  document.getElementById('uTipo').value         = u.tipo;

  document.getElementById('titleCadUsuario').textContent = 'Editar Usuário';
  // Seta flag para que showTab não apague os dados que acabamos de preencher
  window._editandoUsuario = true;
  showTab('cadUsuario');
}

/** Abre confirmação e exclui o usuário */
function excluirUsuario(id) {
  const u = DB.usuarios.find(x => x.id == id);
  if (!u) return;

  if (!podeDelUsuario(u)) {
    toast('Sem permissão para excluir este usuário.', 'error');
    return;
  }

  showConfirm(
    'Excluir usuário?',
    `Deseja excluir o usuário "${u.nome}" (${u.username})?`,
    () => {
      DB.usuarios = DB.usuarios.filter(x => x.id != id);
      renderTabelaUsuarios();
      toast('Usuário excluído.', 'warn');
    }
  );
}

/** Limpa o formulário de usuário */
function limparFormUsuario() {
  ['usuarioEditId','uNome','uUser','uSenha'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('uTipo').value = 'usuario';
  document.getElementById('titleCadUsuario').textContent = 'Cadastrar Usuário';
}

function cancelarEdicaoUsuario() { limparFormUsuario(); showTab('usuarios'); }

/** Renderiza a tabela de usuários no admin com paginação de 20 por página */
let paginaUsuarios = 1;
const USUARIOS_POR_PAG = 20;

function renderTabelaUsuarios(pagina) {
  if (pagina !== undefined) paginaUsuarios = pagina;
  const todos    = DB.usuarios;
  const total    = todos.length;
  const totalPgs = Math.ceil(total / USUARIOS_POR_PAG);
  const inicio   = (paginaUsuarios - 1) * USUARIOS_POR_PAG;
  const slice    = todos.slice(inicio, inicio + USUARIOS_POR_PAG);

  const tb = document.getElementById('tabelaUsuarios');
  const badgeMap = { supremo: 'badge-supremo', lider: 'badge-lider', sublider: 'badge-sublider', usuario: 'badge-usuario' };
  const labelMap = { supremo: 'Supremo', lider: 'Líder', sublider: 'Sub-líder', usuario: 'Usuário' };

  tb.innerHTML = slice.map(u => {
    const isSelf   = u.username === currentUser.username;
    const podaDel  = podeDelUsuario(u);
    const podeEdit = NIVEL[currentUser.tipo] > NIVEL[u.tipo] || isSelf || currentUser.tipo === 'supremo';
    return `<tr>
      <td>
        <code>${u.username}</code>
        ${isSelf ? ` <span class="badge bg-secondary" style="font-size:0.65rem">você</span>` : ''}
      </td>
      <td>${u.nome}</td>
      <td><span class="badge-role ${badgeMap[u.tipo] || ''}">${labelMap[u.tipo] || u.tipo}</span></td>
      <td><small class="text-muted">${u.criadoPor || '—'}</small></td>
      <td>
        ${podeEdit ? `<button class="btn-edit-soft me-1" onclick="editarUsuario(${u.id})"><i class="bi bi-pencil"></i></button>` : ''}
        ${podaDel  ? `<button class="btn-danger-soft"    onclick="excluirUsuario(${u.id})"><i class="bi bi-trash"></i></button>`  : ''}
      </td>
    </tr>`;
  }).join('');

  // Paginador de usuários
  const pg = document.getElementById('paginadorUsuarios');
  if (!pg) return;
  if (totalPgs <= 1) { pg.innerHTML = ''; return; }

  let btns = '';
  for (let p = 1; p <= totalPgs; p++) {
    btns += `<button class="page-btn ${p === paginaUsuarios ? 'active' : ''}" onclick="renderTabelaUsuarios(${p})">${p}</button>`;
  }
  pg.innerHTML = `
    <div class="pagination-wrapper mt-3">
      <button class="page-btn" onclick="renderTabelaUsuarios(${paginaUsuarios-1})" ${paginaUsuarios===1?'disabled':''}>
        <i class="bi bi-chevron-left"></i>
      </button>
      ${btns}
      <button class="page-btn" onclick="renderTabelaUsuarios(${paginaUsuarios+1})" ${paginaUsuarios===totalPgs?'disabled':''}>
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
    <p class="pagination-info">Mostrando ${inicio+1}–${Math.min(inicio+USUARIOS_POR_PAG,total)} de ${total} usuários</p>`;
}


/* ────────────────────────────────────────────
   11. ÁREA PÚBLICA — BUSCA COM PAGINAÇÃO

   Lógica de paginação:
   - Sem busca ativa: mostra 3–6 destaques aleatórios
   - Com busca ativa: pagina os resultados em grupos de 12
──────────────────────────────────────────── */

// Variáveis de estado da paginação
let paginaAtual     = 1;
const ITENS_POR_PAG = 12;  // Itens por página durante pesquisa
let resultadosAtuais = [];  // Guarda os resultados filtrados para paginar

/**
 * Executa a busca com os filtros preenchidos.
 * Mostra um flash animado de confirmação ao buscar.
 */
function buscarMedicos() {
  const nome   = (document.getElementById('searchNome')?.value      || '').toLowerCase().trim();
  const area   = (document.getElementById('searchAreaTexto')?.value || '').toLowerCase().trim();
  const cidade = (document.getElementById('searchCidade')?.value    || '').toLowerCase().trim();

  const buscaAtiva = nome || area || cidade;

  let resultados = DB.medicos;
  if (nome)   resultados = resultados.filter(m => m.nome.toLowerCase().includes(nome));
  if (area)   resultados = resultados.filter(m => m.area.toLowerCase().includes(area));
  if (cidade) resultados = resultados.filter(m =>
    m.cidade.toLowerCase().includes(cidade) ||
    (m.regiao || '').toLowerCase().includes(cidade)
  );

  if (buscaAtiva) {
    resultadosAtuais = resultados;
    paginaAtual = 1;
    renderPaginado();
    // Flash de confirmação: barra colorida aparece acima dos resultados por 3s
    mostrarFlashBusca(resultados.length);
  } else {
    mostrarDestaques();
  }
}

/**
 * Mostra uma barra flash temporária confirmando que a busca foi realizada.
 * Some sozinha após 3,5 segundos com animação de fade.
 * @param {number} total - Quantidade de resultados encontrados
 */
function mostrarFlashBusca(total) {
  // Remove flash anterior se ainda estiver visível
  const anterior = document.getElementById('flashBusca');
  if (anterior) anterior.remove();

  const flash = document.createElement('div');
  flash.id = 'flashBusca';

  const icone  = total > 0 ? 'bi-check-circle-fill' : 'bi-info-circle-fill';
  const cor    = total > 0 ? 'var(--teal)' : 'var(--gold)';
  const msg    = total > 0
    ? `<strong>${total}</strong> médico${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`
    : 'Nenhum médico encontrado para essa busca';

  flash.innerHTML = `<i class="bi ${icone} me-2"></i>${msg}`;
  flash.style.cssText = `
    background: ${cor}; color: white;
    padding: 0.7rem 1.4rem; border-radius: 10px;
    font-size: 0.9rem; font-weight: 500;
    display: inline-flex; align-items: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    margin-bottom: 1rem;
    animation: flashEntrada 0.3s ease, flashSaida 0.5s ease 3s forwards;
  `;

  // Insere antes dos resultados
  const wrapper = document.getElementById('resultadosBusca');
  wrapper.parentNode.insertBefore(flash, wrapper);

  // Remove do DOM após a animação de saída
  setTimeout(() => flash.remove(), 3600);
}

/**
 * Mostra uma seleção de 3–6 médicos como destaque na página inicial
 * (sem filtros aplicados — convite à exploração)
 */
function mostrarDestaques() {
  const todos = DB.medicos;
  resultadosAtuais = [];   // Zera para não mostrar paginador
  paginaAtual = 1;

  const el = document.getElementById('resultadosBusca');

  if (!todos.length) {
    el.innerHTML = `<div class="empty-state"><i class="bi bi-person-heart"></i><p>Nenhum médico cadastrado ainda.</p></div>`;
    return;
  }

  // Embaralha e pega entre 3 e 6 aleatórios como destaques
  const embaralhados = [...todos].sort(() => Math.random() - 0.5);
  const qtd = Math.min(todos.length, todos.length >= 6 ? 6 : Math.max(3, todos.length));
  const destaques = embaralhados.slice(0, qtd);

  el.innerHTML = `
    <div class="d-flex align-items-center gap-2 mb-3">
      <span class="text-muted small"><i class="bi bi-stars me-1 text-warning"></i>
        Destaques — use a busca acima para encontrar o médico ideal
      </span>
    </div>
    <div class="row g-3">
      ${destaques.map(m => gerarCardMedico(m)).join('')}
    </div>`;
  // Garante que o paginador não apareça nos destaques
  document.getElementById('paginadorWrapper').innerHTML = '';
}

/**
 * Renderiza a página atual dos resultados paginados
 * Chamado após cada busca ou troca de página
 */
function renderPaginado() {
  const total      = resultadosAtuais.length;
  const totalPags  = Math.ceil(total / ITENS_POR_PAG);
  const inicio     = (paginaAtual - 1) * ITENS_POR_PAG;
  const fim        = Math.min(inicio + ITENS_POR_PAG, total);
  const pagina     = resultadosAtuais.slice(inicio, fim);

  const el = document.getElementById('resultadosBusca');

  if (!total) {
    el.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-search"></i>
        <p>Nenhum médico encontrado.<br><small>Tente outros termos de busca.</small></p>
      </div>`;
    document.getElementById('paginadorWrapper').innerHTML = '';
    return;
  }

  // Renderiza os cards da página atual
  el.innerHTML = `
    <p class="text-muted mb-3 small">
      <i class="bi bi-funnel me-1"></i>
      ${total} médico(s) encontrado(s) &nbsp;·&nbsp;
      Página ${paginaAtual} de ${totalPags}
    </p>
    <div class="row g-3">
      ${pagina.map(m => gerarCardMedico(m)).join('')}
    </div>`;

  // Gera o paginador abaixo dos resultados
  renderPaginador(totalPags);
}

/**
 * Gera o HTML de um card de médico para a área pública.
 * Obs: telefone pessoal NUNCA é exibido aqui — apenas o comercial.
 * @param {Object} m - Objeto do médico
 * @returns {string} HTML do card
 */
function gerarCardMedico(m) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="medico-card">
        <div class="d-flex gap-3 align-items-start mb-2">
          <div class="medico-avatar">${initials(m.nome)}</div>
          <div>
            <p class="medico-nome">${m.nome}</p>
            <div class="medico-area">${m.area}</div>
          </div>
        </div>
        <div class="mb-2">
          ${m.subarea  ? `<span class="medico-tag"><i class="bi bi-tag me-1"></i>${m.subarea}</span>`  : ''}
          <span class="medico-tag"><i class="bi bi-geo-alt me-1"></i>${m.cidade}</span>
          ${m.regiao   ? `<span class="medico-tag"><i class="bi bi-map me-1"></i>${m.regiao}</span>`   : ''}
        </div>
        ${m.telComercial ? `<div class="medico-phone"><i class="bi bi-telephone-fill me-1"></i>${m.telComercial}</div>` : ''}
        ${m.obs          ? `<div class="text-muted small mt-1" style="font-style:italic">${m.obs}</div>` : ''}
      </div>
    </div>`;
}

/**
 * Renderiza os controles do paginador (← 1 2 3 ... →)
 * @param {number} totalPags - Total de páginas disponíveis
 */
function renderPaginador(totalPags) {
  const wrapper = document.getElementById('paginadorWrapper');

  // Sem necessidade de paginar com apenas 1 página
  if (totalPags <= 1) { wrapper.innerHTML = ''; return; }

  // ── Algoritmo de páginas visíveis ──
  // Mostra sempre: primeira, última, atual, e vizinhas (±1)
  const visíveis = new Set();
  visíveis.add(1);
  visíveis.add(totalPags);
  for (let i = Math.max(1, paginaAtual - 1); i <= Math.min(totalPags, paginaAtual + 1); i++) {
    visíveis.add(i);
  }
  const pagsList = [...visíveis].sort((a, b) => a - b);

  // Monta os botões com "..." entre lacunas
  let botoesHTML = '';
  let ultimo = 0;
  for (const p of pagsList) {
    if (p - ultimo > 1) {
      // Gap entre páginas — insere reticências não clicáveis
      botoesHTML += `<button class="page-btn" disabled>…</button>`;
    }
    botoesHTML += `
      <button class="page-btn ${p === paginaAtual ? 'active' : ''}"
              onclick="irParaPagina(${p})"
              ${p === paginaAtual ? 'aria-current="page"' : ''}>
        ${p}
      </button>`;
    ultimo = p;
  }

  // Monta o paginador completo com anterior / próximo
  wrapper.innerHTML = `
    <div class="pagination-wrapper">
      <button class="page-btn" onclick="irParaPagina(${paginaAtual - 1})" ${paginaAtual === 1 ? 'disabled' : ''}>
        <i class="bi bi-chevron-left"></i>
      </button>
      ${botoesHTML}
      <button class="page-btn" onclick="irParaPagina(${paginaAtual + 1})" ${paginaAtual === totalPags ? 'disabled' : ''}>
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
    <p class="pagination-info">
      Mostrando ${(paginaAtual - 1) * ITENS_POR_PAG + 1}–${Math.min(paginaAtual * ITENS_POR_PAG, resultadosAtuais.length)}
      de ${resultadosAtuais.length} resultados
    </p>`;
}

/**
 * Navega para uma página específica e faz scroll suave até os resultados
 * @param {number} p - Número da página destino
 */
function irParaPagina(p) {
  const totalPags = Math.ceil(resultadosAtuais.length / ITENS_POR_PAG);
  if (p < 1 || p > totalPags) return; // Página inválida
  paginaAtual = p;
  renderPaginado();
  // Scroll suave até o início dos resultados
  document.getElementById('resultadosBusca').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Atualiza TODOS os selects e datalists do sistema.
 * Os datalists da busca pública são filtrados dinamicamente via debounce
 * (só sugere ao digitar 2+ caracteres — performance com grandes volumes).
 */
function atualizarTodosSelects() {
  const medicos = DB.medicos;

  // ── Datalist de subárea (texto livre) ──
  const subareas = [...new Set(medicos.map(m => m.subarea).filter(Boolean))].sort();
  preencherDatalist('dlSubarea', subareas);

  // ── Dados para os autocompletes da busca pública ──
  window._autocompleteNomes   = medicos.map(m => m.nome).sort();
  window._autocompleteAreas   = DB.areas.map(a => a.nome).sort();
  window._autocompleteCidades = [
    ...DB.cidades.map(c => c.nome),
    ...DB.regioes.map(r => r.nome),
  ].sort().filter((v, i, arr) => arr.indexOf(v) === i);
}

/**
 * Preenche um <datalist> com sugestões de texto.
 */
function preencherDatalist(id, opcoes) {
  const dl = document.getElementById(id);
  if (!dl) return;
  dl.innerHTML = opcoes.map(o => `<option value="${o}">`).join('');
}

/**
 * Filtra e atualiza um datalist de autocomplete público.
 * Só ativa com 2+ caracteres para performance com muitos dados.
 */
function filtrarAutocomplete(valor, fonte, datalistId) {
  const dl = document.getElementById(datalistId);
  if (!dl) return;
  const termo = valor.toLowerCase().trim();
  if (termo.length < 2) { dl.innerHTML = ''; return; }
  const filtrados = (fonte || [])
    .filter(v => v.toLowerCase().includes(termo))
    .slice(0, 30);
  dl.innerHTML = filtrados.map(v => `<option value="${v}">`).join('');
}

// Compatibilidade com chamadas antigas
function atualizarSugestoesAutocomplete() { atualizarTodosSelects(); }
function populateAreaSelect() { atualizarTodosSelects(); }

/* ────────────────────────────────────────────
   AUTOCOMPLETE CUSTOMIZADO (formulário de médico)
   Campos: Área, Cidade, Região.
   - Dropdown aparece ao digitar 2+ letras OU ao focar no campo
   - Só aceita valores existentes na lista (valida ao sair do campo)
   - Campo hidden guarda o valor confirmado para o salvarMedico()
──────────────────────────────────────────── */

// Mapa: id do campo → chave da lista no DB
const AC_FONTE = { mArea: 'areas', mCidade: 'cidades', mRegiao: 'regioes' };

/**
 * Filtra e exibe o dropdown do autocomplete customizado.
 * @param {string} campoId - ID do input (ex: 'mArea')
 * @param {string} tipo    - 'area' | 'cidade' | 'regiao'
 */
function acFiltrar(campoId, tipo) {
  const input   = document.getElementById(campoId);
  const drop    = document.getElementById('acDrop_' + campoId);
  if (!input || !drop) return;

  const termo   = input.value.toLowerCase().trim();
  const fonte   = DB[AC_FONTE[campoId]] || [];

  // Filtra: sem termo mostra os primeiros 30; com termo filtra por conteúdo
  const filtrados = termo.length < 2
    ? fonte.slice().sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR')).slice(0, 30)
    : fonte.filter(i => i.nome.toLowerCase().includes(termo))
           .sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'))
           .slice(0, 30);

  if (!filtrados.length) { drop.innerHTML = ''; drop.style.display = 'none'; return; }

  drop.innerHTML = filtrados.map(i => `
    <div class="ac-item" onmousedown="acSelecionar('${campoId}', ${JSON.stringify(i.nome)})">
      ${i.nome}
    </div>`).join('');
  drop.style.display = 'block';
}

/**
 * Confirma a seleção de um item do dropdown.
 * Preenche o input visível e o campo hidden com o valor.
 */
function acSelecionar(campoId, valor) {
  document.getElementById(campoId).value        = valor;
  document.getElementById(campoId + 'Val').value = valor;
  document.getElementById('acDrop_' + campoId).style.display = 'none';
  // Remove borda de erro se havia
  document.getElementById(campoId).classList.remove('ac-invalido');
}

/**
 * Valida ao sair do campo (onblur).
 * Se o texto digitado não bater exatamente com um item da lista,
 * apaga o hidden (valor inválido) e marca o campo visualmente.
 */
function acValidar(campoId, tipo) {
  // Pequeno delay para o onmousedown do item ser processado antes do blur
  setTimeout(() => {
    const input  = document.getElementById(campoId);
    const hidden = document.getElementById(campoId + 'Val');
    const drop   = document.getElementById('acDrop_' + campoId);
    if (!input) return;

    const texto  = input.value.trim();
    const fonte  = DB[AC_FONTE[campoId]] || [];
    const existe = fonte.some(i => i.nome.toLowerCase() === texto.toLowerCase());

    if (!texto) {
      // Campo vazio — ok para região (opcional), erro para área/cidade
      hidden.value = '';
      input.classList.remove('ac-invalido');
    } else if (existe) {
      // Encontrado: normaliza para o valor exato da lista
      const item   = fonte.find(i => i.nome.toLowerCase() === texto.toLowerCase());
      input.value  = item.nome;
      hidden.value = item.nome;
      input.classList.remove('ac-invalido');
    } else {
      // Não existe na lista — invalida
      hidden.value = '';
      input.classList.add('ac-invalido');
    }

    if (drop) drop.style.display = 'none';
  }, 150);
}

/**
 * Seta programaticamente um valor nos campos de autocomplete
 * (usado por editarMedico e limparFormMedico)
 */
function acSetValor(campoId, valor) {
  const input  = document.getElementById(campoId);
  const hidden = document.getElementById(campoId + 'Val');
  if (!input || !hidden) return;
  input.value  = valor || '';
  hidden.value = valor || '';
  input.classList.remove('ac-invalido');
}

// Fecha todos os dropdowns ao clicar fora
document.addEventListener('click', e => {
  if (!e.target.closest('.ac-wrapper')) {
    document.querySelectorAll('.ac-dropdown').forEach(d => d.style.display = 'none');
  }
});


/* ────────────────────────────────────────────
   GERENCIAMENTO DE LISTAS (Área / Cidade / Região)
   Modal único reutilizável para os 3 tipos.
──────────────────────────────────────────── */

// Tipo de lista aberta no momento no modal ('area' | 'cidade' | 'regiao')
let tipoListaAtiva = null;

// Configuração de cada tipo de lista
const CONFIG_LISTA = {
  area:   { titulo: 'Gerenciar Áreas de Atuação',    icone: 'bi-hospital',    getDB: () => DB.areas,   setDB: v => DB.areas = v,   campo: 'area'   },
  cidade: { titulo: 'Gerenciar Cidades de Atendimento', icone: 'bi-geo-alt', getDB: () => DB.cidades, setDB: v => DB.cidades = v, campo: 'cidade' },
  regiao: { titulo: 'Gerenciar Regiões de Atendimento', icone: 'bi-map',     getDB: () => DB.regioes, setDB: v => DB.regioes = v, campo: 'regiao' },
};

/**
 * Abre o modal de gerenciamento para o tipo especificado
 * @param {string} tipo - 'area' | 'cidade' | 'regiao'
 */
function abrirModalGerenciar(tipo) {
  tipoListaAtiva = tipo;
  const cfg = CONFIG_LISTA[tipo];

  // Atualiza título do modal
  document.getElementById('modalGerenciarTitulo').innerHTML =
    `<i class="bi ${cfg.icone} me-2"></i>${cfg.titulo}`;

  // Limpa o campo de input e a busca interna
  document.getElementById('inputNovoItem').value  = '';
  document.getElementById('inputBuscaLista').value = '';
  paginaGerenciar = 1;

  // Renderiza a lista
  renderListaGerenciar();

  // Abre o modal Bootstrap
  new bootstrap.Modal(document.getElementById('modalGerenciar')).show();
}

// Página atual do modal de gerenciamento
let paginaGerenciar = 1;
const ITENS_GERENCIAR = 10;

/**
 * Renderiza a lista paginada no modal de gerenciamento.
 * Respeita o filtro de busca interna.
 * @param {number} pagina - Número da página (padrão: atual)
 */
function renderListaGerenciar(pagina) {
  if (pagina !== undefined) paginaGerenciar = pagina;

  const cfg     = CONFIG_LISTA[tipoListaAtiva];
  const todos   = cfg.getDB().slice().sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
  const medicos = DB.medicos;
  const el      = document.getElementById('listaItensGerenciar');
  const pg      = document.getElementById('paginadorGerenciar');

  // Aplica filtro de busca interna se houver texto
  const termoBusca = (document.getElementById('inputBuscaLista')?.value || '').toLowerCase().trim();
  const itens = termoBusca
    ? todos.filter(i => i.nome.toLowerCase().includes(termoBusca))
    : todos;

  if (!itens.length) {
    el.innerHTML = `<div class="empty-state" style="padding:1.5rem;text-align:center">
      <i class="bi bi-inbox" style="font-size:2rem;opacity:0.25;display:block;margin-bottom:0.5rem"></i>
      <small>${termoBusca ? 'Nenhum resultado para "' + termoBusca + '"' : 'Nenhum item cadastrado ainda. Adicione um acima.'}</small>
    </div>`;
    pg.innerHTML = '';
    return;
  }

  // Paginação
  const total    = itens.length;
  const totalPgs = Math.ceil(total / ITENS_GERENCIAR);
  // Garante que a página atual não excede o total
  if (paginaGerenciar > totalPgs) paginaGerenciar = totalPgs;
  const inicio   = (paginaGerenciar - 1) * ITENS_GERENCIAR;
  const slice    = itens.slice(inicio, inicio + ITENS_GERENCIAR);

  const emUso = new Set(medicos.map(m => m[cfg.campo]).filter(Boolean));

  el.innerHTML = slice.map(item => {
    const usado = emUso.has(item.nome);
    return `
      <div class="lista-item ${usado ? 'em-uso' : ''}">
        <span>
          <span class="item-nome">${item.nome}</span>
          ${usado ? `<span class="item-badge"><i class="bi bi-person-heart me-1"></i>em uso</span>` : ''}
        </span>
        ${usado
          ? `<span title="Em uso — não pode excluir" style="color:var(--text-light);font-size:0.8rem"><i class="bi bi-lock-fill"></i></span>`
          : `<button class="btn-danger-soft" onclick="excluirItemLista(${item.id})" title="Excluir"><i class="bi bi-trash"></i></button>`
        }
      </div>`;
  }).join('');

  // Paginador compacto
  if (totalPgs <= 1) { pg.innerHTML = `<p class="pagination-info">${total} item${total!==1?'s':''}</p>`; return; }

  // Gera botões de páginas (mostra no máx 5 ao redor da atual)
  let btns = '';
  const vizinhos = 2;
  for (let p = 1; p <= totalPgs; p++) {
    if (p === 1 || p === totalPgs || Math.abs(p - paginaGerenciar) <= vizinhos) {
      btns += `<button class="page-btn ${p===paginaGerenciar?'active':''}" onclick="renderListaGerenciar(${p})">${p}</button>`;
    } else if (Math.abs(p - paginaGerenciar) === vizinhos + 1) {
      btns += `<button class="page-btn" disabled>…</button>`;
    }
  }

  pg.innerHTML = `
    <div class="pagination-wrapper">
      <button class="page-btn" onclick="renderListaGerenciar(${paginaGerenciar-1})" ${paginaGerenciar===1?'disabled':''}>
        <i class="bi bi-chevron-left"></i>
      </button>
      ${btns}
      <button class="page-btn" onclick="renderListaGerenciar(${paginaGerenciar+1})" ${paginaGerenciar===totalPgs?'disabled':''}>
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
    <p class="pagination-info">
      ${inicio+1}–${Math.min(inicio+ITENS_GERENCIAR,total)} de ${total} itens
    </p>`;
}

/** Reseta para pág 1 ao digitar na busca interna do modal */
function filtrarListaGerenciar() {
  paginaGerenciar = 1;
  renderListaGerenciar();
}

/** Adiciona um novo item à lista ativa */
function adicionarItemLista() {
  const input = document.getElementById('inputNovoItem');
  const nome  = input.value.trim();

  if (!nome) { toast('Digite um nome para adicionar.', 'warn'); return; }

  const cfg   = CONFIG_LISTA[tipoListaAtiva];
  const lista = cfg.getDB();

  // Verifica duplicata (case-insensitive)
  const existe = lista.some(i => i.nome.toLowerCase() === nome.toLowerCase());
  if (existe) { toast(`"${nome}" já está cadastrado.`, 'warn'); return; }

  // Adiciona com novo ID
  const novoId = lista.length ? Math.max(...lista.map(i => i.id)) + 1 : 1;
  lista.push({ id: novoId, nome });
  cfg.setDB(lista);

  input.value = '';
  renderListaGerenciar();
  atualizarTodosSelects(); // Atualiza os selects do formulário imediatamente
  toast(`"${nome}" adicionado!`);
}

/** Exclui um item da lista (apenas se não estiver em uso) */
function excluirItemLista(id) {
  const cfg    = CONFIG_LISTA[tipoListaAtiva];
  const lista  = cfg.getDB();
  const item   = lista.find(i => i.id === id);
  if (!item) return;

  // Dupla checagem de segurança: não excluir se em uso
  const emUso = DB.medicos.some(m => m[cfg.campo] === item.nome);
  if (emUso) { toast('Este item está em uso por um médico.', 'error'); return; }

  showConfirm(
    'Excluir item?',
    `Deseja excluir "${item.nome}" da lista?`,
    () => {
      cfg.setDB(lista.filter(i => i.id !== id));
      renderListaGerenciar();
      atualizarTodosSelects();
      toast(`"${item.nome}" excluído.`, 'warn');
    }
  );
}

/* ────────────────────────────────────────────
   MÁSCARA DE TELEFONE
   Formata automaticamente enquanto o usuário digita:
   (XX) XXXXX-XXXX  ou  (XX) XXXX-XXXX
──────────────────────────────────────────── */
function aplicarMascaraTelefone(input) {
  input.addEventListener('input', function () {
    let v = this.value.replace(/\D/g, '').slice(0, 11); // só dígitos, máx 11
    if (v.length === 0) { this.value = ''; return; }
    // Formata progressivamente
    if (v.length <= 2)  { this.value = `(${v}`; return; }
    if (v.length <= 6)  { this.value = `(${v.slice(0,2)}) ${v.slice(2)}`; return; }
    if (v.length <= 10) { this.value = `(${v.slice(0,2)}) ${v.slice(2,6)}-${v.slice(6)}`; return; }
    // 11 dígitos = celular (9 na frente)
    this.value = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
  });
}

// Inicializa events após DOM pronto
document.addEventListener('DOMContentLoaded', () => {

  // ── Busca pública: Enter nos 3 campos dispara busca ──
  ['searchNome', 'searchCidade', 'searchAreaTexto'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('keydown', e => { if (e.key === 'Enter') buscarMedicos(); });
  });

  // ── Autocomplete com debounce de 300ms e mínimo 2 caracteres ──
  // Garante performance mesmo com milhares de registros
  let debounceTimer = null;

  const bindAutocomplete = (inputId, fonteKey, datalistId) => {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        filtrarAutocomplete(el.value, window[fonteKey] || [], datalistId);
      }, 300);
    });
  };

  bindAutocomplete('searchNome',      '_autocompleteNomes',   'dlSearchNome');
  bindAutocomplete('searchAreaTexto', '_autocompleteAreas',   'dlSearchArea');
  bindAutocomplete('searchCidade',    '_autocompleteCidades', 'dlSearchCidade');

  // ── Máscara de telefone nos campos do formulário de médico ──
  document.querySelectorAll('.telefone-mask').forEach(aplicarMascaraTelefone);
});


/* ────────────────────────────────────────────
   12. BOTÃO SQL SCHEMA
   Visível SOMENTE para usuários logados.
   O schema mostra a estrutura completa do banco
   PostgreSQL para ser usado na implantação real.
──────────────────────────────────────────── */

// Schema SQL completo para implantação em PostgreSQL
const SQL_SCHEMA = `-- ======================================
-- SCHEMA PostgreSQL — Sistema COLIH
-- Versão: 1.0
-- ======================================

-- ENUM: tipos de usuário disponíveis no sistema
CREATE TYPE tipo_usuario AS ENUM ('usuario', 'sublider', 'lider', 'supremo');

-- ── TABELA: usuarios ──────────────────────
CREATE TABLE usuarios (
  id           SERIAL        PRIMARY KEY,
  nome         VARCHAR(150)  NOT NULL,
  username     VARCHAR(80)   NOT NULL UNIQUE,
  senha_hash   TEXT          NOT NULL,        -- usar bcrypt ou argon2 (nunca salvar em texto puro!)
  tipo         tipo_usuario  NOT NULL DEFAULT 'usuario',
  criado_por   VARCHAR(80)   REFERENCES usuarios(username) ON DELETE SET NULL,
  criado_em    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  ativo        BOOLEAN       NOT NULL DEFAULT TRUE
);

-- ── TABELA: medicos ───────────────────────
CREATE TABLE medicos (
  id             SERIAL        PRIMARY KEY,
  nome           VARCHAR(200)  NOT NULL,
  area           VARCHAR(100)  NOT NULL,
  subarea        VARCHAR(100),
  cidade         VARCHAR(100)  NOT NULL,
  regiao         VARCHAR(100),
  tel_pessoal    VARCHAR(30)   NOT NULL,       -- NUNCA exibir na área pública
  tel_comercial  VARCHAR(30),                  -- Exibido publicamente
  observacoes    TEXT,
  criado_por     VARCHAR(80)   REFERENCES usuarios(username) ON DELETE SET NULL,
  criado_em      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  ativo          BOOLEAN       NOT NULL DEFAULT TRUE
);

-- ── ÍNDICES para performance nas buscas públicas
CREATE INDEX idx_medicos_area    ON medicos (LOWER(area));
CREATE INDEX idx_medicos_cidade  ON medicos (LOWER(cidade));
CREATE INDEX idx_medicos_regiao  ON medicos (LOWER(regiao));
CREATE INDEX idx_medicos_fts     ON medicos USING gin(to_tsvector('portuguese', nome));

-- ── VIEW pública: exclui telefone pessoal ─
CREATE VIEW medicos_publico AS
  SELECT id, nome, area, subarea, cidade, regiao,
         tel_comercial, observacoes
  FROM   medicos
  WHERE  ativo = TRUE;

-- ── Trigger: atualiza atualizado_em automaticamente
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_medicos_upd
  BEFORE UPDATE ON medicos
  FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- ── Usuário supremo inicial ────────────────
-- ATENÇÃO: gerar hash bcrypt real antes de usar em produção!
-- Node.js: bcrypt.hash('admin123', 12)
INSERT INTO usuarios (nome, username, senha_hash, tipo)
VALUES ('Administrador', 'admin', '$2b$12$SEU_HASH_BCRYPT_AQUI', 'supremo');`;

/** Cria o botão flutuante "Ver SQL" somente quando há usuário logado */
function atualizarBotaoSQL() {
  // Remove o botão existente (se houver)
  const botaoAntigo = document.getElementById('btnVerSQL');
  if (botaoAntigo) botaoAntigo.remove();

  // Se não há usuário logado, não cria o botão
  if (!currentUser) return;

  // Cria e insere o botão flutuante
  const btn = document.createElement('button');
  btn.id        = 'btnVerSQL';
  btn.innerHTML = '<i class="bi bi-database me-1"></i>Ver SQL';
  btn.className = 'btn btn-sm btn-navy';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9000;opacity:0.85;';

  btn.onclick = () => {
    document.getElementById('sqlCode').textContent = SQL_SCHEMA;
    new bootstrap.Modal(document.getElementById('modalSQL')).show();
  };

  document.body.appendChild(btn);
}


/* ────────────────────────────────────────────
   13. INICIALIZAÇÃO
   Executado quando a página carrega
──────────────────────────────────────────── */
initDemo();               // Carrega dados de demo se banco vazio
atualizarTodosSelects();  // Preenche selects do admin e datalists da busca pública
mostrarDestaques();       // Exibe 3–6 médicos em destaque na página inicial
// O botão SQL NÃO é criado aqui — aparece apenas após login (atualizarBotaoSQL)
