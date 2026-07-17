/**
 * admin.js — Oilema Sementes
 * Lógica da página de administração (sem autenticação de usuários)
 */

/* ── Carrega a página admin ──────────────────────────────── */
async function carregarPaginaAdmin() {
    // sem gerenciamento de usuários — apenas manutenção
}

/* ── Limpar histórico ────────────────────────────────────── */
async function limparHistoricoAdmin() {
    if (!confirm('Apagar TODO o histórico de marmitas?\nEsta ação é irreversível.')) return;
    await dbDelete();
    alert('✅ Histórico apagado com sucesso.');
}
