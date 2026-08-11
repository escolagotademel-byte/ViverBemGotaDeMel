(() => {
  const eventos = [
    { data: '2026-08-15', titulo: 'Reunião com Auxiliares', horario: '8h às 12h' },
    { dataInicio: '2026-10-01', dataFim: '2026-10-07', data: '2026-10-01', titulo: 'Semana de Reunião de Responsáveis' },
    { data: '2026-10-08', titulo: 'Festa do Dia das Crianças' },
    { data: '2026-11-06', titulo: 'Feira do Conhecimento – ExpoGota' },
    { dataInicio: '2026-11-30', dataFim: '2026-12-04', data: '2026-11-30', titulo: 'Semana de Reunião de Responsáveis' },
    { data: '2026-12-10', titulo: 'Encerramento das Aulas – Horário Parcial' },
    { data: '2026-12-11', titulo: 'Formatura' },
    { data: '2026-12-18', titulo: 'Encerramento das Aulas – Horário Integral' },
    { data: '2026-12-18', titulo: 'Encerramento Funcionários – Último Dia', observacao: 'Retorno dos funcionários: 20/01/2027' },
    { data: '2026-12-19', titulo: 'Festa de Encerramento' }
  ];

  const parseDate = value => {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const formatDate = value => new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(parseDate(value));
  const formatRange = e => e.dataInicio && e.dataFim
    ? `${formatDate(e.dataInicio)} a ${formatDate(e.dataFim)}`
    : formatDate(e.data);

  const ordered = [...eventos].sort(
    (a,b) => parseDate(a.dataInicio || a.data) - parseDate(b.dataInicio || b.data)
  );

  const summary = document.querySelector('[data-company-event-summary]');
  if (summary) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const next = ordered.find(e => parseDate(e.dataInicio || e.data) >= today);
    summary.textContent = next
      ? `${formatRange(next)} • ${next.titulo}${next.horario ? ` • ${next.horario}` : ''}`
      : 'Nenhum evento interno próximo cadastrado.';
  }

  const list = document.querySelector('[data-company-events-page]');
  if (list) {
    list.innerHTML = ordered.map(e => `
      <article class="company-event-page-item">
        <div class="company-event-page-date">${formatRange(e)}</div>
        <div>
          <strong>${e.titulo}</strong>
          ${e.horario ? `<small>⏰ ${e.horario}</small>` : ''}
          ${e.observacao ? `<small>📌 ${e.observacao}</small>` : ''}
        </div>
      </article>
    `).join('');
  }
})();
