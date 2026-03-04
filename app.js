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

  // Chama a função de renderização de cada aba ao abri-la
  if (tab === 'dashboard')   renderDashboard();
  if (tab === 'medicos')     renderTabelaMedicos();
  if (tab === 'usuarios')    renderTabelaUsuarios();
  if (tab === 'cadMedico')   limparFormMedico();
  if (tab === 'cadUsuario')  limparFormUsuario();
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

  // Exibe os 5 médicos cadastrados mais recentemente
  const recentes = [...medicos].reverse().slice(0, 5);
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
  const area        = document.getElementById('mArea').value.trim();
  const cidade      = document.getElementById('mCidade').value.trim();
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
        regiao:        document.getElementById('mRegiao').value.trim(),
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
      regiao:        document.getElementById('mRegiao').value.trim(),
      telPessoal,
      telComercial:  document.getElementById('mTelComercial').value.trim(),
      obs:           document.getElementById('mObs').value.trim(),
      criadoPor:     currentUser.username, // registra quem cadastrou
    });
    toast('Médico cadastrado com sucesso!');
  }

  DB.medicos = medicos;
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

  // Preenche os campos do formulário
  document.getElementById('medicoEditId').value    = m.id;
  document.getElementById('mNome').value           = m.nome;
  document.getElementById('mArea').value           = m.area;
  document.getElementById('mSubarea').value        = m.subarea       || '';
  document.getElementById('mCidade').value         = m.cidade;
  document.getElementById('mRegiao').value         = m.regiao        || '';
  document.getElementById('mTelPessoal').value     = m.telPessoal;
  document.getElementById('mTelComercial').value   = m.telComercial  || '';
  document.getElementById('mObs').value            = m.obs           || '';

  document.getElementById('titleCadMedico').textContent = 'Editar Médico';
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
  ['medicoEditId','mNome','mArea','mSubarea','mCidade','mRegiao','mTelPessoal','mTelComercial','mObs']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('titleCadMedico').textContent = 'Cadastrar Médico';
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

/** Renderiza a tabela de usuários no admin */
function renderTabelaUsuarios() {
  const usuarios = DB.usuarios;
  const tb = document.getElementById('tabelaUsuarios');

  // Mapas para exibição visual
  const badgeMap = { supremo: 'badge-supremo', lider: 'badge-lider', sublider: 'badge-sublider', usuario: 'badge-usuario' };
  const labelMap = { supremo: 'Supremo', lider: 'Líder', sublider: 'Sub-líder', usuario: 'Usuário' };

  tb.innerHTML = usuarios.map(u => {
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
 * Chamado pelo botão "Buscar" e também ao pressionar Enter.
 */
function buscarMedicos() {
  const nome   = (document.getElementById('searchNome')?.value   || '').toLowerCase().trim();
  const area   = (document.getElementById('searchArea')?.value   || '').toLowerCase();
  const cidade = (document.getElementById('searchCidade')?.value || '').toLowerCase().trim();

  // Verifica se há algum filtro ativo
  const buscaAtiva = nome || area || cidade;

  let resultados = DB.medicos;

  // Aplica os filtros
  if (nome)   resultados = resultados.filter(m => m.nome.toLowerCase().includes(nome));
  if (area)   resultados = resultados.filter(m => m.area.toLowerCase().includes(area));
  if (cidade) resultados = resultados.filter(m =>
    m.cidade.toLowerCase().includes(cidade) ||
    (m.regiao || '').toLowerCase().includes(cidade)
  );

  if (buscaAtiva) {
    // Busca ativa: mostra paginado
    resultadosAtuais = resultados;
    paginaAtual = 1;
    renderPaginado();
  } else {
    // Sem busca: mostra destaques
    mostrarDestaques();
  }
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

/** Popula o select de áreas com as opções do banco */
function populateAreaSelect() {
  const sel = document.getElementById('searchArea');
  if (!sel) return;
  const areas   = [...new Set(DB.medicos.map(m => m.area).filter(Boolean))].sort();
  const current = sel.value;
  sel.innerHTML =
    '<option value="">Todas as áreas</option>' +
    areas.map(a => `<option value="${a.toLowerCase()}" ${current === a.toLowerCase() ? 'selected' : ''}>${a}</option>`).join('');
}

// Permite buscar pressionando Enter nos campos de busca
document.addEventListener('DOMContentLoaded', () => {
  ['searchNome', 'searchCidade'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') buscarMedicos(); });
  });
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
initDemo();           // Carrega dados de demo se banco vazio
populateAreaSelect(); // Preenche o select de áreas
mostrarDestaques();   // Exibe 3–6 médicos em destaque na página inicial
// O botão SQL NÃO é criado aqui — aparece apenas após login (atualizarBotaoSQL)
