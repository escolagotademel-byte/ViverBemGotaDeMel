(() => {
  const toggle = document.querySelector('[data-company-events-toggle]');
  const list = document.querySelector('[data-company-events-list]');
  const summary = document.querySelector('[data-company-event-summary]');
  if (!toggle || !list || !summary) return;

  // Cadastre os eventos internos aqui quando houver novos eventos.
  // Exemplo de formato:
  // { data: '2026-08-12', titulo: 'Palestra de Saúde Mental', horario: '14h', local: 'Sala de reuniões' }
  const eventos = [];

  const parseDate = (value) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (value) => {
    const date = parseDate(value);
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
  };

  const ordered = eventos
    .filter(item => item.data && item.titulo)
    .sort((a, b) => parseDate(a.data) - parseDate(b.data));

  if (!ordered.length) {
    summary.textContent = 'Nenhum evento interno cadastrado no momento.';
    toggle.hidden = true;
    return;
  }

  const render = () => {
    list.innerHTML = ordered.map(evento => `
      <article class="company-event-item">
        <time datetime="${evento.data}">${formatDate(evento.data)}</time>
        <div>
          <strong>${evento.titulo}</strong>
          ${evento.horario || evento.local ? `<small>${[evento.horario, evento.local].filter(Boolean).join(' • ')}</small>` : ''}
        </div>
      </article>
    `).join('');
  };

  summary.textContent = `${formatDate(ordered[0].data)} • ${ordered[0].titulo}`;
  render();

  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    list.hidden = expanded;
    toggle.innerHTML = expanded ? 'Ver mais <span aria-hidden="true">›</span>' : 'Ver menos <span aria-hidden="true">⌃</span>';
  });
})();
