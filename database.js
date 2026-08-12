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
        return Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v }));
    } catch (e) { console.error('[DB] dbGetUsuarios:', e); return []; }
}

function dbEscutarUsuarios(callback) {
    const ref = _db.ref(_USERS_REF);
    ref.on('value', snap => {
        if (!snap.exists()) { callback([]); return; }
        const lista = Object.entries(snap.val()).map(([uid, v]) => ({ uid, ...v }));
        callback(lista);
    }, err => { console.error('[DB] escutarUsuarios:', err); callback([]); });
    return () => ref.off('value');
}

async function dbDeletarUsuario(uid) {
    try { await _db.ref(`${_USERS_REF}/${uid}`).remove(); return true; }
    catch (e) { console.error('[DB] dbDeletarUsuario:', e); return false; }
}
