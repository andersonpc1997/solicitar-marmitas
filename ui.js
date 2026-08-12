/**
 * ui.js — Oilema Sementes
 * Navegação entre views — integrada com autenticação
 */

let _cancelarListener = null;
const _TODAS_VIEWS = ['login', 'index', 'painel', 'admin'];

/* ── Mostra a tela de login ──────────────────────────────────── */
function mostrarViewLogin() {
    _TODAS_VIEWS.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.style.display = (v === 'login') ? '' : 'none';
    });
    if (_cancelarListener) { _cancelarListener(); _cancelarListener = null; }
}

/* ── Troca de view ───────────────────────────────────────────── */
function mostrarView(nome) {
    // Bloqueia acesso sem login
    if (nome !== 'login' && !getUsuarioLogado()) {
        mostrarViewLogin();
        return;
    }
    // Bloqueia acesso Admin para não-admins
    if (nome === 'admin' && getUsuarioLogado()?.papel !== 'admin') {
        mostrarView('index');
        return;
    }

    if (_cancelarListener) { _cancelarListener(); _cancelarListener = null; }

    _exibirView(nome);
    _atualizarBottomNav(nome);

    if (nome === 'painel') _cancelarListener = iniciarPainel();
    if (nome === 'admin')  carregarPaginaAdmin();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function _exibirView(nome) {
    _TODAS_VIEWS.forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.style.display = (v === nome) ? '' : 'none';
    });
}

/* ── Atualiza estado ativo no bottom nav ─────────────────────── */
function _atualizarBottomNav(viewAtiva) {
    document.querySelectorAll('.bottom-nav').forEach(nav => {
        nav.querySelectorAll('.bottom-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            const onclick = btn.getAttribute('onclick') || '';
            if (onclick.includes(`'${viewAtiva}'`)) btn.classList.add('active');
        });
    });
}

/* ── Injeta logo em todas as imagens ─────────────────────────── */
function injetarLogos() {
    document.querySelectorAll('img.logo-img').forEach(img => {
        img.src = LOGO_OILEMA;
    });
}

/* ── Inicialização ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    injetarLogos();
    // auth.js cuida de mostrar a view correta após checar o estado de login
});
