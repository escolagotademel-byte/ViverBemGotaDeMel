(() => {
  'use strict';

  const lista = document.getElementById('lista-livros');
  const periodo = document.getElementById('periodo-semana');
  if (!lista) return;

  const escapeHtml = (valor = '') => String(valor).replace(/[&<>'"]/g, caractere => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[caractere]);

  function inicioDaSemana(data = new Date()) {
    const copia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const dia = copia.getDay();
    copia.setDate(copia.getDate() + (dia === 0 ? -6 : 1 - dia));
    copia.setHours(0, 0, 0, 0);
    return copia;
  }

  function indiceDaSemana(total) {
    const base = new Date(2026, 0, 5);
    const semanas = Math.floor((inicioDaSemana() - base) / 604800000);
    return ((semanas % total) + total) % total;
  }

  function exibirPeriodo() {
    if (!periodo) return;
    const inicio = inicioDaSemana();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    const formato = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    periodo.textContent = `Indicações válidas de ${formato.format(inicio)} a ${formato.format(fim)}.`;
  }

  function criarCard(livro) {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="recommendation-cover-wrap">
        <span class="recommendation-type">📚 Livro</span>
        <img class="recommendation-cover" src="${escapeHtml(livro.capa)}" alt="Capa de ${escapeHtml(livro.titulo)}" loading="lazy">
        <div class="recommendation-cover-fallback" hidden>
          <strong>${escapeHtml(livro.titulo)}</strong><small>${escapeHtml(livro.autor)}</small>
        </div>
      </div>
      <div class="recommendation-body">
        <h3 class="recommendation-title">${escapeHtml(livro.titulo)}</h3>
        <p class="recommendation-author">${escapeHtml(livro.autor)}</p>
        <div class="recommendation-tags"><span class="recommendation-tag">${escapeHtml(livro.genero)}</span></div>
        <p class="recommendation-synopsis">${escapeHtml(livro.sinopse)}</p>
      </div>`;

    const imagem = card.querySelector('.recommendation-cover');
    const fallback = card.querySelector('.recommendation-cover-fallback');
    imagem.addEventListener('error', () => {
      imagem.hidden = true;
      fallback.hidden = false;
    }, { once: true });
    return card;
  }

  async function carregar() {
    exibirPeriodo();
    try {
      const resposta = await fetch('../data/livros.json?v=3', { cache: 'no-store' });
      if (!resposta.ok) throw new Error('Falha ao carregar');
      const semanas = await resposta.json();
      if (!Array.isArray(semanas) || !semanas.length) throw new Error('Sem indicações');
      lista.innerHTML = '';
      semanas[indiceDaSemana(semanas.length)].forEach(livro => lista.appendChild(criarCard(livro)));
    } catch (erro) {
      lista.innerHTML = '<div class="recommendation-error">Não foi possível carregar as indicações agora. Atualize a página.</div>';
    }
  }

  carregar();
})();
