# Toyhouse Lite (React + Vite + Supabase)

- Tema claro/escuro (toggle)
- Slugs legíveis (`/character/<slug>`)
- Auth email/senha (Supabase)
- Comentários e transferências
- Cadastro com **código de convite**: `Y8KK1` (ver `src/pages/Login.jsx`).

## Rodando localmente

```bash
npm install
npm run dev
```

Crie `.env.local` com:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=CHAVE_ANON
```

## Banco (Supabase)

No Supabase **SQL Editor**, rode o conteúdo do `schema.sql`.