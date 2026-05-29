/**
 * ui.js
 * Oilema Sementes — Controle de Marmitas
 *
 * Controle de navegação SPA e injeção do logo.
 */

let _cancelarListener = null;  // referência ao listener Firebase ativo

/**
 * Exibe a view informada e oculta as demais.
 * Ativa/desativa o listener em tempo real do painel.
 * @param {'index'|'painel'} nome
 */
function mostrarView(nome) {
    ['index', 'painel'].forEach(v => {
        const el = document.getElementById('view-' + v);
        if (el) el.style.display = (v === nome) ? '' : 'none';
    });

    if (nome === 'painel') {
        // Inicia listener em tempo real ao entrar no painel
        _cancelarListener = iniciarPainel();
    } else {
        // Cancela listener ao sair do painel (economiza conexões)
        if (_cancelarListener) {
            _cancelarListener();
            _cancelarListener = null;
        }
    }

    window.scrollTo(0, 0);
}

/**
 * Injeta o logo Oilema em todas as tags <img class="logo-img">.
 */
function injetarLogos() {
    document.querySelectorAll('img.logo-img').forEach(img => {
        img.src    = LOGO_OILEMA;
        img.style.height = '70px';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    injetarLogos();
});
