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
    }, err => {
        console.error('[DB] listener erro:', err.code, err.message);
        _mostrarErroDB(err);
        callback([]);
    });
    return () => ref.off('value');
}

function _mostrarErroDB(err) {
    // Mostra mensagem de erro visível na interface
    const msgs = document.querySelectorAll('.empty-state');
    const codigo = err?.code || 'ERRO';
    let texto = '⚠️ Erro ao conectar com o banco de dados.';

    if (codigo === 'PERMISSION_DENIED') {
        texto = '🔒 Acesso negado ao Firebase. Verifique as regras de segurança do banco.';
    } else if (codigo === 'NETWORK_ERROR' || !navigator.onLine) {
        texto = '📡 Sem conexão com a internet. Verifique sua rede.';
    }

    msgs.forEach(el => { el.textContent = texto; });

    // Mostra também um banner no topo da view ativa
    let banner = document.getElementById('banner-erro-db');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'banner-erro-db';
        banner.style.cssText = 'position:fixed;top:64px;left:0;right:0;z-index:999;background:#fce8e6;color:#c5221f;padding:12px 20px;font-weight:700;font-size:13px;text-align:center;border-bottom:2px solid #ef9a9a;';
        document.body.appendChild(banner);
    }
    banner.textContent = texto + ' (código: ' + codigo + ')';
    banner.style.display = 'block';
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
