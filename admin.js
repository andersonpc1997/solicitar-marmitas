/**
 * admin.js — Oilema Sementes
 * Lógica da página de administração:
 *  - Criar e listar usuários do sistema
 *  - Limpar histórico de marmitas
 */

let _cancelarListenerUsuarios = null;

/* ── Carrega a página admin ──────────────────────────────── */
function carregarPaginaAdmin() {
    if (_cancelarListenerUsuarios) _cancelarListenerUsuarios();
    _cancelarListenerUsuarios = dbEscutarUsuarios(_renderizarTabelaUsuarios);
}

/* ── Renderiza tabela de usuários ─────────────────────────── */
function _renderizarTabelaUsuarios(lista) {
    const tbody = document.getElementById('listaUsuariosAdmin');
    if (!tbody) return;

    // Filtra o próprio Admin da lista de exibição (opcional)
    const exibir = lista.filter(u => u.papel !== 'admin');

    if (exibir.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Nenhum usuário cadastrado ainda.</td></tr>';
        return;
    }

    tbody.innerHTML = exibir.map(u => `
        <tr>
            <td data-label="Usuário"><strong>${u.usuario}</strong></td>
            <td data-label="Nome">${u.nomeExibicao}</td>
            <td data-label="Ações" class="td-acoes">
                <button class="btn-row-del"
                    onclick="deletarUsuarioAdmin('${u.uid}')"
                    title="Excluir usuário">🗑️</button>
            </td>
        </tr>
    `).join('');
}

/* ── Formulário de criação de usuário ─────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formAddUsuario');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usuario      = document.getElementById('adminNovoUsuario').value.trim().toLowerCase();
        const senha        = document.getElementById('adminNovaSenha').value.trim();
        const nomeExibicao = document.getElementById('adminNomeExibicao').value.trim();

        if (!usuario || !senha || !nomeExibicao) return;

        const btn     = form.querySelector('button[type="submit"]');
        const msgErro = document.getElementById('adminMsgErro');
        btn.disabled  = true;
        btn.textContent = 'Criando...';
        if (msgErro) msgErro.style.display = 'none';

        try {
            await criarNovoUsuario(usuario, senha, nomeExibicao);
            form.reset();
        } catch (err) {
            if (msgErro) {
                msgErro.textContent = err.message;
                msgErro.style.display = 'block';
            }
        } finally {
            btn.disabled = false;
            btn.textContent = '➕ Criar Usuário';
        }
    });
});

/* ── Excluir usuário ──────────────────────────────────────── */
async function deletarUsuarioAdmin(uid) {
    if (!confirm('Deseja realmente excluir este usuário? Ele perderá o acesso ao sistema.')) return;
    await dbDeletarUsuario(uid);
}

/* ── Limpar histórico ─────────────────────────────────────── */
async function limparHistoricoAdmin() {
    if (!confirm('Apagar TODO o histórico de marmitas?\nEsta ação é irreversível.')) return;
    await dbDelete();
    alert('✅ Histórico apagado com sucesso.');
}

