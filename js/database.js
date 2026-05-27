/**
 * database.js
 * Oilema Sementes — Controle de Marmitas
 *
 * Banco de dados em nuvem via Firebase Realtime Database.
 * Dados compartilhados entre TODOS os dispositivos em tempo real.
 *
 * Depende de:
 *   - assets/firebase-config.js  (credenciais do projeto)
 *   - SDK Firebase (carregado no index.html)
 */

// ── Inicialização ────────────────────────────────────────────────
firebase.initializeApp(FIREBASE_CONFIG);

const _db    = firebase.database();
const _REF   = 'pedidosMarmita';

// ── Funções de acesso ────────────────────────────────────────────

/**
 * Busca todos os pedidos (consulta única).
 * @returns {Promise<Array>}
 */
async function dbGet() {
    try {
        const snapshot = await _db.ref(_REF).get();
        if (!snapshot.exists()) return [];
        const data = snapshot.val();
        // Firebase pode retornar objeto com índices numéricos
        return Array.isArray(data) ? data : Object.values(data);
    } catch (e) {
        console.error('[DB] Erro ao ler:', e);
        return [];
    }
}

/**
 * Salva a lista completa de pedidos.
 * @param {Array} pedidos
 * @returns {Promise<boolean>}
 */
async function dbSet(pedidos) {
    try {
        await _db.ref(_REF).set(pedidos);
        return true;
    } catch (e) {
        console.error('[DB] Erro ao salvar:', e);
        return false;
    }
}

/**
 * Apaga todos os pedidos do banco.
 * @returns {Promise<boolean>}
 */
async function dbDelete() {
    try {
        await _db.ref(_REF).remove();
        return true;
    } catch (e) {
        console.error('[DB] Erro ao excluir:', e);
        return false;
    }
}

/**
 * Escuta mudanças em tempo real no banco.
 * Chama o callback sempre que os dados mudam (qualquer máquina).
 *
 * @param {function(Array): void} callback
 * @returns {function} função para cancelar o listener
 */
function dbEscutar(callback) {
    const ref = _db.ref(_REF);

    const handler = ref.on('value', snapshot => {
        let pedidos = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            pedidos = Array.isArray(data) ? data : Object.values(data);
        }
        callback(pedidos);
    }, err => {
        console.error('[DB] Erro no listener:', err);
        callback([]);
    });

    // Retorna função de cancelamento
    return () => ref.off('value', handler);
}
