/**
 * app.js — Oilema Sementes
 * Formulário de solicitação + painel (tempo real) + filtros + PDF
 */

/* ── Formulário: auto-preenchimento ──────────────────────────── */
async function forcarMaiusculoEBuscarMotorista(input) {
    input.value = input.value.toUpperCase();
    const placa = input.value.trim();
    if (placa.length >= 3) {
        const pedidos  = await dbGet();
        const historico = pedidos.find(p => p.placa === placa);
        if (historico) document.getElementById('nomeMotorista').value = historico.nome.toUpperCase();
    }
}

async function forcarMaiusculoEBuscarCooperado(input) {
    input.value = input.value.toUpperCase();
    const fazenda = input.value.trim();
    if (fazenda.length >= 3) {
        const pedidos = await dbGet();
        const vinculo = pedidos.find(p => p.fazenda.trim() === fazenda);
        if (vinculo) document.getElementById('nomeCooperado').value = vinculo.cooperado.toUpperCase();
    }
}

/* ── Formulário: submissão ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formMarmitas');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!verificarAuth()) return;

        const msgSucesso   = document.getElementById('mensagem-sucesso');
        const msgErro      = document.getElementById('mensagem-erro');
        const msgDuplicado = document.getElementById('mensagem-duplicado');
        const btnSubmit    = form.querySelector('.btn-submit');

        [msgSucesso, msgErro, msgDuplicado].forEach(m => m.style.display = 'none');
        btnSubmit.disabled    = true;
        btnSubmit.textContent = 'Salvando...';

        try {
            const agora   = new Date();
            const dataISO = agora.toISOString().split('T')[0];
            const placa   = document.getElementById('placaVeiculo').value.toUpperCase().trim();
            const pedidos = await dbGet();

            if (pedidos.some(p => p.placa === placa && p.dataISO === dataISO)) {
                msgDuplicado.style.display = 'block'; return;
            }

            const tempoAtual = agora.getHours() * 60 + agora.getMinutes();
            if (tempoAtual > 17 * 60 + 40) { msgErro.style.display = 'block'; return; }

            const nome       = document.getElementById('nomeMotorista').value.toUpperCase().trim();
            const cooperado  = document.getElementById('nomeCooperado').value.toUpperCase().trim();
            const fazenda    = document.getElementById('nomeFazenda').value.toUpperCase().trim();
            const quantidade = document.getElementById('quantidadeMarmitas').value;
            const dataHoraExibicao =
                agora.toLocaleDateString('pt-BR') + ' - ' +
                agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            pedidos.unshift({ dataHoraExibicao, dataISO, nome, placa, cooperado, fazenda, quantidade });
            await dbSet(pedidos);

            msgSucesso.style.display = 'block';
            form.reset();
            document.getElementById('quantidadeMarmitas').value = '1';
            setTimeout(() => { msgSucesso.style.display = 'none'; }, 3000);
        } finally {
            btnSubmit.disabled    = false;
            btnSubmit.textContent = 'Registrar Solicitação';
        }
    });
});

/* ── Painel: listener em tempo real ──────────────────────────── */
let dadosAtuaisNaTabela = [];

function iniciarPainel() {
    document.getElementById('listaSolicitacoes').innerHTML =
        '<tr><td colspan="6" class="empty-state">Carregando dados...</td></tr>';

    return dbEscutar(pedidos => {
        const termoCooperado = document.getElementById('filtroCooperado')?.value.trim().toUpperCase();
        const dataInicio     = document.getElementById('dataInicio')?.value;
        const dataFim        = document.getElementById('dataFim')?.value;

        const filtrados = (termoCooperado || dataInicio || dataFim)
            ? filtrarPedidos(pedidos, termoCooperado, dataInicio, dataFim)
            : pedidos;

        renderizarTabela(filtrados);
    });
}

/* ── Painel: renderização da tabela (com data-label para mobile) */
function renderizarTabela(pedidos) {
    const tbody = document.getElementById('listaSolicitacoes');
    if (!tbody) return;
    dadosAtuaisNaTabela = pedidos;

    if (!pedidos || pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma solicitação encontrada.</td></tr>';
        return;
    }

    tbody.innerHTML = pedidos.map(p => `
        <tr>
            <td data-label="Data e Hora">${p.dataHoraExibicao}</td>
            <td data-label="Motorista"><strong>${p.nome}</strong></td>
            <td data-label="Placa">${p.placa}</td>
            <td data-label="Cooperado">${p.cooperado}</td>
            <td data-label="Fazenda">${p.fazenda}</td>
            <td data-label="Qtd">${p.quantidade}</td>
        </tr>
    `).join('');
}

/* ── Filtros ─────────────────────────────────────────────────── */
function filtrarPedidos(pedidos, termoCooperado, dataInicio, dataFim) {
    return pedidos.filter(p => {
        const okCoop = termoCooperado ? p.cooperado?.includes(termoCooperado) : true;
        let okData = true;
        if (dataInicio && dataFim) okData = p.dataISO >= dataInicio && p.dataISO <= dataFim;
        else if (dataInicio) okData = p.dataISO >= dataInicio;
        else if (dataFim)    okData = p.dataISO <= dataFim;
        return okCoop && okData;
    });
}

async function aplicarFiltros() {
    const termoCooperado = document.getElementById('filtroCooperado').value.trim().toUpperCase();
    const dataInicio     = document.getElementById('dataInicio').value;
    const dataFim        = document.getElementById('dataFim').value;
    if (!termoCooperado && !dataInicio && !dataFim) {
        alert('Preencha pelo menos um campo para filtrar.'); return;
    }
    const pedidos   = await dbGet();
    renderizarTabela(filtrarPedidos(pedidos, termoCooperado, dataInicio, dataFim));
}

function limparFiltro() {
    document.getElementById('filtroCooperado').value = '';
    document.getElementById('dataInicio').value      = '';
    document.getElementById('dataFim').value         = '';
    // listener re-renderiza automaticamente
}

/* ── PDF ─────────────────────────────────────────────────────── */
function gerarPDF() {
    if (!dadosAtuaisNaTabela.length) { alert('Nenhum dado para gerar PDF.'); return; }

    const totalMarmitas  = dadosAtuaisNaTabela.reduce((a, p) => a + parseInt(p.quantidade || 0), 0);
    const agora = new Date();
    document.getElementById('pdf-data-geracao').textContent =
        `Emitido em ${agora.toLocaleDateString('pt-BR')} às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    document.getElementById('pdf-total-label').textContent =
        `🍱 ${totalMarmitas} marmitas · ${dadosAtuaisNaTabela.length} registros`;
    document.querySelectorAll('img.logo-img').forEach(img => { img.src = LOGO_OILEMA; });
    window.print();
}
