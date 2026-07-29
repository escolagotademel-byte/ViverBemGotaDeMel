# Viver Bem — Escola Gota de Mel

Aplicativo web estático com agenda cultural automática da APPAI e do SESC Rio.

## Publicação no GitHub Pages

1. Envie **todo o conteúdo desta pasta** para a raiz do repositório `ViverBemGotaDeMel`.
2. É indispensável enviar também a pasta oculta `.github`.
3. No GitHub, abra **Settings → Actions → General**.
4. Em **Workflow permissions**, marque **Read and write permissions** e salve.
5. Abra **Actions** e selecione **Atualizar agenda cultural**.
6. Clique em **Run workflow** para fazer a primeira atualização.

Depois disso, a ação será executada diariamente às 07:15 no horário de Brasília.

## Estrutura automática

- `.github/workflows/atualizar-agenda.yml`: agenda a atualização diária.
- `scripts/atualizar_eventos.py`: consulta as páginas oficiais.
- `data/eventos.json`: armazena os eventos exibidos no site.
- `assets/eventos/`: imagens genéricas por categoria.

Os eventos são ordenados pela data mais próxima. Eventos vencidos deixam de aparecer no site. Como os sites externos podem alterar a estrutura das páginas, o coletor poderá precisar de ajuste futuro.
