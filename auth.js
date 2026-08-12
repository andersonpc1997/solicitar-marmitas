/**
 * auth.js — Oilema Sementes
 * Autenticação por nome de usuário (convertido para e-mail fictício internamente).
 * O Admin (usuario: "admin", senha: "123") é criado automaticamente na 1ª execução.
 */

const _AUTH         = firebase.auth();
const _DOMINIO      = '@oilema.local';
const _ADMIN_USER   = 'admin';
const _ADMIN_SENHA  = '123';
const _ADMIN_EMAIL  = _ADMIN_USER + _DOMINIO;

/* Estado global do usuário logado */
let _usuarioLogado = null; // { uid, usuario, nomeExibicao, papel }

/* ── Converte nome de usuário para e-mail fictício ──────────── */
function _toEmail(usuario) {
    return usuario.toLowerCase().trim() + _DOMINIO;
}

/* ── Retorna o usuário atualmente logado ────────────────────── */
function getUsuarioLogado() {
    return _usuarioLogado;
}

/* ── Login ──────────────────────────────────────────────────── */
async function fazerLogin(usuario, senha) {
    const email = _toEmail(usuario);
    try {
        await _AUTH.signInWithEmailAndPassword(email, senha);
        // onAuthStateChanged cuida do resto
    } catch (e) {
        const mensagens = {
            'auth/user-not-found':   'Usuário não encontrado.',
            'auth/wrong-password':   'Senha incorreta.',
            'auth/invalid-email':    'Usuário inválido.',
            'auth/too-many-requests':'Muitas tentativas. Tente novamente em instantes.',
        };
        throw new Error(mensagens[e.code] || 'Erro ao fazer login: ' + e.message);
    }
}

/* ── Logout ─────────────────────────────────────────────────── */
async function fazerLogout() {
    await _AUTH.signOut();
}

/* ── Cria usuário pelo Admin ────────────────────────────────── */
async function criarNovoUsuario(usuario, senha, nomeExibicao) {
    // Usa segunda instância do Firebase para não deslogar o Admin
    const appSecundario = firebase.initializeApp(FIREBASE_CONFIG, 'criacao_temp_' + Date.now());
    try {
        const authSecundario = appSecundario.auth();
        const cred = await authSecundario.createUserWithEmailAndPassword(_toEmail(usuario), senha);
        const uid  = cred.user.uid;
        await authSecundario.signOut();

        // Salva perfil no banco de dados
        await _db.ref('usuarios/' + uid).set({
            usuario:       usuario.toLowerCase().trim(),
            nomeExibicao:  nomeExibicao.trim(),
            papel:         'usuario',
            criadoEm:      new Date().toISOString(),
        });

        return uid;
    } finally {
        await appSecundario.delete();
    }
}

/* ── Exclui usuário ─────────────────────────────────────────── */
async function excluirUsuarioDb(uid) {
    await _db.ref('usuarios/' + uid).remove();
    // Nota: a conta no Auth só pode ser excluída via Admin SDK (servidor).
    // No client-side, removemos do banco de dados. A conta fica inativa
    // pois não terá mais acesso ao perfil.
}

/* ── Garante que o Admin existe na 1ª execução ──────────────── */
async function _garantirAdmin() {
    try {
        await _AUTH.signInWithEmailAndPassword(_ADMIN_EMAIL, _ADMIN_SENHA);
        // Admin já existe — faz logout imediatamente (não queremos estar logado)
        await _AUTH.signOut();
    } catch (e) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
            // Cria o Admin
            try {
                const cred = await _AUTH.createUserWithEmailAndPassword(_ADMIN_EMAIL, _ADMIN_SENHA);
                const uid  = cred.user.uid;
                await _db.ref('usuarios/' + uid).set({
                    usuario:      _ADMIN_USER,
                    nomeExibicao: 'Administrador',
                    papel:        'admin',
                    criadoEm:     new Date().toISOString(),
                });
                await _AUTH.signOut();
                console.log('[Auth] Usuário Admin criado com sucesso.');
            } catch (err) {
                console.warn('[Auth] Não foi possível criar o Admin:', err.message);
            }
        }
        // Outros erros (ex: sem conexão) são ignorados silenciosamente
    }
}

/* ── Listener principal de autenticação ─────────────────────── */
_AUTH.onAuthStateChanged(async (firebaseUser) => {
    if (firebaseUser) {
        // Busca perfil no banco de dados
        const snap = await _db.ref('usuarios/' + firebaseUser.uid).get();
        if (snap.exists()) {
            _usuarioLogado = { uid: firebaseUser.uid, ...snap.val() };
        } else {
            // Perfil não encontrado — desloga
            await _AUTH.signOut();
            return;
        }
        _aoLogar(_usuarioLogado);
    } else {
        _usuarioLogado = null;
        _aoDeslogar();
    }
});

/* ── Callbacks de navegação (implementadas em ui.js) ─────────── */
function _aoLogar(usuario) {
    // Exibe nome do usuário na topbar
    document.querySelectorAll('.user-chip-nome').forEach(el => {
        el.textContent = usuario.nomeExibicao;
    });

    // Mostra/oculta botões de Admin
    const isAdmin = usuario.papel === 'admin';
    document.querySelectorAll('.btn-nav-admin').forEach(el => {
        el.style.display = isAdmin ? '' : 'none';
    });

    // Mostra a view inicial (index)
    if (typeof mostrarView === 'function') mostrarView('index');
}

function _aoDeslogar() {
    // Volta para a tela de login
    if (typeof mostrarViewLogin === 'function') mostrarViewLogin();
}

/* ── Inicialização: garante Admin e mostra tela de login ─────── */
document.addEventListener('DOMContentLoaded', async () => {
    // Tela de login visível por padrão (as outras ficam ocultas)
    if (typeof mostrarViewLogin === 'function') mostrarViewLogin();

    // Garante que o Admin existe (executa em background)
    _garantirAdmin().catch(() => {});
});
