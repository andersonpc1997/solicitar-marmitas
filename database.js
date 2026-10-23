/**
 * database.js — Oilema Sementes
 * Firebase: pedidos + pré-cadastro de veículos
 */

firebase.initializeApp(FIREBASE_CONFIG);
const _db        = firebase.database();
const _REF       = 'pedidosMarmita';
const _VEIC_REF  = 'veiculos';

/* ── PEDIDOS ─────────────────────────────────────────── */
async function dbGet() {
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
        const snap = await Promise.race([_db.ref(_REF).get(), timeout]);
        if (!snap || !snap.exists()) return [];
        const d = snap.val();
        const lista = Array.isArray(d) ? d : Object.values(d);
        try { localStorage.setItem('pedidos_cache', JSON.stringify(lista)); } catch(_) {}
        return lista;
    } catch (e) {
        console.warn('[DB] dbGet usando fallback:', e);
        try {
            const cache = localStorage.getItem('pedidos_cache');
            if (cache) return JSON.parse(cache);
        } catch(_) {}
        return [];
    }
}

async function dbSet(pedidos) {
    try {
        try { localStorage.setItem('pedidos_cache', JSON.stringify(pedidos)); } catch(_) {}
        await _db.ref(_REF).set(pedidos);
        return true;
    } catch (e) { console.error('[DB] dbSet:', e); return false; }
}

async function dbDelete() {
    try {
        try { localStorage.removeItem('pedidos_cache'); } catch(_) {}
        await _db.ref(_REF).remove();
        return true;
    } catch (e) { console.error('[DB] dbDelete:', e); return false; }
}

function dbEscutar(callback) {
    const ref = _db.ref(_REF);
    try {
        const cache = localStorage.getItem('pedidos_cache');
        if (cache) callback(JSON.parse(cache));
    } catch(_) {}

    ref.on('value', snap => {
        let pedidos = [];
        if (snap && snap.exists()) {
            const d = snap.val();
            pedidos = Array.isArray(d) ? d : Object.values(d);
        }
        try { localStorage.setItem('pedidos_cache', JSON.stringify(pedidos)); } catch(_) {}
        callback(pedidos);
    }, err => {
        console.error('[DB] listener:', err);
    });
    return () => ref.off('value');
}

/* ── PRÉ-CADASTRO DE VEÍCULOS ────────────────────────── */
async function dbGetVeiculos() {
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
        const snap = await Promise.race([_db.ref(_VEIC_REF).get(), timeout]);
        if (!snap || !snap.exists()) return {};
        return snap.val();
    } catch (e) { return {}; }
}

async function dbSalvarVeiculo(placa, dados) {
    try {
        await _db.ref(`${_VEIC_REF}/${placa}`).set({ ...dados, atualizadoEm: new Date().toISOString() });
        return true;
    } catch (e) { return false; }
}

/* ── COMPATIBILIDADE (usuários) ──────────────────────── */
async function dbGetUsuarios() { return []; }
async function dbCriarUsuario() { return null; }
async function dbAtualizarUsuario() { return false; }
async function dbDeletarUsuario() { return false; }

/* ── RESPONSÁVEIS (cache de nomes) ───────────────────── */
const _RESP_REF = 'responsaveis';

async function dbGetResponsaveis() {
    try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
        const snap = await Promise.race([_db.ref(_RESP_REF).get(), timeout]);
        if (!snap || !snap.exists()) return [];
        const d = snap.val();
        return Array.isArray(d) ? d : Object.values(d);
    } catch (e) { return []; }
}

async function dbSalvarResponsaveis(lista) {
    try { await _db.ref(_RESP_REF).set(lista); return true; }
    catch (e) { return false; }
}
