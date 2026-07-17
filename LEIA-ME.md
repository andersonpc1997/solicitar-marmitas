# Oilema Sementes — Controle de Marmitas
## Guia de Implantação e Funcionamento

---

## Estrutura de arquivos

```
/
├── index.html                  ← Página única (todas as views)
├── favicon.svg
├── css/
│   └── styles.css              ← Estilos globais + responsivo + impressão
├── js/
│   ├── device.js               ← Detecção automática de dispositivo (NOVO)
│   ├── app.js                  ← Lógica principal (formulário, painel, PDF)
│   ├── ui.js                   ← Navegação entre views + atualização de barras
│   ├── auth.js                 ← Login, logout, sessão (SHA-256)
│   ├── admin.js                ← Painel administrativo
│   └── database.js             ← Firebase Realtime Database
└── assets/
    ├── firebase-config.js      ← Configuração do Firebase (NÃO publicar sem regras)
    └── logo.js                 ← Logo Oilema em base64
```

---

## Detecção automática de dispositivo

O arquivo `js/device.js` detecta automaticamente o tipo de dispositivo ao carregar a página e adiciona uma classe no elemento `<html>`:

| Dispositivo  | Classe aplicada     | Largura típica |
|--------------|---------------------|----------------|
| Celular      | `device-mobile`     | < 600px        |
| Tablet       | `device-tablet`     | 600px – 1024px |
| Computador   | `device-desktop`    | > 1024px       |

Além da largura de tela, o sistema também analisa o **User Agent** do navegador, então um tablet acessando em modo desktop é identificado corretamente.

### Layout por dispositivo

**Celular (mobile):**
- Topbar compacta — só logo e avatar
- Navegação inferior fixa (bottom nav) com ícones: Pedido / Painel / Admin / Sair
- Formulários em coluna única
- Tabela do painel vira cards empilhados com rótulos
- Botões grandes para toque fácil

**Tablet:**
- Topbar completa mas condensada
- Bottom nav ativa
- Grid de 2 colunas nos formulários

**Computador (desktop):**
- Topbar completa com nome do usuário, cargo e botões de navegação
- Sem bottom nav
- Grid de 2 colunas nos formulários
- Tabela tradicional no painel

### Modo debug (apenas para testes)

Acesse `?debug=device` na URL para ver um badge no canto da tela com o tipo detectado e resolução:

```
https://seu-site.github.io/?debug=device
```

---

## Primeiro acesso

Na primeira vez que o sistema for acessado, um usuário admin padrão é criado automaticamente:

| Campo  | Valor      |
|--------|------------|
| Login  | `admin`    |
| Senha  | `admin123` |

**⚠️ Troque a senha imediatamente após o primeiro acesso!**

Acesse: **⚙️ Admin → Usuários → Alterar Senha**

---

## Perfis de acesso

| Perfil        | Solicitar marmita | Ver painel | Painel Admin |
|---------------|:-----------------:|:----------:|:------------:|
| 👤 Usuário    | ✅                | ✅         | ❌           |
| 🔑 Admin      | ✅                | ✅         | ✅           |

---

## Firebase — Regras de segurança recomendadas

Configure as regras no Console do Firebase para proteger os dados:

```json
{
  "rules": {
    "pedidosMarmita": {
      ".read":  "auth != null",
      ".write": "auth != null"
    },
    "usuarios": {
      ".read":  "auth != null",
      ".write": "auth != null"
    }
  }
}
```

> **Nota:** O sistema usa autenticação própria (login/senha + sessionStorage), não o Firebase Auth. As regras acima são uma camada extra de proteção no banco.

---

## Implantação no GitHub Pages

1. Faça push de todos os arquivos para o repositório
2. Acesse: **Settings → Pages → Source: Deploy from branch → main**
3. O site ficará disponível em: `https://seu-usuario.github.io/nome-do-repo/`

---

## Novidades desta versão

- ✅ **Detecção automática de dispositivo** (mobile / tablet / desktop)
- ✅ **Bottom navigation** no celular e tablet
- ✅ **Topbar modernizada** com chip de usuário
- ✅ **Stats bar** no painel (marmitas hoje, registros, período)
- ✅ **Cards de tabela** no mobile com rótulos e destaque na primeira linha
- ✅ **Botão +/−** para quantidade de marmitas (mais fácil no celular)
- ✅ **Botão ver/ocultar senha** nos campos de senha
- ✅ **Feedback tátil** (vibração) nos botões em dispositivos móveis
- ✅ **iOS zoom fix** — inputs com font-size ≥ 16px para evitar zoom automático
