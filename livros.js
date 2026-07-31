(() => {
  'use strict';

  const lista = document.getElementById('lista-livros');
  const periodo = document.getElementById('periodo-semana');
  if (!lista) return;

  const UMA_SEMANA = 7 * 24 * 60 * 60 * 1000;

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
    const semanas = Math.floor((inicioDaSemana() - base) / UMA_SEMANA);
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

  function normalizar(texto = '') {
    return String(texto)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async function buscarNoGoogle(livro) {
    const consulta = encodeURIComponent(`intitle:${livro.titulo} inauthor:${livro.autor}`);
    const url = `https://www.googleapis.com/books/v1/volumes?q=${consulta}&printType=books&maxResults=10`;

    const resposta = await fetch(url, { cache: 'force-cache' });
    if (!resposta.ok) throw new Error('Google Books indisponível');

    const dados = await resposta.json();
    const tituloAlvo = normalizar(livro.titulo);
    const autorAlvo = normalizar(livro.autor);

    const candidatos = (dados.items || [])
      .filter(item => item?.volumeInfo?.imageLinks)
      .map(item => {
        const info = item.volumeInfo;
        const titulo = normalizar(info.title);
        const autores = normalizar((info.authors || []).join(' '));
        let pontos = 0;
        if (titulo === tituloAlvo) pontos += 10;
        else if (titulo.includes(tituloAlvo) || tituloAlvo.includes(titulo)) pontos += 6;
        if (autores.includes(autorAlvo) || autorAlvo.includes(autores)) pontos += 5;
        if (String(info.language || '').toLowerCase() === 'pt') pontos += 2;
        return { info, pontos };
      })
      .sort((a, b) => b.pontos - a.pontos);

    const links = candidatos[0]?.info?.imageLinks;
    if (!links) return '';

    const capa = links.extraLarge || links.large || links.medium || links.small || links.thumbnail || links.smallThumbnail || '';
    return String(capa)
      .replace(/^http:/, 'https:')
      .replace(/&edge=curl/g, '')
      .replace(/zoom=\d/g, 'zoom=2');
  }

  async function buscarNaOpenLibrary(livro) {
    const titulo = encodeURIComponent(livro.titulo);
    const autor = encodeURIComponent(livro.autor);
    const url = `https://openlibrary.org/search.json?title=${titulo}&author=${autor}&limit=10&fields=title,author_name,cover_i`;

    const resposta = await fetch(url, { cache: 'force-cache' });
    if (!resposta.ok) throw new Error('Open Library indisponível');

    const dados = await resposta.json();
    const tituloAlvo = normalizar(livro.titulo);
    const autorAlvo = normalizar(livro.autor);

    const candidatos = (dados.docs || [])
      .filter(item => item.cover_i)
      .map(item => {
        const tituloResultado = normalizar(item.title);
        const autores = normalizar((item.author_name || []).join(' '));
        let pontos = 0;
        if (tituloResultado === tituloAlvo) pontos += 10;
        else if (tituloResultado.includes(tituloAlvo) || tituloAlvo.includes(tituloResultado)) pontos += 6;
        if (autores.includes(autorAlvo) || autorAlvo.includes(autores)) pontos += 5;
        return { item, pontos };
      })
      .sort((a, b) => b.pontos - a.pontos);

    const id = candidatos[0]?.item?.cover_i;
    return id ? `https://covers.openlibrary.org/b/id/${id}-L.jpg` : '';
  }

  async function localizarCapaReal(livro) {
    try {
      const google = await buscarNoGoogle(livro);
      if (google) return google;
    } catch (_) {
      // Tenta a segunda fonte abaixo.
    }

    try {
      const openLibrary = await buscarNaOpenLibrary(livro);
      if (openLibrary) return openLibrary;
    } catch (_) {
      // A capa local será usada como segurança.
    }

    return livro.capa || '';
  }

  function criarCard(livro) {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="recommendation-cover-wrap">
        <span class="recommendation-type">📚 Livro</span>
        <img class="recommendation-cover" src="${escapeHtml(livro.capa || '')}" alt="Capa de ${escapeHtml(livro.titulo)}" loading="lazy" referrerpolicy="no-referrer">
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
    const capaLocal = livro.capa || '';
    let tentouLocal = false;

    imagem.addEventListener('error', () => {
      if (!tentouLocal && capaLocal && imagem.src !== new URL(capaLocal, document.baseURI).href) {
        tentouLocal = true;
        imagem.src = capaLocal;
        return;
      }
      imagem.hidden = true;
      fallback.hidden = false;
    });

    localizarCapaReal(livro).then(capa => {
      if (capa && capa !== capaLocal) imagem.src = capa;
    });

    return card;
  }

  async function carregar() {
    exibirPeriodo();
    try {
      const resposta = await fetch('../data/livros.json?v=5', { cache: 'no-store' });
      if (!resposta.ok) throw new Error('Falha ao carregar o acervo');

      const semanas = await resposta.json();
      if (!Array.isArray(semanas) || !semanas.length) throw new Error('Acervo vazio');

      const livros = semanas[indiceDaSemana(semanas.length)];
      if (!Array.isArray(livros) || livros.length < 3) throw new Error('Semana incompleta');

      lista.innerHTML = '';
      livros.slice(0, 3).forEach(livro => lista.appendChild(criarCard(livro)));
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = '<div class="recommendation-error">Não foi possível carregar as indicações agora. Atualize a página.</div>';
    }
  }

  carregar();
})();
