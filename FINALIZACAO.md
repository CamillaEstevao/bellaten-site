# BellaTen — versão final

## Recursos incluídos
- Loja responsiva para celular, tablet e desktop.
- Busca, ordenação, categorias e favoritos persistentes.
- Detalhes do produto e descrição.
- Carrinho persistente com controle de quantidade.
- Checkout com retirada/entrega, pagamento e observações.
- Pedido salvo no Supabase e enviado ao WhatsApp.
- Baixa automática de estoque ao concluir o pedido.
- Painel responsivo com Dashboard, Produtos, Categorias, Pedidos e Clientes.
- Status de pedido: Novo, Em atendimento, Finalizado e Cancelado.
- Alertas de estoque baixo e total de vendas finalizadas.

## Banco de dados
No Supabase, abra **SQL Editor**, cole todo o conteúdo de `supabase-final.sql` e clique em **Run**.

## Rodar localmente
```bash
npm install
npm run dev
```

## Publicar
Depois de testar:
```bash
git add .
git commit -m "Finaliza loja BellaTen com pedidos e painel completo"
git push origin main
```
A Vercel fará o deploy automático.
