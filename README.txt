VIVER BEM — AGENDA CULTURAL AUTOMÁTICA

1. Envie todos os arquivos e pastas deste ZIP para o repositório ViverBemGotaDeMel.
2. No GitHub, abra a aba Actions.
3. Abra “Atualizar agenda cultural” e clique em “Run workflow” para a primeira atualização.
4. Depois disso, a atualização ocorrerá automaticamente todos os dias às 07:15 (horário de Brasília).

Como funciona:
- O GitHub Action abre as páginas oficiais da APPAI e do SESC Rio.
- Extrai eventos futuros e grava em data/eventos.json.
- O carrossel ordena sempre do evento mais próximo para o mais distante.
- Eventos vencidos deixam de aparecer.
- As informações são reais; as imagens são ilustrações genéricas armazenadas no projeto.

Observação:
Sites externos podem alterar sua estrutura. Se APPAI ou SESC mudar completamente a página, o arquivo scripts/atualizar_eventos.py poderá precisar de ajuste.
