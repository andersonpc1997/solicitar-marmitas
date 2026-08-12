/**
 * app.js — Oilema Sementes
 * Lógica principal:
 *  - Formulário de solicitação (view-index)
 *  - Painel em tempo real com Firebase listener
 *  - Filtros por cooperado e por data
 *  - Stats bar (total hoje, registros, período)
 *  - Edição e exclusão individual de registros
 *  - Geração de PDF via window.print()
 */

/* ================================================================
   MODAL DE EDIÇÃO — funções globais
   ================================================================ */

let dadosAtuaisNaTabela = [];
let _pedidoEditandoIndex = null;

function abrirModalEdicao(index) {
    const p = dadosAtuaisNaTabela[index];
    if (!p) return;
    _pedidoEditandoIndex = index;

    document.getElementById('editDataHora').value  = p.dataHoraExibicao || '';
    document.getElementById('editNome').value      = p.nome      || '';
    document.getElementById('editPlaca').value     = p.placa     || '';
    document.getElementById('editCooperado').value = p.cooperado || '';
    document.getElementById('editFazenda').value   = p.fazenda   || '';
    document.getElementById('editQtd').value       = p.quantidade || 1;

    document.getElementById('modalEdicao').style.display = 'flex';
    document.getElementById('editNome').focus();
}

function fecharModalEdicao() {
    document.getElementById('modalEdicao').style.display = 'none';
    _pedidoEditandoIndex = null;
}

async function salvarEdicao() {
    if (_pedidoEditandoIndex === null) return;

    const btnSalvar = document.getElementById('btnSalvarEdicao');
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
        const todosPedidos = await dbGet();
        const alvo = dadosAtuaisNaTabela[_pedidoEditandoIndex];

        // Localiza no array completo pelo triplo placa+data+nome
        const idxReal = todosPedidos.findIndex(
            p => p.placa === alvo.placa && p.dataISO === alvo.dataISO && p.nome === alvo.nome
        );

        if (idxReal === -1) {
            alert('Registro não encontrado. Pode ter sido alterado em outro dispositivo.');
            fecharModalEdicao();
            return;
        }

        todosPedidos[idxReal] = {
            ...todosPedidos[idxReal],
            dataHoraExibicao: document.getElementById('editDataHora').value.trim(),
            nome:             document.getElementById('editNome').value.toUpperCase().trim(),
            placa:            document.getElementById('editPlaca').value.toUpperCase().trim(),
            cooperado:        document.getElementById('editCooperado').value.toUpperCase().trim(),
            fazenda:          document.getElementById('editFazenda').value.toUpperCase().trim(),
            quantidade:       parseInt(document.getElementById('editQtd').value) || 1,
        };

        await dbSet(todosPedidos);
        fecharModalEdicao();
        // Listener Firebase atualiza a tabela automaticamente

    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = '✅ Salvar';
    }
}

async function excluirRegistro(index) {
    const p = dadosAtuaisNaTabela[index];
    if (!p) return;

    const confirmado = confirm(
        'Excluir este registro?\n\n' +
        'Motorista: ' + p.nome + '\n' +
        'Placa: ' + p.placa + '\n' +
        'Data: ' + p.dataHoraExibicao + '\n' +
        'Qtd: ' + p.quantidade + ' marmita(s)'
    );
    if (!confirmado) return;

    const todosPedidos = await dbGet();
    const idxReal = todosPedidos.findIndex(
        p2 => p2.placa === p.placa && p2.dataISO === p.dataISO && p2.nome === p.nome
    );

    if (idxReal === -1) {
        alert('Registro não encontrado. Pode já ter sido excluído.');
        return;
    }

    todosPedidos.splice(idxReal, 1);
    await dbSet(todosPedidos);
    // Listener Firebase atualiza automaticamente
}

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
        const btnSubmit    = form.querySelector('.btn-submit-form');

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

            const nome      = document.getElementById('nomeMotorista').value.toUpperCase().trim();
            const cooperado = document.getElementById('nomeCooperado').value.toUpperCase().trim();
            const fazenda   = document.getElementById('nomeFazenda').value.toUpperCase().trim();
            const quantidade = parseInt(document.getElementById('quantidadeMarmitas').value) || 1;
            const dataHoraExibicao =
                agora.toLocaleDateString('pt-BR') + ' - ' +
                agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const solicitante = getUsuarioLogado()?.nomeExibicao || '—';

            pedidos.unshift({ dataHoraExibicao, dataISO, nome, placa, cooperado, fazenda, quantidade, solicitante });
            await dbSet(pedidos);

            msgSucesso.style.display = 'block';
            form.reset();
            document.getElementById('quantidadeMarmitas').value = '1';
            setTimeout(() => { msgSucesso.style.display = 'none'; }, 3500);

        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '🍱 Registrar Solicitação';
        }
    });
});

/* ================================================================
   PAINEL — listener em tempo real + filtros
   ================================================================ */

function iniciarPainel() {
    document.getElementById('listaSolicitacoes').innerHTML =
        '<tr><td colspan="8" class="empty-state">Carregando dados...</td></tr>';

    return dbEscutar(pedidos => {
        const termoCooperado = document.getElementById('filtroCooperado')?.value.trim().toUpperCase();
        const dataInicio     = document.getElementById('dataInicio')?.value;
        const dataFim        = document.getElementById('dataFim')?.value;

        if (termoCooperado || dataInicio || dataFim) {
            renderizarTabela(filtrarPedidos(pedidos, termoCooperado, dataInicio, dataFim));
        } else {
            renderizarTabela(pedidos);
        }
    });
}

function renderizarTabela(pedidos) {
    const tbody = document.getElementById('listaSolicitacoes');
    if (!tbody) return;

    dadosAtuaisNaTabela = pedidos;
    _atualizarStats(pedidos);

    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma solicitação encontrada.</td></tr>';
        return;
    }

    tbody.innerHTML = pedidos.map((p, i) => `
        <tr>
            <td data-label="Data/Hora">${p.dataHoraExibicao}</td>
            <td data-label="Motorista"><strong>${p.nome}</strong></td>
            <td data-label="Placa">${p.placa}</td>
            <td data-label="Cooperado">${p.cooperado}</td>
            <td data-label="Fazenda">${p.fazenda}</td>
            <td data-label="Qtd"><span class="badge-qty">${p.quantidade}</span></td>
            <td data-label="Solicitante">${p.solicitante || '—'}</td>
            <td data-label="Ações" class="td-acoes">
                <button class="btn-row-edit"  onclick="abrirModalEdicao(${i})" title="Editar">✏️</button>
                <button class="btn-row-del"   onclick="excluirRegistro(${i})"  title="Excluir">🗑️</button>
            </td>
        </tr>
    `).join('');
}

/* ================================================================
   STATS BAR
   ================================================================ */

function _atualizarStats(pedidos) {
    const hoje = new Date().toISOString().split('T')[0];
    const totalMarmitas  = pedidos.reduce((acc, p) => acc + parseInt(p.quantidade || 0), 0);
    const pedidosHoje    = pedidos.filter(p => p.dataISO === hoje);
    const marmirasHoje   = pedidosHoje.reduce((acc, p) => acc + parseInt(p.quantidade || 0), 0);

    let periodo = '—';
    if (pedidos.length > 0) {
        const datas    = pedidos.map(p => p.dataISO).filter(Boolean).sort();
        const primeira = datas[0];
        const ultima   = datas[datas.length - 1];
        periodo = primeira === ultima
            ? _formatarData(primeira)
            : _formatarData(primeira) + ' – ' + _formatarData(ultima);
    }

    const elTotal     = document.getElementById('statTotal');
    const elRegistros = document.getElementById('statRegistros');
    const elPeriodo   = document.getElementById('statPeriodo');
    if (elTotal)     elTotal.textContent     = marmirasHoje || totalMarmitas;
    if (elRegistros) elRegistros.textContent = pedidos.length;
    if (elPeriodo)   elPeriodo.textContent   = periodo;
}

function _formatarData(iso) {
    if (!iso) return '—';
    const [a, m, d] = iso.split('-');
    return d + '/' + m + '/' + a;
}

/* ================================================================
   PAINEL — filtros
   ================================================================ */

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

async function aplicarFiltros() {
    const termoCooperado = document.getElementById('filtroCooperado').value.trim().toUpperCase();
    const dataInicio     = document.getElementById('dataInicio').value;
    const dataFim        = document.getElementById('dataFim').value;

    if (!termoCooperado && !dataInicio && !dataFim) {
        alert('Por favor, preencha pelo menos um campo para filtrar.');
        return;
    }
    const pedidos = await dbGet();
    renderizarTabela(filtrarPedidos(pedidos, termoCooperado, dataInicio, dataFim));
}

function limparFiltro() {
    const coop = document.getElementById('filtroCooperado');
    const ini  = document.getElementById('dataInicio');
    const fim  = document.getElementById('dataFim');
    if (coop) coop.value = '';
    if (ini)  ini.value  = '';
    if (fim)  fim.value  = '';
}

async function limparBanco() {
    if (confirm('Tem certeza que deseja apagar todo o histórico?')) {
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

    const elData  = document.getElementById('pdf-data-geracao');
    const elTotal = document.getElementById('pdf-total-label');
    if (elData)  elData.textContent  = 'Emitido em ' + agora.toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' }) + ' às ' + agora.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
    if (elTotal) elTotal.textContent = '🍱 ' + totalMarmitas + ' marmitas · ' + totalRegistros + ' registros';

    document.querySelectorAll('img.logo-img').forEach(img => { img.src = LOGO_OILEMA; });
    window.print();
}
