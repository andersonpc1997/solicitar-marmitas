/**
 * device.js — Oilema Sementes
 * Detecção automática de dispositivo e adaptação de layout
 * Detecta: mobile, tablet, desktop
 */

(function () {
    'use strict';

    /* ── Detecção de dispositivo ─────────────────────────────── */
    function detectarDispositivo() {
        const ua = navigator.userAgent || navigator.vendor || window.opera;

        const isMobileUA = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
        const isTabletUA = /ipad|android(?!.*mobile)/i.test(ua);
        const largura    = window.innerWidth;

        if (isTabletUA || (largura >= 600 && largura <= 1024 && isMobileUA)) {
            return 'tablet';
        }
        if (isMobileUA || largura < 600) {
            return 'mobile';
        }
        return 'desktop';
    }

    function isTouchDevice() {
        return ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0) ||
               (navigator.msMaxTouchPoints > 0);
    }

    /* ── Aplica classe no <html> ─────────────────────────────── */
    function aplicarClasseDispositivo() {
        const tipo = detectarDispositivo();
        const html = document.documentElement;

        html.classList.remove('device-mobile', 'device-tablet', 'device-desktop');
        html.classList.add('device-' + tipo);

        if (isTouchDevice()) html.classList.add('touch-device');
        else html.classList.remove('touch-device');

        // Guarda para uso externo
        window._deviceType = tipo;

        return tipo;
    }

    /* ── Adapta comportamentos por dispositivo ───────────────── */
    function adaptarComportamentos(tipo) {
        if (tipo === 'mobile' || tipo === 'tablet') {
            // Inputs: evita zoom ao focar no iOS (font-size ≥ 16px garante isso)
            document.querySelectorAll('input, select, textarea').forEach(el => {
                if (parseFloat(getComputedStyle(el).fontSize) < 16) {
                    el.style.fontSize = '16px';
                }
            });

            // Feedback tátil (vibração) nos botões de ação
            if (navigator.vibrate) {
                document.querySelectorAll('.btn-primary, .btn-danger, .btn-action').forEach(btn => {
                    btn.addEventListener('click', () => navigator.vibrate(10));
                });
            }
        }

        if (tipo === 'mobile') {
            // Scroll suave para mensagens de feedback
            document.querySelectorAll('.btn-submit-form').forEach(btn => {
                btn.addEventListener('click', () => {
                    setTimeout(() => {
                        const msg = document.querySelector('.msg[style*="block"]');
                        if (msg) msg.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 200);
                });
            });
        }
    }

    /* ── Banner de tipo de dispositivo (modo debug) ──────────── */
    function mostrarBannerDebug(tipo) {
        // Só ativa se URL tiver ?debug=device
        if (!location.search.includes('debug=device')) return;
        const banner = document.createElement('div');
        banner.style.cssText = [
            'position:fixed', 'bottom:80px', 'right:12px', 'z-index:9999',
            'background:rgba(68,85,96,0.9)', 'color:#fff',
            'font-size:11px', 'font-weight:700',
            'padding:5px 12px', 'border-radius:20px',
            'font-family:monospace', 'pointer-events:none'
        ].join(';');
        banner.textContent = `📱 ${tipo.toUpperCase()} · ${window.innerWidth}×${window.innerHeight}`;
        document.body.appendChild(banner);
        window.addEventListener('resize', () => {
            banner.textContent = `📱 ${detectarDispositivo().toUpperCase()} · ${window.innerWidth}×${window.innerHeight}`;
        });
    }

    /* ── Inicialização ───────────────────────────────────────── */
    function init() {
        const tipo = aplicarClasseDispositivo();
        adaptarComportamentos(tipo);
        mostrarBannerDebug(tipo);

        console.info(`[Device] Tipo detectado: ${tipo} (${window.innerWidth}×${window.innerHeight})`);
    }

    // Executa imediatamente (antes do DOMContentLoaded) para evitar flash
    aplicarClasseDispositivo();

    // Executa de novo após DOM pronto para adaptar comportamentos
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Re-detecta ao redimensionar (usuário rotaciona tela etc.)
    let _resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(_resizeTimer);
        _resizeTimer = setTimeout(() => {
            aplicarClasseDispositivo();
        }, 250);
    });

})();
