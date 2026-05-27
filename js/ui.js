/**
 * ui.js
 * Oilema Sementes — Controle de Marmitas
 *
 * Controle de navegação SPA (troca entre views)
 * e injeção do logo em todas as páginas.
 */

/**
 * Exibe a view informada e oculta as demais.
 * @param {'index'|'painel'} nome
 */
function mostrarView(nome) {
    ['index', 'painel'].forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.style.display = (v === nome) ? '' : 'none';
    });

    if (nome === 'painel') {
        carregarDados();
    }

    window.scrollTo(0, 0);
}

/**
 * Injeta o logo Oilema em todas as tags <img class="logo-img">.
 * Deve ser chamado após o DOM estar pronto.
 */
function injetarLogos() {
    document.querySelectorAll('img.logo-img').forEach(img => {
        img.src = LOGO_OILEMA;   // LOGO_OILEMA vem de assets/logo.js
        img.style.height = '70px';
    });
}

// Inicialização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    injetarLogos();
});
