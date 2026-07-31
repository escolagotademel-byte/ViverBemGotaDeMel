(() => {
  'use strict';

  const lista = document.getElementById('lista-livros');
  const periodo = document.getElementById('periodo-semana');
  if (!lista) return;

  const UMA_SEMANA = 7 * 24 * 60 * 60 * 1000;
  const CACHE_DIAS = 30;

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

  function numeroDaSemana() {
    const base = new Date(2026, 0, 5);
    return Math.floor((inicioDaSemana() - base) / UMA_SEMANA);
  }

  function exibirPeriodo() {
    if (!periodo) return;
    const inicio = inicioDaSemana();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    const formato = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    periodo.textContent = `Indicações válidas de ${formato.format(inicio)} a ${formato.format(fim)}.`;
  }

  function criarCard(livro, indice) {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="recommendation-cover-wrap">
        <span class="recommendation-type">📚 Livro</span>
        <img
          class="recommendation-cover"
          id="capa-livro-${indice}"
          src="${escapeHtml(livro.capa)}"
          data-capa-local="${escapeHtml(livro.capa)}"
          alt="Capa de ${escapeHtml(livro.titulo)}"
          loading="lazy">
      </div>
      <div class="recommendation-body">
        <h3 class="recommendation-title">${escapeHtml(livro.titulo)}</h3>
        <p class="recommendation-author">${escapeHtml(livro.autor)}</p>
        <div class="recommendation-tags"><span class="recommendation-tag">${escapeHtml(livro.genero)}</span></div>
        <p class="recommendation-synopsis">${escapeHtml(livro.sinopse)}</p>
      </div>`;

    const imagem = card.querySelector('.recommendation-cover');
    imagem.addEventListener('error', () => {
      const local = imagem.dataset.capaLocal;
      if (local && imagem.src !== new URL(local, window.location.href).href) imagem.src = local;
    });

    return card;
  }

  function fetchComTempo(url, tempo = 5500) {
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), tempo);
    return fetch(url, { cache: 'force-cache', signal: controlador.signal })
      .finally(() => clearTimeout(timer));
  }

  function testarImagem(url) {
    return new Promise(resolve => {
      if (!url) return resolve(false);
      const imagem = new Image();
      const timer = setTimeout(() => resolve(false), 5000);
      imagem.onload = () => {
        clearTimeout(timer);
        resolve(imagem.naturalWidth >= 90 && imagem.naturalHeight >= 120);
      };
      imagem.onerror = () => {
        clearTimeout(timer);
        resolve(false);
      };
      imagem.referrerPolicy = 'no-referrer';
      imagem.src = url;
    });
  }

  function chaveCache(livro) {
    return `viverbem-capa:${livro.titulo}|${livro.autor}`;
  }

  function lerCache(livro) {
    try {
      const salvo = JSON.parse(localStorage.getItem(chaveCache(livro)) || 'null');
      if (!salvo?.url || !salvo?.data) return '';
      if (Date.now() - salvo.data > CACHE_DIAS * 86400000) return '';
      return salvo.url;
    } catch (_) {
      return '';
    }
  }

  function salvarCache(livro, url) {
    try {
      localStorage.setItem(chaveCache(livro), JSON.stringify({ url, data: Date.now() }));
    } catch (_) { /* armazenamento pode estar indisponível */ }
  }

  function urlCapaGoogle(imageLinks = {}) {
    const original = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.small || imageLinks.thumbnail || imageLinks.smallThumbnail;
    if (!original) return '';
    return String(original)
      .replace(/^http:/, 'https:')
      .replace(/&edge=curl/g, '')
      .replace(/zoom=\d/g, 'zoom=2');
  }

  async function buscarNoGoogle(livro) {
    const consulta = encodeURIComponent(livro.busca || `${livro.titulo} ${livro.autor}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${consulta}&langRestrict=pt&printType=books&maxResults=10`;
    const resposta = await fetchComTempo(url);
    if (!resposta.ok) return '';
    const dados = await resposta.json();
    const itens = Array.isArray(dados.items) ? dados.items : [];
    const tituloAlvo = livro.titulo.toLocaleLowerCase('pt-BR');
    const autorAlvo = livro.autor.toLocaleLowerCase('pt-BR');

    const candidatos = itens
      .map(item => {
        const info = item?.volumeInfo || {};
        const capa = urlCapaGoogle(info.imageLinks);
        if (!capa) return null;
        const titulo = String(info.title || '').toLocaleLowerCase('pt-BR');
        const autores = (info.authors || []).join(' ').toLocaleLowerCase('pt-BR');
        let pontos = 0;
        if (titulo === tituloAlvo) pontos += 8;
        else if (titulo.includes(tituloAlvo) || tituloAlvo.includes(titulo)) pontos += 5;
        if (autores.includes(autorAlvo) || autorAlvo.includes(autores)) pontos += 5;
        if (String(info.language || '').toLowerCase() === 'pt') pontos += 2;
        return { capa, pontos };
      })
      .filter(Boolean)
      .sort((a, b) => b.pontos - a.pontos);

    for (const candidato of candidatos.slice(0, 4)) {
      if (await testarImagem(candidato.capa)) return candidato.capa;
    }
    return '';
  }

  async function buscarNaOpenLibrary(livro) {
    const consulta = encodeURIComponent(livro.busca || `${livro.titulo} ${livro.autor}`);
    const resposta = await fetchComTempo(`https://openlibrary.org/search.json?q=${consulta}&limit=8`);
    if (!resposta.ok) return '';
    const dados = await resposta.json();
    const documentos = Array.isArray(dados.docs) ? dados.docs : [];
    for (const documento of documentos) {
      if (!documento.cover_i) continue;
      const capa = `https://covers.openlibrary.org/b/id/${documento.cover_i}-L.jpg`;
      if (await testarImagem(capa)) return capa;
    }
    return '';
  }

  async function atualizarCapaReal(livro, indice) {
    const imagem = document.getElementById(`capa-livro-${indice}`);
    if (!imagem) return;

    try {
      const cache = lerCache(livro);
      if (cache && await testarImagem(cache)) {
        imagem.referrerPolicy = 'no-referrer';
        imagem.src = cache;
        return;
      }

      let capa = '';
      try { capa = await buscarNoGoogle(livro); } catch (_) { /* tenta a próxima fonte */ }
      if (!capa) {
        try { capa = await buscarNaOpenLibrary(livro); } catch (_) { /* mantém a capa local */ }
      }

      if (capa) {
        salvarCache(livro, capa);
        imagem.referrerPolicy = 'no-referrer';
        imagem.src = capa;
      }
    } catch (_) {
      // A capa local já está visível. Nenhum erro é mostrado ao usuário.
    }
  }

  async function carregar() {
    exibirPeriodo();
    try {
      const resposta = await fetch('../data/livros.json?v=6', { cache: 'no-store' });
      if (!resposta.ok) throw new Error('Falha ao carregar o acervo');
      const semanas = await resposta.json();
      if (!Array.isArray(semanas) || !semanas.length) throw new Error('Acervo vazio');

      const indiceSemana = ((numeroDaSemana() % semanas.length) + semanas.length) % semanas.length;
      const livros = (semanas[indiceSemana] || []).filter(livro => livro?.titulo && livro?.capa).slice(0, 3);
      if (!livros.length) throw new Error('Semana sem indicações');

      lista.innerHTML = '';
      livros.forEach((livro, indice) => lista.appendChild(criarCard(livro, indice)));

      // As indicações aparecem imediatamente com capas locais. A troca por capas reais ocorre em segundo plano.
      livros.forEach((livro, indice) => atualizarCapaReal(livro, indice));
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = '<div class="recommendation-error">Não foi possível carregar as indicações desta semana. Atualize a página em alguns instantes.</div>';
    }
  }

  carregar();
})();
