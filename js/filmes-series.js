(() => {
  'use strict';

  const lista = document.getElementById('lista-filmes-series');
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
    const inicio = inicioDaSemana();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    const formato = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    periodo.textContent = `Seleção válida de ${formato.format(inicio)} a ${formato.format(fim)}.`;
  }

  async function buscarPoster(item, imagem, fallback) {
    const chave = `viverbem-poster:${item.tituloWiki}`;
    const cache = localStorage.getItem(chave);
    if (cache) {
      imagem.src = cache;
      return;
    }

    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(item.tituloWiki)}`;
      const resposta = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!resposta.ok) throw new Error('Pôster indisponível');
      const dados = await resposta.json();
      const poster = dados.originalimage?.source || dados.thumbnail?.source;
      if (!poster) throw new Error('Pôster não encontrado');
      localStorage.setItem(chave, poster);
      imagem.src = poster;
    } catch (erro) {
      imagem.hidden = true;
      fallback.hidden = false;
    }
  }

  function criarCard(item) {
    const icone = item.tipo === 'Série' ? '📺' : '🎥';
    const tempo = item.tipo === 'Série' ? item.temporadas : item.duracao;
    const rotuloTempo = item.tipo === 'Série' ? 'Temporadas' : 'Duração';
    const card = document.createElement('article');
    card.className = 'recommendation-card is-screen';
    card.innerHTML = `
      <div class="recommendation-cover-wrap">
        <span class="recommendation-type">${icone} ${escapeHtml(item.tipo)}</span>
        <img class="recommendation-cover" alt="Pôster de ${escapeHtml(item.titulo)}" loading="lazy">
        <div class="recommendation-cover-fallback" hidden>${escapeHtml(item.titulo)}</div>
      </div>
      <div class="recommendation-body">
        <h3 class="recommendation-title">${escapeHtml(item.titulo)}</h3>
        <div class="recommendation-tags">
          <span class="recommendation-tag">${escapeHtml(item.genero)}</span>
        </div>
        <p class="recommendation-synopsis">${escapeHtml(item.sinopse)}</p>
        <div class="recommendation-meta">
          <span><strong>${rotuloTempo}:</strong> ${escapeHtml(tempo)}</span>
          <span><strong>Classificação:</strong> ${escapeHtml(item.classificacao)}</span>
          <span><strong>Onde assistir:</strong> ${escapeHtml(item.plataforma)}</span>
        </div>
        <p class="recommendation-note">A disponibilidade nos serviços de streaming pode mudar conforme a região e a data.</p>
      </div>`;

    const imagem = card.querySelector('.recommendation-cover');
    const fallback = card.querySelector('.recommendation-cover-fallback');
    imagem.addEventListener('error', () => {
      imagem.hidden = true;
      fallback.hidden = false;
    }, { once: true });
    buscarPoster(item, imagem, fallback);
    return card;
  }

  async function carregar() {
    exibirPeriodo();
    try {
      const resposta = await fetch('../data/filmes-series.json', { cache: 'no-store' });
      if (!resposta.ok) throw new Error('Não foi possível carregar as indicações.');
      const semanas = await resposta.json();
      if (!Array.isArray(semanas) || !semanas.length) throw new Error('Nenhuma indicação cadastrada.');
      const selecao = semanas[indiceDaSemana(semanas.length)];
      lista.innerHTML = '';
      selecao.forEach(item => lista.appendChild(criarCard(item)));
    } catch (erro) {
      lista.innerHTML = `<div class="recommendation-error">Não foi possível carregar as indicações agora. Tente novamente mais tarde.</div>`;
    }
  }

  carregar();
})();
