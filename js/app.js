/**
 * app.js
 * Oilema Sementes — Controle de Marmitas
 *
 * Lógica principal (todas as chamadas ao banco são async/await):
 *  - Formulário de solicitação (view-index)
 *  - Painel em tempo real com Firebase listener
 *  - Filtros por cooperado e por data
 *  - Geração de PDF via window.print()
 */

/* ================================================================
   FORMULÁRIO — auto-preenchimento por placa / fazenda
   ================================================================ */

async function forcarMaiusculoEBuscarMotorista(input) {
    input.value = input.value.toUpperCase();
    const placaDigitada = input.value.trim();
    if (placaDigitada.length >= 3) {
        const pedidos = await dbGet();
        const historico = pedidos.find(p => p.placa === placaDigitada);
        if (historico) {
            document.getElementById('nomeMotorista').value = historico.nome.toUpperCase();
        }
    }
}

async function forcarMaiusculoEBuscarCooperado(input) {
    input.value = input.value.toUpperCase();
    const fazendaDigitada = input.value.trim();
    if (fazendaDigitada.length >= 3) {
        const pedidos = await dbGet();
        const vinculo = pedidos.find(p => p.fazenda.trim() === fazendaDigitada);
        if (vinculo) {
            document.getElementById('nomeCooperado').value = vinculo.cooperado.toUpperCase();
        }
    }
}

/* ================================================================
   FORMULÁRIO — submissão
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formMarmitas');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const msgSucesso   = document.getElementById('mensagem-sucesso');
        const msgErro      = document.getElementById('mensagem-erro');
        const msgDuplicado = document.getElementById('mensagem-duplicado');
        const btnSubmit    = form.querySelector('.btn-submit');

        [msgSucesso, msgErro, msgDuplicado].forEach(m => m.style.display = 'none');
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Salvando...';

        try {
            const agora   = new Date();
            const dataISO = agora.toISOString().split('T')[0];
            const placa   = document.getElementById('placaVeiculo').value.toUpperCase().trim();

            const pedidos = await dbGet();

            // Verifica duplicidade no dia
            if (pedidos.some(p => p.placa === placa && p.dataISO === dataISO)) {
                msgDuplicado.style.display = 'block';
                return;
            }

            // Verifica horário limite (17:40)
            const tempoAtual = agora.getHours() * 60 + agora.getMinutes();
            if (tempoAtual > 17 * 60 + 40) {
                msgErro.style.display = 'block';
                return;
            }

            // Monta o registro
            const nome      = document.getElementById('nomeMotorista').value.toUpperCase().trim();
            const cooperado = document.getElementById('nomeCooperado').value.toUpperCase().trim();
            const fazenda   = document.getElementById('nomeFazenda').value.toUpperCase().trim();
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
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Registrar Solicitação';
        }
    });
});

/* ================================================================
   PAINEL — listener em tempo real + filtros
   ================================================================ */

let dadosAtuaisNaTabela = [];

/**
 * Inicia o listener Firebase para o painel.
 * Chamado por ui.js ao navegar para 'painel'.
 * @returns {function} função de cancelamento (repassada ao ui.js)
 */
function iniciarPainel() {
    renderizarTabela([]); // limpa a tabela antes de carregar
    document.getElementById('listaSolicitacoes').innerHTML =
        '<tr><td colspan="6" class="empty-state">Carregando dados...</td></tr>';

    return dbEscutar(pedidos => {
        // Ao receber dados do Firebase, re-aplica filtros se ativos
        const termoCooperado = document.getElementById('filtroCooperado')?.value.trim().toUpperCase();
        const dataInicio     = document.getElementById('dataInicio')?.value;
        const dataFim        = document.getElementById('dataFim')?.value;

        if (termoCooperado || dataInicio || dataFim) {
            const filtrados = filtrarPedidos(pedidos, termoCooperado, dataInicio, dataFim);
            renderizarTabela(filtrados);
        } else {
            renderizarTabela(pedidos);
        }
    });
}

/**
 * Renderiza os pedidos na tabela (função pura).
 * @param {Array} pedidos
 */
function renderizarTabela(pedidos) {
    const tbody = document.getElementById('listaSolicitacoes');
    if (!tbody) return;

    dadosAtuaisNaTabela = pedidos;

    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhuma solicitação encontrada.</td></tr>';
        return;
    }

    tbody.innerHTML = pedidos.map(p => `
        <tr>
            <td>${p.dataHoraExibicao}</td>
            <td><strong>${p.nome}</strong></td>
            <td>${p.placa}</td>
            <td>${p.cooperado}</td>
            <td>${p.fazenda}</td>
            <td>${p.quantidade}</td>
        </tr>
    `).join('');
}

/**
 * Aplica filtros sobre um array de pedidos.
 */
function filtrarPedidos(pedidos, termoCooperado, dataInicio, dataFim) {
    return pedidos.filter(p => {
        let okCoop = true;
        if (termoCooperado) okCoop = p.cooperado?.includes(termoCooperado);

        let okData = true;
        const d = p.dataISO;
        if (dataInicio && dataFim)  okData = d >= dataInicio && d <= dataFim;
        else if (dataInicio)         okData = d >= dataInicio;
        else if (dataFim)            okData = d <= dataFim;

        return okCoop && okData;
    });
}

/* ================================================================
   PAINEL — botões de filtro
   ================================================================ */

async function aplicarFiltros() {
    const termoCooperado = document.getElementById('filtroCooperado').value.trim().toUpperCase();
    const dataInicio     = document.getElementById('dataInicio').value;
    const dataFim        = document.getElementById('dataFim').value;

    if (!termoCooperado && !dataInicio && !dataFim) {
        alert('Por favor, preencha pelo menos um campo para filtrar.');
        return;
    }

    const pedidos  = await dbGet();
    const filtrados = filtrarPedidos(pedidos, termoCooperado, dataInicio, dataFim);
    renderizarTabela(filtrados);
}

function limparFiltro() {
    document.getElementById('filtroCooperado').value = '';
    document.getElementById('dataInicio').value      = '';
    document.getElementById('dataFim').value         = '';
    // O listener já vai re-renderizar automaticamente com todos os dados
}

/* ================================================================
   PAINEL — limpar banco
   ================================================================ */

async function limparBanco() {
    if (confirm('Tem certeza que deseja apagar todo o histórico de marmitas?')) {
        await dbDelete();
        limparFiltro();
    }
}

/* ================================================================
   PAINEL — geração de PDF
   ================================================================ */

function gerarPDF() {
    if (dadosAtuaisNaTabela.length === 0) {
        alert('Não existem dados na tabela para gerar o PDF.');
        return;
    }

    const totalMarmitas  = dadosAtuaisNaTabela.reduce((acc, p) => acc + parseInt(p.quantidade || 0), 0);
    const totalRegistros = dadosAtuaisNaTabela.length;

    const agora = new Date();
    document.getElementById('pdf-data-geracao').textContent =
        `Emitido em ${agora.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })} às ${agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })}`;
    document.getElementById('pdf-total-label').textContent =
        `🍱 ${totalMarmitas} marmitas · ${totalRegistros} registros`;

    document.querySelectorAll('img.logo-img').forEach(img => { img.src = LOGO_OILEMA; });

    window.print();
}
