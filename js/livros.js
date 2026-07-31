(() => {
  'use strict';

  const lista = document.getElementById('lista-livros');
  const periodo = document.getElementById('periodo-semana');
  if (!lista) return;

  const UM_DIA = 86400000;
  const UMA_SEMANA = 7 * UM_DIA;
  const LIMITE_BUSCAS = 18;

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

  function normalizarGenero(genero = '') {
    return genero.toLocaleLowerCase('pt-BR')
      .replace(/\s+e\s+/g, ' ')
      .replace(/[^a-záàâãéêíóôõúç ]/gi, '')
      .trim()
      .split(' ')[0] || genero;
  }

  function embaralharDeterministico(itens, semente) {
    const copia = [...itens];
    let estado = Math.abs(semente) + 1;
    const aleatorio = () => {
      estado = (estado * 1664525 + 1013904223) % 4294967296;
      return estado / 4294967296;
    };
    for (let i = copia.length - 1; i > 0; i -= 1) {
      const j = Math.floor(aleatorio() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function urlBuscaGoogle(livro) {
    const titulo = encodeURIComponent(`intitle:${livro.titulo}`);
    const autor = encodeURIComponent(`inauthor:${livro.autor}`);
    return `https://www.googleapis.com/books/v1/volumes?q=${titulo}+${autor}&langRestrict=pt&printType=books&maxResults=8`;
  }

  function melhorResultado(itens, livro) {
    if (!Array.isArray(itens)) return null;
    const tituloAlvo = livro.titulo.toLocaleLowerCase('pt-BR');
    const autorAlvo = livro.autor.toLocaleLowerCase('pt-BR');

    return itens
      .filter(item => item?.volumeInfo?.imageLinks?.thumbnail || item?.volumeInfo?.imageLinks?.smallThumbnail)
      .map(item => {
        const info = item.volumeInfo;
        const titulo = String(info.title || '').toLocaleLowerCase('pt-BR');
        const autores = (info.authors || []).join(' ').toLocaleLowerCase('pt-BR');
        let pontos = 0;
        if (titulo === tituloAlvo) pontos += 6;
        else if (titulo.includes(tituloAlvo) || tituloAlvo.includes(titulo)) pontos += 4;
        if (autores.includes(autorAlvo) || autorAlvo.includes(autores)) pontos += 4;
        if (String(info.language || '').toLowerCase() === 'pt') pontos += 2;
        return { item, pontos };
      })
      .sort((a, b) => b.pontos - a.pontos)[0]?.item || null;
  }

  function capaSegura(imageLinks = {}) {
    const original = imageLinks.extraLarge || imageLinks.large || imageLinks.medium || imageLinks.small || imageLinks.thumbnail || imageLinks.smallThumbnail;
    if (!original) return '';
    return String(original)
      .replace(/^http:/, 'https:')
      .replace(/&edge=curl/g, '')
      .replace(/zoom=\d/g, 'zoom=2');
  }

  function testarImagem(url) {
    return new Promise(resolve => {
      if (!url) return resolve(false);
      const imagem = new Image();
      const finalizar = valor => {
        imagem.onload = null;
        imagem.onerror = null;
        resolve(valor);
      };
      const temporizador = setTimeout(() => finalizar(false), 7000);
      imagem.onload = () => { clearTimeout(temporizador); finalizar(imagem.naturalWidth > 80 && imagem.naturalHeight > 100); };
      imagem.onerror = () => { clearTimeout(temporizador); finalizar(false); };
      imagem.referrerPolicy = 'no-referrer';
      imagem.src = url;
    });
  }

  async function buscarLivroComCapa(livro) {
    try {
      const resposta = await fetch(urlBuscaGoogle(livro), { cache: 'force-cache' });
      if (!resposta.ok) return null;
      const dados = await resposta.json();
      const resultado = melhorResultado(dados.items, livro);
      if (!resultado) return null;

      const capa = capaSegura(resultado.volumeInfo.imageLinks);
      if (!(await testarImagem(capa))) return null;

      return {
        ...livro,
        capa,
        titulo: livro.titulo || resultado.volumeInfo.title,
        autor: livro.autor || (resultado.volumeInfo.authors || []).join(', ')
      };
    } catch (_) {
      return null;
    }
  }

  function criarCard(livro) {
    const card = document.createElement('article');
    card.className = 'recommendation-card';
    card.innerHTML = `
      <div class="recommendation-cover-wrap">
        <span class="recommendation-type">📚 Livro</span>
        <img class="recommendation-cover" src="${escapeHtml(livro.capa)}" alt="Capa de ${escapeHtml(livro.titulo)}" loading="lazy" referrerpolicy="no-referrer">
      </div>
      <div class="recommendation-body">
        <h3 class="recommendation-title">${escapeHtml(livro.titulo)}</h3>
        <p class="recommendation-author">${escapeHtml(livro.autor)}</p>
        <div class="recommendation-tags"><span class="recommendation-tag">${escapeHtml(livro.genero)}</span></div>
        <p class="recommendation-synopsis">${escapeHtml(livro.sinopse)}</p>
      </div>`;
    return card;
  }

  async function escolherTresComCapa(candidatos) {
    const escolhidos = [];
    const generos = new Set();

    for (const livro of candidatos.slice(0, LIMITE_BUSCAS)) {
      if (escolhidos.length === 3) break;
      const grupoGenero = normalizarGenero(livro.genero);
      if (generos.has(grupoGenero)) continue;

      const encontrado = await buscarLivroComCapa(livro);
      if (!encontrado) continue;

      escolhidos.push(encontrado);
      generos.add(grupoGenero);
    }

    return escolhidos;
  }

  async function carregar() {
    exibirPeriodo();
    try {
      const resposta = await fetch('../data/livros.json?v=4', { cache: 'no-store' });
      if (!resposta.ok) throw new Error('Falha ao carregar o acervo');
      const semanas = await resposta.json();
      if (!Array.isArray(semanas) || !semanas.length) throw new Error('Acervo vazio');

      const acervo = semanas.flat().filter(Boolean);
      const candidatos = embaralharDeterministico(acervo, numeroDaSemana());
      const livros = await escolherTresComCapa(candidatos);

      if (livros.length < 3) {
        throw new Error('Não foram encontrados três livros com capas disponíveis');
      }

      lista.innerHTML = '';
      livros.forEach(livro => lista.appendChild(criarCard(livro)));
    } catch (erro) {
      console.error(erro);
      lista.innerHTML = '<div class="recommendation-error">Não foi possível encontrar três indicações com capas disponíveis agora. Tente atualizar a página em alguns instantes.</div>';
    }
  }

  carregar();
})();
