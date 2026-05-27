/**
 * database.js
 * Oilema Sementes — Controle de Marmitas
 *
 * Camada de persistência usando localStorage.
 * Todas as funções retornam valores diretos (compatíveis com await).
 */

const DB_KEY = 'pedidosMarmita';

/**
 * Retorna todos os pedidos salvos.
 * @returns {Array} lista de pedidos
 */
function dbGet() {
    try {
        const raw = localStorage.getItem(DB_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('[DB] Erro ao ler dados:', e);
        return [];
    }
}

/**
 * Salva a lista completa de pedidos.
 * @param {Array} pedidos
 * @returns {boolean} sucesso
 */
function dbSet(pedidos) {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(pedidos));
        return true;
    } catch (e) {
        console.error('[DB] Erro ao salvar dados:', e);
        return false;
    }
}

/**
 * Apaga todos os pedidos do banco.
 * @returns {boolean} sucesso
 */
function dbDelete() {
    try {
        localStorage.removeItem(DB_KEY);
        return true;
    } catch (e) {
        console.error('[DB] Erro ao excluir dados:', e);
        return false;
    }
}
