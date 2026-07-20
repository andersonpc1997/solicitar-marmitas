/**
 * app.js — Oilema Sementes
 * - Pré-cadastro de veículos com autocomplete
 * - Tipo de refeição: Almoço / Janta (mesma placa 2x/dia)
 * - Horários: Almoço 11:00-12:30 | Janta até 17:40 | bloqueado fora disso
 * - Painel com edição, exclusão, filtro e limpar no próprio painel
 * - Dashboard com gráficos e métricas
 */

/* ================================================================
   PRÉ-CADASTRO — cache local
   ================================================================ */
let _cacheVeiculos = {};

async function _carregarCacheVeiculos() {
    _cacheVeiculos = await dbGetVeiculos() || {};
}

async function _atualizarCadastroVeiculo(placa, nome, fazenda, cooperado) {
    _cacheVeiculos[placa] = { nome, fazenda, cooperado };
    await dbSalvarVeiculo(placa, { nome, fazenda, cooperado });
}

/* ── Autocomplete da placa ───────────────────────────── */
let _acTimer;
async function forcarMaiusculoEBuscarMotorista(input) {
    input.value = input.value.toUpperCase();
    const placa = input.value.trim();
    _fecharSugestoes();
    clearTimeout(_acTimer);
    if (placa.length < 2) return;

    _acTimer = setTimeout(async () => {
        if (!Object.keys(_cacheVeiculos).length) await _carregarCacheVeiculos();

        // Preenchimento exato
        if (_cacheVeiculos[placa]) {
            const v = _cacheVeiculos[placa];
            document.getElementById('nomeMotorista').value = v.nome || '';
            document.getElementById('nomeFazenda').value   = v.fazenda || '';
            document.getElementById('nomeCooperado').value = v.cooperado || '';
        }

        // Sugestões de placas similares
        const matches = Object.entries(_cacheVeiculos)
            .filter(([p]) => p.startsWith(placa) && p !== placa)
            .slice(0, 5);
        if (matches.length) _mostrarSugestoes(matches, input);
    }, 250);
}

function _mostrarSugestoes(matches, inputEl) {
    _fecharSugestoes();
    const ul = document.createElement('ul');
    ul.id = 'ac-lista';
    ul.className = 'autocomplete-lista';
    matches.forEach(([placa, d]) => {
        const li = document.createElement('li');
        li.className = 'autocomplete-item';
        li.innerHTML = `<span class="ac-placa">${placa}</span><span class="ac-nome">${d.nome}</span>`;
        li.addEventListener('mousedown', e => {
            e.preventDefault();
            inputEl.value = placa;
            document.getElementById('nomeMotorista').value = d.nome || '';
            document.getElementById('nomeFazenda').value   = d.fazenda || '';
            document.getElementById('nomeCooperado').value = d.cooperado || '';
            _fecharSugestoes();
        });
        ul.appendChild(li);
    });
    const wrap = inputEl.closest('.autocomplete-wrap') || inputEl.parentElement;
    wrap.appendChild(ul);
}

function _fecharSugestoes() {
    const el = document.getElementById('ac-lista');
    if (el) el.remove();
}
document.addEventListener('click', e => {
    if (!e.target.closest('#ac-lista') && !e.target.closest('#placaVeiculo')) _fecharSugestoes();
});

/* ── Autocomplete fazenda → cooperado ───────────────── */
async function forcarMaiusculoEBuscarCooperado(input) {
    input.value = input.value.toUpperCase();
    const faz = input.value.trim();
    if (faz.length < 3) return;
    if (!Object.keys(_cacheVeiculos).length) await _carregarCacheVeiculos();
    const match = Object.values(_cacheVeiculos).find(v => (v.fazenda||'') === faz);
    if (match) document.getElementById('nomeCooperado').value = match.cooperado || '';
}

/* ================================================================
   HORÁRIOS E TIPO DE REFEIÇÃO
   Almoço:  antes das 11:30  (sem bloqueio de horário mínimo)
   Janta:   11:30 em diante, até 18:00
   Encerrado: após 18:00
   ================================================================ */
function _tipoRefeicaoAtual() {
    const agora = new Date();
    const min   = agora.getHours() * 60 + agora.getMinutes();
    const H1130 = 11 * 60 + 30; // 11:30 — corte almoço/janta
    const H1800 = 18 * 60;      // 18:00 — encerramento

    if (min >= H1800) return 'encerrado'; // após 18:00
    if (min < H1130)  return 'almoco';    // antes das 11:30 → almoço
    return 'janta';                        // 11:30 – 17:59 → janta
}

function _labelRefeicao(tipo) {
    return tipo === 'almoco' ? '☀️ Almoço' : '🌙 Janta';
}

/* ── Atualiza badge de horário no formulário ─────────── */
function _atualizarBadgeHorario() {
    const tipo = _tipoRefeicaoAtual();
    const badge = document.getElementById('badge-refeicao');
    const aviso = document.getElementById('aviso-horario');
    if (!badge) return;

    if (tipo === 'encerrado') {
        badge.textContent = '⛔ Encerrado';
        badge.className = 'badge-refeicao badge-encerrado';
        if (aviso) { aviso.textContent = 'Pedidos encerrados após as 18:00.'; aviso.style.display = 'block'; }
    } else {
        badge.textContent = _labelRefeicao(tipo) + ' (em andamento)';
        badge.className = 'badge-refeicao ' + (tipo === 'almoco' ? 'badge-almoco' : 'badge-janta');
        if (aviso) aviso.style.display = 'none';
    }
}

/* ================================================================
   MODAL DE EDIÇÃO
   ================================================================ */
let dadosAtuaisNaTabela = [];
let _idxEditando = null;

function abrirModalEdicao(i) {
    const p = dadosAtuaisNaTabela[i];
    if (!p) return;
    _idxEditando = i;
    document.getElementById('editDataHora').value   = p.dataHoraExibicao || '';
    document.getElementById('editNome').value       = p.nome      || '';
    document.getElementById('editPlaca').value      = p.placa     || '';
    document.getElementById('editCooperado').value  = p.cooperado || '';
    document.getElementById('editFazenda').value    = p.fazenda   || '';
    document.getElementById('editQtd').value        = p.quantidade || 1;
    document.getElementById('editRefeicao').value   = p.refeicao  || 'janta';
    document.getElementById('modalEdicao').style.display = 'flex';
    document.getElementById('editNome').focus();
}

function fecharModalEdicao() {
    document.getElementById('modalEdicao').style.display = 'none';
    _idxEditando = null;
}

async function salvarEdicao() {
    if (_idxEditando === null) return;
    const btn = document.getElementById('btnSalvarEdicao');
    btn.disabled = true; btn.textContent = 'Salvando...';
    try {
        const todos = await dbGet();
        const alvo  = dadosAtuaisNaTabela[_idxEditando];
        const idx   = todos.findIndex(p =>
            p.placa === alvo.placa && p.dataISO === alvo.dataISO &&
            p.nome  === alvo.nome  && (p.refeicao||'janta') === (alvo.refeicao||'janta')
        );
        if (idx === -1) { alert('Registro não encontrado.'); fecharModalEdicao(); return; }
        todos[idx] = {
            ...todos[idx],
            dataHoraExibicao: document.getElementById('editDataHora').value.trim(),
            nome:             document.getElementById('editNome').value.toUpperCase().trim(),
            placa:            document.getElementById('editPlaca').value.toUpperCase().trim(),
            cooperado:        document.getElementById('editCooperado').value.toUpperCase().trim(),
            fazenda:          document.getElementById('editFazenda').value.toUpperCase().trim(),
            quantidade:       parseInt(document.getElementById('editQtd').value) || 1,
            refeicao:         document.getElementById('editRefeicao').value,
        };
        await dbSet(todos);
        fecharModalEdicao();
    } finally { btn.disabled = false; btn.textContent = '✅ Salvar'; }
}

async function excluirRegistro(i) {
    const p = dadosAtuaisNaTabela[i];
    if (!p) return;
    if (!confirm('Excluir este registro?\n\nMotorista: ' + p.nome + '\nPlaca: ' + p.placa + '\nRefeição: ' + (p.refeicao === 'almoco' ? 'Almoço' : 'Janta') + '\nData: ' + p.dataHoraExibicao)) return;
    const todos = await dbGet();
    const idx   = todos.findIndex(p2 =>
        p2.placa === p.placa && p2.dataISO === p.dataISO &&
        p2.nome  === p.nome  && (p2.refeicao||'janta') === (p.refeicao||'janta')
    );
    if (idx === -1) { alert('Registro não encontrado.'); return; }
    todos.splice(idx, 1);
    await dbSet(todos);
}

/* ================================================================
   FORMULÁRIO — submissão
   ================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    await _carregarCacheVeiculos();
    _atualizarBadgeHorario();
    setInterval(_atualizarBadgeHorario, 30000); // atualiza a cada 30s

    const form = document.getElementById('formMarmitas');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        const msgs = ['mensagem-sucesso','mensagem-erro','mensagem-duplicado'];
        msgs.forEach(id => { const el = document.getElementById(id); if(el) el.style.display = 'none'; });

        const btn = form.querySelector('.btn-submit-form');
        btn.disabled = true; btn.textContent = 'Salvando...';

        try {
            const tipo = _tipoRefeicaoAtual();
            if (tipo === 'encerrado') {
                const el = document.getElementById('mensagem-erro');
                if (el) el.style.display = 'block';
                return;
            }

            const agora   = new Date();
            const dataISO = agora.toISOString().split('T')[0];
            const placa   = document.getElementById('placaVeiculo').value.toUpperCase().trim();
            const nome    = document.getElementById('nomeMotorista').value.toUpperCase().trim();

            if (!placa || !nome) { alert('Preencha placa e nome do motorista.'); return; }

            const pedidos = await dbGet();

            // Duplicidade: mesma placa + mesmo dia + mesma refeição
            const jaDuplicado = pedidos.some(p =>
                p.placa === placa && p.dataISO === dataISO && (p.refeicao||'janta') === tipo
            );
            if (jaDuplicado) {
                const el = document.getElementById('mensagem-duplicado');
                const label = tipo === 'almoco' ? 'almoço' : 'janta';
                if (el) { el.textContent = '⚠️ Este veículo já possui um pedido de ' + label + ' registrado hoje!'; el.style.display = 'block'; }
                return;
            }

            const cooperado  = document.getElementById('nomeCooperado').value.toUpperCase().trim();
            const fazenda    = document.getElementById('nomeFazenda').value.toUpperCase().trim();
            const quantidade = parseInt(document.getElementById('quantidadeMarmitas').value) || 1;
            const dataHoraExibicao = agora.toLocaleDateString('pt-BR') + ' - ' + agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });

            pedidos.unshift({ dataHoraExibicao, dataISO, nome, placa, cooperado, fazenda, quantidade, refeicao: tipo });
            await dbSet(pedidos);
            await _atualizarCadastroVeiculo(placa, nome, fazenda, cooperado);

            const sucesso = document.getElementById('mensagem-sucesso');
            if (sucesso) {
                sucesso.textContent = '✅ ' + (tipo === 'almoco' ? 'Almoço' : 'Janta') + ' registrado com sucesso!';
                sucesso.style.display = 'block';
            }
            form.reset();
            document.getElementById('quantidadeMarmitas').value = '1';
            _atualizarBadgeHorario();
            setTimeout(() => { if(sucesso) sucesso.style.display = 'none'; }, 3500);

        } finally {
            btn.disabled = false;
            btn.innerHTML = '🍱 Registrar Solicitação';
        }
    });
});

/* ================================================================
   PAINEL — listener + renderização
   ================================================================ */
function iniciarPainel() {
    document.getElementById('listaSolicitacoes').innerHTML =
        '<tr><td colspan="8" class="empty-state">Carregando...</td></tr>';

    // Padrão: exibe somente o dia de hoje — preenche os campos de data
    const hoje = new Date().toISOString().split('T')[0];
    const elIni = document.getElementById('dataInicio');
    const elFim = document.getElementById('dataFim');
    if (elIni) elIni.value = hoje;
    if (elFim) elFim.value = hoje;
    _atualizarBadgePainel(false);

    return dbEscutar(pedidos => {
        const coop = document.getElementById('filtroCooperado')?.value.trim().toUpperCase();
        const ini  = document.getElementById('dataInicio')?.value;
        const fim  = document.getElementById('dataFim')?.value;
        const ref  = document.getElementById('filtroRefeicao')?.value;
        // Sempre filtra — no mínimo as datas de hoje já estão preenchidas
        renderizarTabela(_filtrar(pedidos, coop, ini, fim, ref));
    });
}

function renderizarTabela(pedidos) {
    const tbody = document.getElementById('listaSolicitacoes');
    if (!tbody) return;
    dadosAtuaisNaTabela = pedidos;
    _atualizarStats(pedidos);

    if (!pedidos.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma solicitação encontrada.</td></tr>';
        return;
    }
    const badgeRef = r => r === 'almoco'
        ? '<span class="badge-ref badge-ref-almoco">☀️ Almoço</span>'
        : '<span class="badge-ref badge-ref-janta">🌙 Janta</span>';

    tbody.innerHTML = pedidos.map((p, i) => `
        <tr>
            <td data-label="Data/Hora">${p.dataHoraExibicao}</td>
            <td data-label="Refeição">${badgeRef(p.refeicao||'janta')}</td>
            <td data-label="Motorista"><strong>${p.nome}</strong></td>
            <td data-label="Placa">${p.placa}</td>
            <td data-label="Cooperado">${p.cooperado}</td>
            <td data-label="Fazenda">${p.fazenda}</td>
            <td data-label="Qtd"><span class="badge-qty">${p.quantidade}</span></td>
            <td data-label="Ações" class="td-acoes">
                <button class="btn-row-edit" onclick="abrirModalEdicao(${i})" title="Editar">✏️</button>
                <button class="btn-row-del"  onclick="excluirRegistro(${i})"  title="Excluir">🗑️</button>
            </td>
        </tr>`).join('');
}

/* ================================================================
   STATS BAR
   ================================================================ */
function _atualizarStats(pedidos) {
    const hoje = new Date().toISOString().split('T')[0];
    const hj   = pedidos.filter(p => p.dataISO === hoje);
    const marHoje  = hj.reduce((a,p) => a + parseInt(p.quantidade||0), 0);
    const almocos  = hj.filter(p => (p.refeicao||'janta') === 'almoco').reduce((a,p) => a + parseInt(p.quantidade||0), 0);
    const jantas   = hj.filter(p => (p.refeicao||'janta') === 'janta').reduce((a,p) => a + parseInt(p.quantidade||0), 0);

    let periodo = '—';
    if (pedidos.length) {
        const dts = pedidos.map(p => p.dataISO).filter(Boolean).sort();
        periodo = dts[0] === dts[dts.length-1] ? _fmt(dts[0]) : _fmt(dts[0]) + ' – ' + _fmt(dts[dts.length-1]);
    }

    _set('statTotal',    marHoje || pedidos.reduce((a,p) => a+parseInt(p.quantidade||0),0));
    _set('statAlmoco',   almocos);
    _set('statJanta',    jantas);
    _set('statRegistros',pedidos.length);
    _set('statPeriodo',  periodo);
}

function _set(id, v) { const el = document.getElementById(id); if(el) el.textContent = v; }
function _fmt(iso) { if(!iso) return '—'; const [a,m,d] = iso.split('-'); return d+'/'+m+'/'+a; }

/* ================================================================
   FILTROS
   ================================================================ */
function _filtrar(pedidos, coop, ini, fim, ref) {
    return pedidos.filter(p => {
        if (coop && !(p.cooperado||'').includes(coop)) return false;
        if (ref  && (p.refeicao||'janta') !== ref) return false;
        const d = p.dataISO;
        if (ini && fim && (d < ini || d > fim)) return false;
        if (ini && !fim && d < ini) return false;
        if (!ini && fim && d > fim) return false;
        return true;
    });
}

async function aplicarFiltros() {
    const coop = document.getElementById('filtroCooperado').value.trim().toUpperCase();
    const ini  = document.getElementById('dataInicio').value;
    const fim  = document.getElementById('dataFim').value;
    const ref  = document.getElementById('filtroRefeicao').value;
    if (!coop && !ini && !fim && !ref) { alert('Preencha ao menos um campo de filtro.'); return; }
    // Verifica se está buscando fora do dia de hoje
    const hoje = new Date().toISOString().split('T')[0];
    const filtroCustom = (ini && ini !== hoje) || (fim && fim !== hoje) || !!coop || !!ref;
    _atualizarBadgePainel(filtroCustom);
    renderizarTabela(_filtrar(await dbGet(), coop, ini, fim, ref));
}

async function limparFiltro() {
    // Ao limpar, volta para o padrão: somente hoje
    const hoje = new Date().toISOString().split('T')[0];
    const coop = document.getElementById('filtroCooperado'); if(coop) coop.value = '';
    const ref  = document.getElementById('filtroRefeicao');  if(ref)  ref.value  = '';
    const ini  = document.getElementById('dataInicio');      if(ini)  ini.value  = hoje;
    const fim  = document.getElementById('dataFim');         if(fim)  fim.value  = hoje;
    _atualizarBadgePainel(false);
    const todos = await dbGet();
    renderizarTabela(_filtrar(todos, '', hoje, hoje, ''));
}

async function limparBanco() {
    if (confirm('Apagar todo o histórico?')) { await dbDelete(); await limparFiltro(); }
}

/* ================================================================
   PDF
   ================================================================ */
function gerarPDF() {
    if (!dadosAtuaisNaTabela.length) { alert('Sem dados para gerar PDF.'); return; }
    const tot  = dadosAtuaisNaTabela.reduce((a,p) => a+parseInt(p.quantidade||0),0);
    const agora = new Date();
    _set('pdf-data-geracao', 'Emitido em ' + agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}));
    _set('pdf-total-label',  '🍱 ' + tot + ' marmitas · ' + dadosAtuaisNaTabela.length + ' registros');
    document.querySelectorAll('img.logo-img').forEach(img => { img.src = LOGO_OILEMA; });
    window.print();
}

/* ================================================================
   DASHBOARD
   ================================================================ */
function iniciarDashboard() {
    _set('dash-loading-txt', 'Carregando...');
    document.getElementById('dash-conteudo').style.display = 'none';
    document.getElementById('dash-vazio').style.display    = 'none';

    const cancel = dbEscutar(pedidos => {
        if (!pedidos.length) {
            document.getElementById('dash-vazio').style.display    = 'block';
            document.getElementById('dash-conteudo').style.display = 'none';
            _set('dash-loading-txt','');
            return;
        }
        _set('dash-loading-txt','');
        document.getElementById('dash-conteudo').style.display = 'block';
        document.getElementById('dash-vazio').style.display    = 'none';
        _renderDash(pedidos);
    });
    return cancel;
}

function _renderDash(pedidos) {
    const hoje = new Date().toISOString().split('T')[0];

    // Agrupa por dia
    const porDia = {};
    pedidos.forEach(p => {
        const d = p.dataISO || 'sem-data';
        if (!porDia[d]) porDia[d] = { total:0, almoco:0, janta:0, registros:0 };
        const qtd = parseInt(p.quantidade||0);
        porDia[d].total     += qtd;
        porDia[d].registros += 1;
        if ((p.refeicao||'janta') === 'almoco') porDia[d].almoco += qtd;
        else                                     porDia[d].janta  += qtd;
    });

    const datas   = Object.keys(porDia).sort();
    const ultimas = datas.slice(-7);

    // KPIs
    const totalGeral  = pedidos.reduce((a,p) => a+parseInt(p.quantidade||0),0);
    const totalHoje   = porDia[hoje]?.total    || 0;
    const almocoHoje  = porDia[hoje]?.almoco   || 0;
    const jantaHoje   = porDia[hoje]?.janta    || 0;
    const numDias     = datas.length;
    const mediaDia    = numDias ? (totalGeral/numDias).toFixed(1) : 0;
    const picoTotal   = Math.max(...Object.values(porDia).map(d=>d.total));

    _set('kpi-hoje',      totalHoje);
    _set('kpi-almoco-hj', almocoHoje);
    _set('kpi-janta-hj',  jantaHoje);
    _set('kpi-total',     totalGeral);
    _set('kpi-media',     mediaDia);
    _set('kpi-dias',      numDias);
    _set('kpi-pico',      picoTotal);

    _desenharGrafico(ultimas, porDia);
    _renderTopCoop(pedidos, totalGeral);
    _renderTabelaDias(datas.slice().reverse(), porDia, hoje);
}

function _desenharGrafico(dias, porDia) {
    const canvas = document.getElementById('grafico-barras');
    if (!canvas) return;
    const W = canvas.parentElement.offsetWidth || 600;
    const H = 220;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,W,H);
    if (!dias.length) return;

    const pL=44, pR=16, pT=24, pB=52;
    const aW = W-pL-pR, aH = H-pT-pB;
    const maxVal = Math.max(...dias.map(d=>(porDia[d]?.total||0)),1);
    const gap    = aW / dias.length;
    const barW   = Math.min(gap*0.55, 60);
    const hoje   = new Date().toISOString().split('T')[0];

    // Grade
    [0,0.25,0.5,0.75,1].forEach(f => {
        const y = pT + aH*(1-f);
        ctx.strokeStyle='#e0e6ed'; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke();
        ctx.fillStyle='#8fa5b2'; ctx.font='10px sans-serif'; ctx.textAlign='right';
        ctx.fillText(Math.round(maxVal*f), pL-5, y+4);
    });

    // Barras empilhadas: almoço + janta
    dias.forEach((d,i) => {
        const al = porDia[d]?.almoco || 0;
        const ja = porDia[d]?.janta  || 0;
        const tot= al + ja;
        const x  = pL + gap*i + (gap-barW)/2;
        const isHoje = d===hoje;

        // Barra janta (base)
        const hJ = tot > 0 ? (ja/maxVal)*aH : 0;
        const hA = tot > 0 ? (al/maxVal)*aH : 0;
        const yJ = pT + aH - hJ;
        const yA = yJ - hA;

        if (hJ > 0) {
            ctx.fillStyle = isHoje ? '#f28130' : '#445560';
            ctx.beginPath();
            if (hA > 0) {
                ctx.roundRect(x, yJ, barW, hJ, [0,0,4,4]);
            } else {
                ctx.roundRect(x, yJ, barW, hJ, [4,4,4,4]);
            }
            ctx.fill();
        }
        if (hA > 0) {
            ctx.fillStyle = isHoje ? '#ffd6a5' : '#78909c';
            ctx.beginPath(); ctx.roundRect(x, yA, barW, hA, [4,4,0,0]); ctx.fill();
        }

        // Valor total
        if (tot > 0) {
            ctx.fillStyle = isHoje ? '#d66a18' : '#334049';
            ctx.font = 'bold 11px sans-serif'; ctx.textAlign='center';
            ctx.fillText(tot, x+barW/2, yA-4);
        }

        // Label data
        const [,m,dd] = d.split('-');
        ctx.fillStyle = isHoje ? '#f28130' : '#6b8292';
        ctx.font = isHoje ? 'bold 11px sans-serif' : '11px sans-serif';
        ctx.textAlign='center';
        ctx.fillText(dd+'/'+m, x+barW/2, H-pB+14);
        if (isHoje) { ctx.font='bold 9px sans-serif'; ctx.fillText('hoje', x+barW/2, H-pB+26); }
    });

    // Legenda
    const legY = H - 8;
    ctx.fillStyle='#445560'; ctx.fillRect(pL, legY-8, 10, 10);
    ctx.fillStyle='#6b8292'; ctx.font='10px sans-serif'; ctx.textAlign='left';
    ctx.fillText('Janta', pL+14, legY);
    ctx.fillStyle='#78909c'; ctx.fillRect(pL+60, legY-8, 10, 10);
    ctx.fillText('Almoço', pL+74, legY);
}

function _renderTopCoop(pedidos, totalGeral) {
    const el = document.getElementById('lista-top-coop');
    if (!el) return;
    const porCoop = {};
    pedidos.forEach(p => {
        const c = p.cooperado||'N/D';
        porCoop[c] = (porCoop[c]||0) + parseInt(p.quantidade||0);
    });
    const top = Object.entries(porCoop).sort((a,b)=>b[1]-a[1]).slice(0,5);
    if (!top.length) { el.innerHTML='<p class="empty-state">Sem dados</p>'; return; }
    const cores = ['#f28130','#445560','#5b8fa8','#78909c','#90a4ae'];
    el.innerHTML = top.map(([nome,qtd],i) => {
        const pct = totalGeral>0 ? ((qtd/totalGeral)*100).toFixed(1) : 0;
        return `<div class="top-item">
            <div class="top-rank" style="background:${cores[i]}">${i+1}</div>
            <div class="top-info">
                <div class="top-nome">${nome}</div>
                <div class="top-bar-wrap"><div class="top-bar" style="width:${pct}%;background:${cores[i]}"></div></div>
                <div class="top-pct">${pct}%</div>
            </div>
            <div class="top-qtd"><strong>${qtd}</strong><span>mar.</span></div>
        </div>`;
    }).join('');
}

function _renderTabelaDias(datas, porDia, hoje) {
    const tbody = document.getElementById('tabela-dias-body');
    if (!tbody) return;
    tbody.innerHTML = datas.map(d => {
        const info = porDia[d]||{total:0,almoco:0,janta:0,registros:0};
        const med  = info.registros>0 ? (info.total/info.registros).toFixed(1) : '—';
        return `<tr ${d===hoje?'class="linha-hoje"':''}>
            <td>${_fmt(d)}${d===hoje?' <span class="badge-hoje">hoje</span>':''}</td>
            <td class="text-center">${info.registros}</td>
            <td class="text-center">${info.almoco}</td>
            <td class="text-center">${info.janta}</td>
            <td class="text-center"><strong>${info.total}</strong></td>
            <td class="text-center">${med}</td>
        </tr>`;
    }).join('');
}
