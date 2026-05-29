/**
 * ui.js — Oilema Sementes
 * Navegação entre views com verificação de autenticação
 */

let _cancelarListener = null;
const _TODAS_VIEWS = ['login', 'index', 'painel', 'admin'];

/* ── Troca de view ───────────────────────────────────────────── */
function mostrarView(nome) {
    // Cancela listener anterior
    if (_cancelarListener) { _cancelarListener(); _cancelarListener = null; }

    // Verifica autenticação para views protegidas
    if (nome !== 'login') {
        const user = getUsuarioLogado();
        if (!user) { _exibirView('login'); return; }
        if (nome === 'admin' && user.role !== 'admin') {
            alert('Acesso restrito a administradores.');
            _exibirView('index');
            _atualizarBarras();
            return;
        }
    }

    _exibirView(nome);
    _atualizarBarras();

    if (nome === 'painel') _cancelarListener = iniciarPainel();
    if (nome === 'admin')  carregarPaginaAdmin();

    window.scrollTo(0, 0);
}

function _exibirView(nome) {
    _TODAS_VIEWS.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.style.display = (v === nome) ? '' : 'none';
    });
}

/* ── Atualiza barras de usuário em todas as views ────────────── */
function _atualizarBarras() {
    const user = getUsuarioLogado();
    if (!user) return;

    document.querySelectorAll('.barra-usuario-nome').forEach(el => {
        el.textContent = user.nome;
    });
    document.querySelectorAll('.barra-btn-admin').forEach(el => {
        el.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
    });
}

/* ── Injeta logo em todas as imagens ─────────────────────────── */
function injetarLogos() {
    document.querySelectorAll('img.logo-img').forEach(img => {
        img.src = LOGO_OILEMA;
        img.style.height = '70px';
    });
}

/* ── Inicialização ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
    injetarLogos();
    await inicializarSistema();  // cria admin padrão se necessário

    // Se já há sessão ativa, vai direto para index
    const user = getUsuarioLogado();
    mostrarView(user ? 'index' : 'login');
});
