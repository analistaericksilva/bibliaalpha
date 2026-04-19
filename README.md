# Bíblia Alpha de Estudos

App web de leitura bíblica com comentários clássicos, múltiplas traduções, planos de leitura e suporte offline.

## Tecnologias

- **React 19** + **TypeScript** + **Vite 6**
- **Firebase Hosting** (deploy automático via GitHub Actions)
- **Firebase Auth** (login com Google)
- **Firestore** (notas pessoais, perfis de usuário)
- **Tailwind CSS v4**
- **Gemini AI** (tradução automática de comentários EN → PT)

## APIs de Bíblia

| API | Uso | Chave |
|-----|-----|-------|
| [bible.helloao.org](https://bible.helloao.org) | Traduções principais + comentários clássicos | Não necessária |
| [bible-api.com](https://bible-api.com) | Almeida Revista e Corrigida (ARC) | Não necessária |

### Traduções disponíveis

**Português:** ARC (Almeida), Bíblia Livre, Bíblia Livre Para Todos, Bíblia Portuguesa Mundial, Nova Bíblia Viva, Tradução para Tradutores

**English:** KJV, World English Bible, ASV, Bible in Basic English, Berean Standard Bible

### Comentários clássicos (offline via cache)

Adam Clarke · Jamieson-Fausset-Brown · Matthew Henry · John Gill · Tyndale Open Study Notes

## Instalação local

```bash
git clone https://github.com/bibliaalphastudiologos/bibliaalpha.git
cd bibliaalpha
npm install
cp .env.example .env.local   # edite e preencha GEMINI_API_KEY
npm run dev
```

## Deploy

O deploy é automático via **GitHub Actions** ao fazer push em `main`:

1. Build com Vite
2. Deploy no Firebase Hosting
3. Deploy das regras do Firestore

Configure o secret `FIREBASE_SERVICE_ACCOUNT_SENTINELA_AI_489015` no repositório do GitHub.

## Variáveis de ambiente

Veja `.env.example` para a lista completa.

## Controle de acesso

- **SuperAdmin** (`analista.ericksilva@gmail.com`): acesso total, aprovação automática
- **Usuários novos**: ficam com status `pending` até aprovação pelo admin
- **Usuários aprovados**: acesso completo ao app
- **Usuários bloqueados**: acesso negado

O painel de administração está disponível no menu do app para contas admin.

## Suporte offline

O Service Worker (`sw.js`) implementa:
- **App Shell** cacheado no install
- **Capítulos bíblicos** cacheados conforme lidos (Stale-While-Revalidate)
- Funciona offline após a primeira leitura de um capítulo

## Licença

Uso privado — Studio Logos.
