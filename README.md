# BellaTen — Loja + Painel Administrativo

Projeto React + Vite conectado ao Supabase.

## Recursos

- Loja responsiva com busca, categorias, favoritos e detalhes de produto
- Carrinho persistente com subtotal e controle de quantidade
- Checkout com pedido salvo no Supabase e envio para WhatsApp
- Painel com dashboard, produtos, categorias, pedidos e clientes
- Upload de imagens pelo Supabase Storage
- Controle de estoque e status de pedidos

## Instalação

```bash
npm install
npm run dev
```

## Banco de dados

Execute no SQL Editor do Supabase, nesta ordem quando necessário:

1. `supabase-setup.sql`
2. `supabase-categorias.sql`
3. `supabase-final.sql`

## Variáveis de ambiente

Crie `.env` com:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Nunca use uma chave `sb_secret_` no frontend.
