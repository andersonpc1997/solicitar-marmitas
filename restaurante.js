/**
 * restaurante.js — Oilema Sementes
 * Painel exclusivo do setor de Restaurante
 *  - Visualização em tempo real dos pedidos do dia
 *  - Foco na QUANTIDADE total de marmitas
 *  - Sem placa / fazenda
 *  - Alerta sonoro + visual às 10:50 (hora de montar as marmitas)
 */

/* ================================================================
   CONTEXTO DE ÁUDIO — precisa de interação do usuário (regra dos browsers)
   ================================================================ */
let _audioCtx = null;
let _alertasAtivos = false;
let _alertasTocadosHoje = {}; // formato: { 'YYYY-MM-DD': { '10:50': true, '17:45': true } }

function ativarAlertas() {
    try {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        _alertasAtivos = true;
        const btn = document.getElementById('btn-ativar-alertas');
        if (btn) {
            btn.textContent = '🔔 Alertas Ativos';
            btn.classList.add('btn-alertas-ativo');
            btn.disabled = true;
        }
        console.info('[Restaurante] Contexto de áudio ativado.');
    } catch (e) {
        console.warn('[Restaurante] Não foi possível criar contexto de áudio:', e);
    }
}

/* ── Toca som de campainha (3 beeps) via Web Audio API ── */
function _tocarCampainha() {
    if (!_audioCtx) return;
    const tempos = [0, 0.35, 0.70];
    tempos.forEach(offset => {
        const osc  = _audioCtx.createOscillator();
        const gain = _audioCtx.createGain();
        osc.connect(gain);
        gain.connect(_audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, _audioCtx.currentTime + offset);
        osc.frequency.exponentialRampToValueAtTime(660, _audioCtx.currentTime + offset + 0.25);

        gain.gain.setValueAtTime(0, _audioCtx.currentTime + offset);
        gain.gain.linearRampToValueAtTime(0.6, _audioCtx.currentTime + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, _audioCtx.currentTime + offset + 0.28);

        osc.start(_audioCtx.currentTime + offset);
        osc.stop(_audioCtx.currentTime  + offset + 0.30);
    });
}

/* ── Mostra o banner de alerta ── */
function _mostrarBannerAlerta(horario) {
    const banner = document.getElementById('alerta-sonoro-banner');
    const titulo = document.getElementById('alerta-banner-titulo');
    if (titulo) {
        titulo.textContent = horario + ' — Hora de montar as marmitas!';
    }
    if (banner) {
        banner.style.display = 'flex';
        // Força reflow para reiniciar animação CSS
        banner.classList.remove('alerta-pulsar');
        void banner.offsetWidth;
        banner.classList.add('alerta-pulsar');
    }
}

function dismissAlerta() {
    const banner = document.getElementById('alerta-sonoro-banner');
    if (banner) banner.style.display = 'none';
}

/* ── Verifica horário do alerta a cada 30s ── */
function _iniciarTimerAlerta() {
    function verificar() {
        const agora = new Date();
        const h = agora.getHours();
        const m = agora.getMinutes();
        const hoje = agora.toISOString().split('T')[0];

        // Se virou o dia (passou de meia-noite) atualiza a tela automaticamente
        if (_diaAtualRestaurante !== hoje) {
            _diaAtualRestaurante = hoje;
            if (typeof _pedidosEmMemoria !== 'undefined') {
                const pedidosHoje = _pedidosEmMemoria.filter(p => (p.dataISO || '') === hoje);
                _renderizarRestaurante(pedidosHoje);
            }
        }

        // Inicializa o registro do dia se necessário
        if (!_alertasTocadosHoje[hoje]) {
            _alertasTocadosHoje = { [hoje]: {} };
        }

        // Dispara às 10:50 (Almoço)
        if (h === 10 && m === 50 && !_alertasTocadosHoje[hoje]['10:50']) {
            _alertasTocadosHoje[hoje]['10:50'] = true;
            _mostrarBannerAlerta('10:50');
            if (_alertasAtivos) _tocarCampainha();
        }

        // Dispara às 17:45 (Janta)
        if (h === 17 && m === 45 && !_alertasTocadosHoje[hoje]['17:45']) {
            _alertasTocadosHoje[hoje]['17:45'] = true;
            _mostrarBannerAlerta('17:45');
            if (_alertasAtivos) _tocarCampainha();
        }
    }

    verificar(); // checa imediatamente ao iniciar
    return setInterval(verificar, 30000);
}

/* ================================================================
   PAINEL DO RESTAURANTE — renderização
   ================================================================ */
let _timerAlertaId = null;
let _pedidosEmMemoria = [];
let _diaAtualRestaurante = new Date().toISOString().split('T')[0];

function iniciarRestaurante() {
    // Inicia o timer do alerta
    if (_timerAlertaId) clearInterval(_timerAlertaId);
    _timerAlertaId = _iniciarTimerAlerta();

    // Limpa área de cards
    const area = document.getElementById('rest-cards');
    if (area) area.innerHTML = '<p class="rest-loading">Carregando...</p>';

    // Escuta Firebase em tempo real
    return dbEscutar(pedidos => {
        _pedidosEmMemoria = pedidos;
        const hoje = new Date().toISOString().split('T')[0];
        _diaAtualRestaurante = hoje; // Reset on data change just in case
        const pedidosHoje = pedidos.filter(p => (p.dataISO || '') === hoje);
        _renderizarRestaurante(pedidosHoje);
    });
}

function _renderizarRestaurante(pedidos) {
    // ── Contadores ──
    const totalMarmitas = pedidos.reduce((s, p) => s + parseInt(p.quantidade || 0), 0);
    const totalAlmoco   = pedidos.filter(p => (p.refeicao || 'janta') === 'almoco')
                                 .reduce((s, p) => s + parseInt(p.quantidade || 0), 0);
    const totalJanta    = pedidos.filter(p => (p.refeicao || 'janta') === 'janta')
                                 .reduce((s, p) => s + parseInt(p.quantidade || 0), 0);
    const totalRegistros = pedidos.length;

    _setRest('rest-total-marmitas', totalMarmitas);
    _setRest('rest-total-almoco',   totalAlmoco);
    _setRest('rest-total-janta',    totalJanta);
    _setRest('rest-total-registros', totalRegistros);

    // ── Resumo por Responsável ──
    const responsaveis = {};
    pedidos.forEach(p => {
        const resp = p.responsavel || 'NÃO INFORMADO';
        responsaveis[resp] = (responsaveis[resp] || 0) + parseInt(p.quantidade || 0);
    });
    
    const elResp = document.getElementById('rest-resumo-responsaveis');
    if (elResp) {
        const htmlResp = Object.entries(responsaveis)
            .sort((a,b) => b[1] - a[1]) // ordena por maior quantidade
            .map(([nome, qtd]) => `
                <div class="rest-resp-item">
                    <span class="rest-resp-nome">${nome}</span>
                    <span class="rest-resp-qtd">${qtd}</span>
                </div>
            `).join('');
        elResp.innerHTML = htmlResp || '<div class="rest-resp-vazio">Nenhum pedido</div>';
    }

    // ── Cards ──
    const area = document.getElementById('rest-cards');
    if (!area) return;

    if (!pedidos.length) {
        area.innerHTML = '<p class="rest-vazio">Nenhuma solicitação registrada hoje.</p>';
        return;
    }

    // Guarda IDs anteriores para animar somente os novos
    const idsAntigos = new Set(
        [...area.querySelectorAll('.rest-card')].map(el => el.dataset.uid)
    );

    area.innerHTML = pedidos.map((p, i) => {
        const tipo = p.refeicao || 'janta';
        const isAlmoco = tipo === 'almoco';
        const uid = `${p.placa || ''}_${p.dataISO || ''}_${i}`;
        const isNovo = !idsAntigos.has(uid);
        return `
        <div class="rest-card ${isAlmoco ? 'rest-card-almoco' : 'rest-card-janta'} ${isNovo ? 'rest-card-novo' : ''}"
             data-uid="${uid}">
            <div class="rest-card-badge">${isAlmoco ? '☀️ Almoço' : '🌙 Janta'}</div>
            <div class="rest-card-qty">${p.quantidade}</div>
            <div class="rest-card-label">marmita${parseInt(p.quantidade || 1) > 1 ? 's' : ''}</div>
            <div class="rest-card-responsavel">Resp: ${p.responsavel || '—'}</div>
            <div class="rest-card-motorista">${p.nome || '—'}</div>
            <div class="rest-card-cooperado">${p.cooperado || '—'}</div>
            <div class="rest-card-hora">${(p.dataHoraExibicao || '').split(' - ')[1] || ''}</div>
        </div>`;
    }).join('');
}

function _setRest(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
