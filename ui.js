/**
 * ui.js — Oilema Sementes
 * Navegação entre views — sem autenticação
 * Painel Admin acessível via URL: ?admin=1
 */

let _cancelarListener = null;
const _TODAS_VIEWS = ['index', 'painel', 'admin'];

/* ── Troca de view ───────────────────────────────────────────── */
function mostrarView(nome) {
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

    // Acesso admin via URL: ?admin=1
    const params = new URLSearchParams(location.search);
    if (params.get('admin') === '1') {
        // Mostra botões de admin na nav
        document.querySelectorAll('.btn-nav-admin').forEach(el => el.style.display = '');
        mostrarView('admin');
    } else {
        mostrarView('index');
    }
});
