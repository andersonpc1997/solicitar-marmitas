/**
 * database.js — Oilema Sementes
 * Firebase Realtime Database: pedidos + usuários
 */

firebase.initializeApp(FIREBASE_CONFIG);
const _db        = firebase.database();
const _REF       = 'pedidosMarmita';
const _USERS_REF = 'usuarios';

/* ================================================================
   PEDIDOS
   ================================================================ */
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

/* ================================================================
   USUÁRIOS
   ================================================================ */
async function dbGetUsuarios() {
    try {
        const snap = await _db.ref(_USERS_REF).get();
        if (!snap.exists()) return [];
        return Object.entries(snap.val()).map(([id, v]) => ({ id, ...v }));
    } catch (e) { console.error('[DB] dbGetUsuarios:', e); return []; }
}

async function dbCriarUsuario(dados) {
    try {
        const ref = await _db.ref(_USERS_REF).push(dados);
        return ref.key;
    } catch (e) { console.error('[DB] dbCriarUsuario:', e); return null; }
}

async function dbAtualizarUsuario(id, dados) {
    try { await _db.ref(`${_USERS_REF}/${id}`).update(dados); return true; }
    catch (e) { console.error('[DB] dbAtualizarUsuario:', e); return false; }
}

async function dbDeletarUsuario(id) {
    try { await _db.ref(`${_USERS_REF}/${id}`).remove(); return true; }
    catch (e) { console.error('[DB] dbDeletarUsuario:', e); return false; }
}
