# Oilema Sementes — Controle de Marmitas
## Guia de Configuração do Firebase

> **Por que o Firebase?**  
> O `localStorage` (versão anterior) salva dados **apenas no navegador local**.  
> O Firebase salva na nuvem e sincroniza entre **todas as máquinas em tempo real**.

---

## PASSO 1 — Criar conta no Firebase

1. Acesse **https://console.firebase.google.com**
2. Faça login com uma conta Google (pode ser a conta da empresa)
3. Clique em **"Adicionar projeto"**
4. Dê um nome ao projeto, ex: `oilema-marmitas`
5. Desative o Google Analytics (opcional) → clique em **"Criar projeto"**

---

## PASSO 2 — Criar o Realtime Database

1. No menu lateral, clique em **"Criação" → "Realtime Database"**
2. Clique em **"Criar banco de dados"**
3. Escolha o servidor mais próximo: **`us-central1`** ou **`southamerica-east1`** (São Paulo)
4. Em "Regras de segurança", selecione **"Iniciar no modo de teste"** → Ativar

> ⚠️ O modo de teste expira em 30 dias. Após isso, atualize as regras (veja o Passo 5).

---

## PASSO 3 — Obter as credenciais do projeto

1. No menu lateral, clique em ⚙️ **"Configurações do projeto"**
2. Role até a seção **"Seus aplicativos"**
3. Clique no ícone **`</>`** (Web)
4. Dê um apelido ao app, ex: `marmitas-web` → clique em **"Registrar app"**
5. O Firebase exibirá um bloco de código com `firebaseConfig`. Copie os valores.

---

## PASSO 4 — Preencher o arquivo `assets/firebase-config.js`

Abra o arquivo `assets/firebase-config.js` e substitua os placeholders:

```js
const FIREBASE_CONFIG = {
    apiKey:            "AIzaSy...",           // ← cole aqui
    authDomain:        "oilema-marmitas.firebaseapp.com",
    databaseURL:       "https://oilema-marmitas-default-rtdb.firebaseio.com",
    projectId:         "oilema-marmitas",
    storageBucket:     "oilema-marmitas.appspot.com",
    messagingSenderId: "123456789",
    appId:             "1:123456789:web:abc..."
};
```

---

## PASSO 5 — Regras de segurança do banco (após 30 dias)

No console Firebase → Realtime Database → **"Regras"**, cole:

```json
{
  "rules": {
    "pedidosMarmita": {
      ".read": true,
      ".write": true
    }
  }
}
```

Clique em **"Publicar"**.

---

## PASSO 6 — Publicar no GitHub Pages

1. Envie todos os arquivos para um repositório GitHub
2. No repositório → **Settings → Pages**
3. Em "Branch", selecione `main` e pasta `/root` → **Save**
4. O site estará disponível em `https://seu-usuario.github.io/nome-do-repositorio`

---

## Estrutura de arquivos

```
oilema-marmitas/
├── index.html               ← Página principal
├── favicon.svg              ← Ícone do site (marmita)
├── LEIA-ME.md               ← Este guia
├── css/
│   └── styles.css           ← Estilos + impressão PDF
├── js/
│   ├── database.js          ← Banco de dados Firebase (não editar)
│   ├── ui.js                ← Navegação entre telas (não editar)
│   └── app.js               ← Lógica do sistema (não editar)
└── assets/
    ├── firebase-config.js   ← ⚠️ EDITE ESTE ARQUIVO com suas credenciais
    └── logo.js              ← Logo Oilema em base64 (não editar)
```

---

## Como funciona agora

| Situação | Antes (localStorage) | Agora (Firebase) |
|---|---|---|
| Solicitação de outra máquina | ❌ Não aparece no painel | ✅ Aparece em tempo real |
| Painel atualiza automaticamente | ❌ Requer F5 | ✅ Atualiza sozinho |
| Dados ao trocar de navegador | ❌ Perdidos | ✅ Mantidos na nuvem |
| Funciona offline | ✅ Sim | ❌ Requer internet |

---

## Suporte

Dúvidas sobre configuração: consulte a documentação oficial em  
**https://firebase.google.com/docs/database/web/start**
