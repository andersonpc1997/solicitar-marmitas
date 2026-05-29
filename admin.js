/**
 * admin.js — Oilema Sementes
 * Lógica exclusiva da página de administração
 */

/* ── Carrega a página admin ──────────────────────────────────── */
async function carregarPaginaAdmin() {
    if (!verificarAuth(true)) return;
    document.getElementById('listaUsuarios').innerHTML =
        '<p class="empty-state">Carregando usuários...</p>';
    const usuarios = await dbGetUsuarios();
    renderizarUsuarios(usuarios);
}

/* ── Renderiza lista de usuários ─────────────────────────────── */
function renderizarUsuarios(usuarios) {
    const container = document.getElementById('listaUsuarios');
    if (!usuarios || usuarios.length === 0) {
        container.innerHTML = '<p class="empty-state">Nenhum usuário cadastrado.</p>';
        return;
    }
    container.innerHTML = usuarios.map(u => `
        <div class="user-card ${!u.ativo ? 'user-inativo' : ''}">
            <div class="user-card-info">
                <div class="user-card-nome">${u.nome}</div>
                <div class="user-card-meta">
                    <span class="user-login">@${u.login}</span>
                    <span class="badge-role ${u.role === 'admin' ? 'badge-admin' : 'badge-user'}">
                        ${u.role === 'admin' ? '🔑 Admin' : '👤 Usuário'}
                    </span>
                    <span class="badge-status ${u.ativo ? 'badge-ativo' : 'badge-inativo'}">
                        ${u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </div>
            </div>
            <div class="user-card-acoes">
                <button class="btn-acao btn-toggle"
                    onclick="toggleUsuario('${u.id}', ${u.ativo})">
                    ${u.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button class="btn-acao btn-senha"
                    onclick="abrirAlterarSenha('${u.id}', '${u.nome}')">
                    Alterar Senha
                </button>
                <button class="btn-acao btn-deletar"
                    onclick="confirmarDeletar('${u.id}', '${u.nome}')">
                    Excluir
                </button>
            </div>
        </div>
    `).join('');
}

/* ── Toggle ativo/inativo ────────────────────────────────────── */
async function toggleUsuario(id, estaAtivo) {
    const logado = getUsuarioLogado();
    if (logado.id === id && estaAtivo) {
        alert('Você não pode desativar sua própria conta.');
        return;
    }
    await dbAtualizarUsuario(id, { ativo: !estaAtivo });
    await carregarPaginaAdmin();
}

/* ── Alterar senha ───────────────────────────────────────────── */
function abrirAlterarSenha(id, nome) {
    const novaSenha = prompt(`Nova senha para "${nome}":`);
    if (!novaSenha || novaSenha.trim() === '') return;
    if (novaSenha.length < 4) { alert('A senha deve ter pelo menos 4 caracteres.'); return; }
    hashSenha(novaSenha).then(async hash => {
        await dbAtualizarUsuario(id, { senhaHash: hash });
        alert('Senha alterada com sucesso!');
    });
}

/* ── Excluir usuário ─────────────────────────────────────────── */
async function confirmarDeletar(id, nome) {
    const logado = getUsuarioLogado();
    if (logado.id === id) { alert('Você não pode excluir sua própria conta.'); return; }
    if (!confirm(`Excluir o usuário "${nome}" permanentemente?`)) return;
    await dbDeletarUsuario(id);
    await carregarPaginaAdmin();
}

/* ── Mostrar/ocultar formulário de novo usuário ──────────────── */
function toggleFormNovoUsuario() {
    const form = document.getElementById('formNovoUsuario');
    const btn  = document.getElementById('btnNovoUsuario');
    const aberto = form.style.display !== 'none';
    form.style.display  = aberto ? 'none' : 'block';
    btn.textContent     = aberto ? '+ Novo Usuário' : '✕ Cancelar';
    if (!aberto) {
        document.getElementById('novoNome').value  = '';
        document.getElementById('novoLogin').value = '';
        document.getElementById('novaSenha').value = '';
    }
}

/* ── Criar novo usuário ──────────────────────────────────────── */
async function criarNovoUsuario() {
    const nome   = document.getElementById('novoNome').value.trim();
    const login  = document.getElementById('novoLogin').value.trim().toLowerCase();
    const senha  = document.getElementById('novaSenha').value;
    const role   = document.getElementById('novoRole').value;
    const btnSalvar = document.getElementById('btnSalvarUsuario');

    if (!nome || !login || !senha) { alert('Preencha todos os campos.'); return; }
    if (senha.length < 4) { alert('A senha deve ter pelo menos 4 caracteres.'); return; }

    // Verifica login duplicado
    const usuarios = await dbGetUsuarios();
    if (usuarios.some(u => u.login.toLowerCase() === login)) {
        alert(`O login "${login}" já está em uso.`); return;
    }

    btnSalvar.disabled     = true;
    btnSalvar.textContent  = 'Salvando...';
    try {
        const senhaHash = await hashSenha(senha);
        await dbCriarUsuario({
            nome, login, senhaHash, role,
            ativo: true,
            criadoEm: new Date().toISOString()
        });
        toggleFormNovoUsuario();
        await carregarPaginaAdmin();
    } finally {
        btnSalvar.disabled    = false;
        btnSalvar.textContent = 'Criar Usuário';
    }
}

/* ── Limpar histórico (admin) ────────────────────────────────── */
async function limparHistoricoAdmin() {
    if (!confirm('Apagar TODO o histórico de marmitas? Esta ação é irreversível.')) return;
    await dbDelete();
    alert('Histórico apagado com sucesso.');
}
