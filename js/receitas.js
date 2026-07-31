(() => {
  "use strict";

  const list = document.getElementById("recipes-list");
  if (!list) return;

  const SOURCE_PAGE = "https://www.tudogostoso.com.br/noticias/cardapios/receitas-faceis";

  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function imageMarkup(recipe) {
    if (!recipe.imagem) {
      return '<div class="recipe-image recipe-image-placeholder" aria-hidden="true">🍽️</div>';
    }
    return `<img class="recipe-image" src="${escapeHtml(recipe.imagem)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=&quot;recipe-image recipe-image-placeholder&quot; aria-hidden=&quot;true&quot;>🍽️</div>'">`;
  }

  function render(recipes, updatedAt) {
    if (!Array.isArray(recipes) || recipes.length === 0) {
      list.innerHTML = `<div class="recipes-status">Não foi possível mostrar as receitas agora. <a href="${SOURCE_PAGE}" target="_blank" rel="noopener noreferrer">Abrir o TudoGostoso</a></div>`;
      return;
    }

    const day = Math.floor(new Date(new Date().setHours(0,0,0,0)).getTime()/86400000);
    const total = recipes.length;
    const start = total ? ((day * 5) % total + total) % total : 0;
    const dailyRecipes = Array.from({length: Math.min(5,total)}, (_,i)=>recipes[(start+i)%total]);
    list.innerHTML = dailyRecipes.map((recipe) => {
      const url = recipe.url || SOURCE_PAGE;
      return `
        <article class="recipe-card">
          <a class="recipe-image-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir: ${escapeHtml(recipe.titulo)}">
            ${imageMarkup(recipe)}
          </a>
          <div class="recipe-copy">
            <span class="recipe-source">Fonte: TudoGostoso</span>
            <h3>${escapeHtml(recipe.titulo)}</h3>
            <p>${escapeHtml(recipe.resumo || "Veja os detalhes e o modo de preparo completo no TudoGostoso.")}</p>
            <a class="action-btn recipe-button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Ver receita completa <span aria-hidden="true">↗</span></a>
          </div>
        </article>`;
    }).join("");
    const stamp=document.getElementById("recipes-updated");
    if(stamp&&updatedAt) stamp.textContent=`Atualizado em: ${new Date(updatedAt).toLocaleString("pt-BR")}`;
  }

  fetch(`../data/receitas.json?ts=${Date.now()}`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => render(data.receitas, data.atualizado_em))
    .catch(() => render([]));
})();
