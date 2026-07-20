/**
 * ui.js — Navegação entre views
 * Views: index | painel | dashboard | admin
 */

let _cancelarListener = null;
const _VIEWS = ['index','painel','dashboard','admin'];

function mostrarView(nome) {
    if (_cancelarListener) { _cancelarListener(); _cancelarListener = null; }
    _VIEWS.forEach(v => {
        const el = document.getElementById('view-'+v);
        if (el) el.style.display = (v===nome) ? '' : 'none';
    });
    _atualizarBottomNav(nome);
    if (nome === 'painel')    _cancelarListener = iniciarPainel();
    if (nome === 'dashboard') _cancelarListener = iniciarDashboard();
    if (nome === 'admin')     carregarPaginaAdmin();
    window.scrollTo({ top:0, behavior:'smooth' });
}

function _atualizarBottomNav(ativa) {
    document.querySelectorAll('.bottom-nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((btn.getAttribute('onclick')||'').includes("'"+ativa+"'")) btn.classList.add('active');
    });
}

function injetarLogos() {
    document.querySelectorAll('img.logo-img').forEach(img => { img.src = LOGO_OILEMA; });
}

document.addEventListener('DOMContentLoaded', () => {
    injetarLogos();
    const params = new URLSearchParams(location.search);
    if (params.get('admin') === '1') {
        document.querySelectorAll('.btn-nav-admin').forEach(el => el.style.display = '');
        mostrarView('admin');
    } else {
        mostrarView('index');
    }
});
