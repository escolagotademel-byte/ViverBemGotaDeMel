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
    const deslocamento = dia === 0 ? -6 : 1 - dia;
    copia.setDate(copia.getDate() + deslocamento);
    copia.setHours(0, 0, 0, 0);
    return copia;
  }

  function indiceDaSemana(total) {
    const inicio = inicioDaSemana();
    const base = new Date(2026, 0, 5);
    const semanas = Math.floor((inicio - base) / 604800000);
    return ((semanas % total) + total) % total;
  }

  function exibirPeriodo() {
    const inicio = inicioDaSemana();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    const formato = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    periodo.textContent = `Indicações válidas de ${formato.format(inicio)} a ${formato.format(fim)}.`;
  }

  async function buscarCapa(livro, imagem, fallback) {
    const chave = `viverbem-capa-livro:${livro.busca}`;
    const cache = localStorage.getItem(chave);
    if (cache) {
      imagem.src = cache;
      return;
    }

    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(livro.busca)}&maxResults=5&printType=books`;
      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error('Capa indisponível');
      const dados = await resposta.json();
      const item = (dados.items || []).find(volume => volume.volumeInfo?.imageLinks);
      const capa = item?.volumeInfo?.imageLinks?.thumbnail || item?.volumeInfo?.imageLinks?.smallThumbnail;
      if (!capa) throw new Error('Capa não encontrada');
      const segura = capa.replace(/^http:/, 'https:').replace('&zoom=1', '&zoom=2');
      localStorage.setItem(chave, segura);
      imagem.src = segura;
    } catch (erro) {
      imagem.hidden = true;
      fallback.hidden = false;
    }
  }

  function criarCard(livro) {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="recommendation-cover-wrap">
        <span class="recommendation-type">📚 Livro</span>
        <img class="recommendation-cover" alt="Capa de ${escapeHtml(livro.titulo)}" loading="lazy">
        <div class="recommendation-cover-fallback" hidden>${escapeHtml(livro.titulo)}</div>
      </div>
      <div class="recommendation-body">
        <h3 class="recommendation-title">${escapeHtml(livro.titulo)}</h3>
        <p class="recommendation-author">${escapeHtml(livro.autor)}</p>
        <div class="recommendation-tags">
          <span class="recommendation-tag">${escapeHtml(livro.genero)}</span>
        </div>
        <p class="recommendation-synopsis">${escapeHtml(livro.sinopse)}</p>
      </div>`;

    const imagem = card.querySelector('.recommendation-cover');
    const fallback = card.querySelector('.recommendation-cover-fallback');
    imagem.addEventListener('error', () => {
      imagem.hidden = true;
      fallback.hidden = false;
    }, { once: true });
    buscarCapa(livro, imagem, fallback);
    return card;
  }

  async function carregar() {
    exibirPeriodo();
    try {
      const resposta = await fetch('../data/livros.json', { cache: 'no-store' });
      if (!resposta.ok) throw new Error('Não foi possível carregar as indicações.');
      const semanas = await resposta.json();
      if (!Array.isArray(semanas) || !semanas.length) throw new Error('Nenhuma indicação cadastrada.');
      const livros = semanas[indiceDaSemana(semanas.length)];
      lista.innerHTML = '';
      livros.forEach(livro => lista.appendChild(criarCard(livro)));
    } catch (erro) {
      lista.innerHTML = `<div class="recommendation-error">Não foi possível carregar as indicações agora. Tente novamente mais tarde.</div>`;
    }
  }

  carregar();
})();
