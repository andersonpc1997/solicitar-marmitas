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
        const snap = await _db.ref(_REF).get();
        if (!snap.exists()) return [];
        const d = snap.val();
        return Array.isArray(d) ? d : Object.values(d);
    } catch (e) { console.error('[DB] dbGet:', e); return []; }
}

async function dbSet(pedidos) {
    try { await _db.ref(_REF).set(pedidos); return true; }
    catch (e) { console.error('[DB] dbSet:', e); return false; }
}

async function dbDelete() {
    try { await _db.ref(_REF).remove(); return true; }
    catch (e) { console.error('[DB] dbDelete:', e); return false; }
}

function dbEscutar(callback) {
    const ref = _db.ref(_REF);
    ref.on('value', snap => {
        let pedidos = [];
        if (snap.exists()) {
            const d = snap.val();
            pedidos = Array.isArray(d) ? d : Object.values(d);
        }
        callback(pedidos);
    }, err => { console.error('[DB] listener:', err); callback([]); });
    return () => ref.off('value');
}

/* ── PRÉ-CADASTRO DE VEÍCULOS ────────────────────────── */
async function dbGetVeiculos() {
    try {
        const snap = await _db.ref(_VEIC_REF).get();
        if (!snap.exists()) return {};
        return snap.val();
    } catch (e) { console.error('[DB] dbGetVeiculos:', e); return {}; }
}

async function dbSalvarVeiculo(placa, dados) {
    try {
        await _db.ref(`${_VEIC_REF}/${placa}`).set({ ...dados, atualizadoEm: new Date().toISOString() });
        return true;
    } catch (e) { console.error('[DB] dbSalvarVeiculo:', e); return false; }
}

/* ── COMPATIBILIDADE (usuários) ──────────────────────── */
async function dbGetUsuarios() { return []; }
async function dbCriarUsuario() { return null; }
async function dbAtualizarUsuario() { return false; }
async function dbDeletarUsuario() { return false; }
