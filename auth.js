/**
 * auth.js — Oilema Sementes
 * Autenticação com sessionStorage + SHA-256 (Web Crypto API)
 */

const _SESSION_KEY = 'oilema_user';
const _SALT        = 'oilema_sementes_2025';

/* ── Hash de senha ─────────────────────────────────────────── */
async function hashSenha(senha) {
    const encoder = new TextEncoder();
    const data    = encoder.encode(senha + _SALT);
    const buffer  = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Inicialização: cria admin padrão se não houver usuários ── */
async function inicializarSistema() {
    const usuarios = await dbGetUsuarios();
    if (usuarios.length === 0) {
        const senhaHash = await hashSenha('admin123');
        await dbCriarUsuario({
            nome:      'Administrador',
            login:     'admin',
            senhaHash,
            role:      'admin',
            ativo:     true,
            criadoEm:  new Date().toISOString()
        });
        console.info('[Auth] Admin padrão criado: admin / admin123');
    }
}

/* ── Login ─────────────────────────────────────────────────── */
async function fazerLogin(login, senha) {
    const usuarios = await dbGetUsuarios();
    const usuario  = usuarios.find(
        u => u.login.toLowerCase() === login.toLowerCase().trim() && u.ativo
    );
    if (!usuario) return { sucesso: false, erro: 'Usuário não encontrado ou inativo.' };

    const hash = await hashSenha(senha);
    if (hash !== usuario.senhaHash) return { sucesso: false, erro: 'Senha incorreta.' };

    const sessao = { id: usuario.id, nome: usuario.nome, login: usuario.login, role: usuario.role };
    sessionStorage.setItem(_SESSION_KEY, JSON.stringify(sessao));
    return { sucesso: true, usuario: sessao };
}

/* ── Logout ────────────────────────────────────────────────── */
function fazerLogout() {
    sessionStorage.removeItem(_SESSION_KEY);
    mostrarView('login');
}

/* ── Getters ───────────────────────────────────────────────── */
function getUsuarioLogado() {
    try { return JSON.parse(sessionStorage.getItem(_SESSION_KEY)); }
    catch { return null; }
}

function isAdmin() {
    const u = getUsuarioLogado();
    return u && u.role === 'admin';
}

/* ── Guarda de rota ────────────────────────────────────────── */
function verificarAuth(apenasAdmin = false) {
    const u = getUsuarioLogado();
    if (!u) { mostrarView('login'); return false; }
    if (apenasAdmin && u.role !== 'admin') {
        alert('Acesso restrito a administradores.');
        mostrarView('index');
        return false;
    }
    return true;
}
