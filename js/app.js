/**
 * app.js
 * Oilema Sementes — Controle de Marmitas
 *
 * Lógica principal:
 *  - Formulário de solicitação (view-index)
 *  - Painel de controle / tabela (view-painel)
 *  - Filtros por cooperado e por data
 *  - Geração de PDF via window.print()
 */

/* ================================================================
   FORMULÁRIO — auto-preenchimento por placa e por fazenda
   ================================================================ */

function forcarMaiusculoEBuscarMotorista(input) {
    input.value = input.value.toUpperCase();
    const placaDigitada = input.value.trim();
    if (placaDigitada.length >= 3) {
        const pedidos = dbGet();
        const historico = pedidos.find(p => p.placa === placaDigitada);
        if (historico) {
            document.getElementById('nomeMotorista').value = historico.nome.toUpperCase();
        }
    }
}

function forcarMaiusculoEBuscarCooperado(input) {
    input.value = input.value.toUpperCase();
    const fazendaDigitada = input.value.trim();
    if (fazendaDigitada.length >= 3) {
        const pedidos = dbGet();
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

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const msgSucesso   = document.getElementById('mensagem-sucesso');
        const msgErro      = document.getElementById('mensagem-erro');
        const msgDuplicado = document.getElementById('mensagem-duplicado');

        // Oculta todas as mensagens
        [msgSucesso, msgErro, msgDuplicado].forEach(m => m.style.display = 'none');

        const agora   = new Date();
        const dataISO = agora.toISOString().split('T')[0];
        const placa   = document.getElementById('placaVeiculo').value.toUpperCase().trim();

        let pedidos = dbGet();

        // Verifica duplicidade no dia
        const jaExiste = pedidos.some(p => p.placa === placa && p.dataISO === dataISO);
        if (jaExiste) {
            msgDuplicado.style.display = 'block';
            return;
        }

        // Verifica horário limite (17:40)
        const tempoAtual = agora.getHours() * 60 + agora.getMinutes();
        const tempoLimite = 17 * 60 + 40;
        if (tempoAtual > tempoLimite) {
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
        dbSet(pedidos);

        msgSucesso.style.display = 'block';
        form.reset();
        document.getElementById('quantidadeMarmitas').value = '1';
        setTimeout(() => { msgSucesso.style.display = 'none'; }, 3000);
    });
});

/* ================================================================
   PAINEL — carregamento e renderização da tabela
   ================================================================ */

let dadosAtuaisNaTabela = [];

function carregarDados(pedidosFiltrados = null) {
    const tbody  = document.getElementById('listaSolicitacoes');
    const pedidos = pedidosFiltrados !== null ? pedidosFiltrados : dbGet();
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

/* ================================================================
   PAINEL — filtros
   ================================================================ */

function aplicarFiltros() {
    const termoCooperado = document.getElementById('filtroCooperado').value.trim().toUpperCase();
    const dataInicio     = document.getElementById('dataInicio').value;
    const dataFim        = document.getElementById('dataFim').value;

    if (!termoCooperado && !dataInicio && !dataFim) {
        alert('Por favor, preencha pelo menos um campo para filtrar.');
        return;
    }

    const pedidos = dbGet();
    const resultados = pedidos.filter(p => {
        let okCoop = true;
        if (termoCooperado) okCoop = p.cooperado.includes(termoCooperado);

        let okData = true;
        const d = p.dataISO;
        if (dataInicio && dataFim)   okData = d >= dataInicio && d <= dataFim;
        else if (dataInicio)          okData = d >= dataInicio;
        else if (dataFim)             okData = d <= dataFim;

        return okCoop && okData;
    });

    carregarDados(resultados);
}

function limparFiltro() {
    document.getElementById('filtroCooperado').value = '';
    document.getElementById('dataInicio').value      = '';
    document.getElementById('dataFim').value         = '';
    carregarDados();
}

/* ================================================================
   PAINEL — limpar banco de dados
   ================================================================ */

function limparBanco() {
    if (confirm('Tem certeza que deseja apagar todo o histórico de marmitas?')) {
        dbDelete();
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

    const totalMarmitas = dadosAtuaisNaTabela.reduce(
        (acc, p) => acc + parseInt(p.quantidade || 0), 0
    );
    const totalRegistros = dadosAtuaisNaTabela.length;

    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const horaFormatada = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit', minute: '2-digit'
    });

    document.getElementById('pdf-data-geracao').textContent =
        `Emitido em ${dataFormatada} às ${horaFormatada}`;
    document.getElementById('pdf-total-label').textContent =
        `🍱 ${totalMarmitas} marmitas · ${totalRegistros} registros`;

    // Garante que o logo está injetado no cabeçalho PDF
    document.querySelectorAll('img.logo-img').forEach(img => {
        img.src = LOGO_OILEMA;
    });

    window.print();
}
