const messages = [
  'Quem cuida com carinho também merece ser cuidado. Respire, desacelere e aproveite esta pausa.',
  'Pequenas pausas também fazem parte de um trabalho bem-feito. Cuide de você por alguns minutos.',
  'Hoje, reconheça uma pequena conquista e ofereça uma palavra gentil a alguém da equipe.',
  'Você não precisa resolver tudo de uma vez. Respire e retome uma tarefa de cada vez.',
  'Seu cuidado faz diferença todos os dias. Que esta pausa ajude a renovar suas energias.',
  'A gentileza também descansa a mente. Compartilhe um sorriso e receba este momento com calma.',
  'Valorize o que já conseguiu fazer hoje. Pausar também é uma forma de seguir em frente.'
];

const healthTips = [
  'Beba um copo de água antes de retornar às atividades.',
  'Relaxe os ombros e faça três respirações profundas.',
  'Descanse os olhos: olhe para um ponto distante por 20 segundos.',
  'Observe sua postura e alterne a posição do corpo sempre que possível.',
  'Escolha um lanche leve para evitar desconforto durante o restante do expediente.',
  'Ao sentir tensão, faça uma pausa breve e perceba onde o corpo está rígido.',
  'Tente não usar todo o intervalo apenas no celular; reserve alguns minutos para descansar a mente.'
];

const jokes = [
  'Por que o lápis foi promovido? Porque tinha muita ponta para oferecer!',
  'O café foi ao médico. Diagnóstico: estava muito passado.',
  'Por que o livro de matemática ficou triste? Porque tinha muitos problemas.',
  'O que o zero disse para o oito? Que cinto bonito!',
  'Por que o computador foi ao médico? Porque estava com um vírus.',
  'Qual é o contrário de volátil? Vem cá, sobrinho!',
  'O que a impressora falou para a outra? Essa folha é sua ou é impressão minha?'
];

const memes = [
  'EU: “Hoje vou fazer tudo com calma.”\nTAMBÉM EU, 10 MINUTOS DEPOIS: correndo com uma garrafinha e três papéis na mão.',
  'Quando você senta por 2 minutos e o corpo entende que começou um feriado prolongado.',
  'Status da pausa: 50% café, 30% silêncio e 20% tentando lembrar onde deixei o celular.',
  'Eu entrando no intervalo: “Só vou respirar.”\nEu saindo: emocionalmente renovado e com um biscoito na mão.',
  'Quando alguém pergunta se você está cansado e você responde apenas com o olhar.',
  'A melhor notificação do dia: “Seu intervalo começou.”',
  'Sexta-feira não resolve tudo, mas melhora bastante o diagnóstico.'
];

const challenges = [
  { q: 'Charada: o que sobe quando a chuva desce?', a: 'O guarda-chuva.' },
  { q: 'Desafio rápido: diga três coisas azuis ao seu redor em menos de 10 segundos.', a: 'Resposta pessoal — valeu exercitar a atenção!' },
  { q: 'Qual palavra começa com “c”, termina com “o” e tem água dentro?', a: 'Coco.' },
  { q: 'Respire fundo e encontre cinco sons diferentes ao seu redor.', a: 'Resposta pessoal — o objetivo é praticar atenção plena.' },
  { q: 'O que é, o que é: tem dentes, mas não morde?', a: 'O pente.' },
  { q: 'Conte de 20 até 1 lentamente, respirando entre os números.', a: 'Desafio concluído!' },
  { q: 'O que fica maior quanto mais você tira?', a: 'Um buraco.' }
];

const playlists = [
  ['🌿', 'Sons da natureza', 'relaxar sons da natureza'],
  ['🌧️', 'Chuva relaxante', 'chuva relaxante'],
  ['🌊', 'Ondas do mar', 'ondas do mar relaxar'],
  ['🎹', 'Piano relaxante', 'piano relaxante'],
  ['🎸', 'Violão instrumental', 'violão instrumental relaxante'],
  ['🎷', 'Jazz instrumental', 'jazz instrumental relax'],
  ['☕', 'Café music', 'cafe music playlist'],
  ['🌅', 'Lo-fi chill', 'lofi chill'],
  ['🇧🇷', 'MPB leve', 'MPB acústica tranquila'],
  ['🎶', 'Bossa nova', 'bossa nova relax'],
  ['🥁', 'Samba de raiz', 'samba de raiz playlist'],
  ['🎼', 'Música clássica', 'música clássica relaxante'],
  ['📚', 'Concentração', 'deep focus instrumental'],
  ['🌙', 'Ambient music', 'ambient music relax']
];

const now = new Date();
const dayIndex = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
const pick = list => list[dayIndex % list.length];

const greeting = now.getHours() < 12 ? '☀️ Bom dia, equipe!' : now.getHours() < 18 ? '🌤️ Boa tarde, equipe!' : '🌙 Boa noite, equipe!';
document.getElementById('greetingText').textContent = greeting;
document.getElementById('todayText').textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
document.getElementById('dailyMessage').textContent = `“${pick(messages)}”`;
document.getElementById('healthTip').textContent = pick(healthTips);
document.getElementById('jokeText').textContent = pick(jokes);
document.getElementById('memeText').textContent = pick(memes);
const challenge = pick(challenges);
document.getElementById('challengeText').textContent = challenge.q;
document.getElementById('challengeAnswer').textContent = challenge.a;

const grid = document.getElementById('musicGrid');
playlists.forEach(([emoji, title, query]) => {
  const link = document.createElement('a');
  link.className = 'music-card';
  link.href = `https://open.spotify.com/search/${encodeURIComponent(query)}`;
  link.target = '_blank';
  link.rel = 'noopener';
  link.innerHTML = `<span>${emoji}</span><strong>${title}</strong><small>Abrir playlist</small>`;
  grid.appendChild(link);
});

function showPage(id) {
  document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.addEventListener('click', event => {
  const nav = event.target.closest('[data-target]');
  if (nav) showPage(nav.dataset.target);
});

document.getElementById('revealAnswer').addEventListener('click', () => {
  document.getElementById('challengeAnswer').classList.remove('hidden');
});

let timerId;
document.querySelectorAll('.timer-button').forEach(button => {
  button.addEventListener('click', () => startTimer(Number(button.dataset.seconds)));
});

document.getElementById('stopTimer').addEventListener('click', stopTimer);

function startTimer(seconds) {
  clearInterval(timerId);
  const box = document.getElementById('timerBox');
  const display = document.getElementById('timerDisplay');
  box.classList.remove('hidden');
  let remaining = seconds;
  const render = () => {
    const min = String(Math.floor(remaining / 60)).padStart(2, '0');
    const sec = String(remaining % 60).padStart(2, '0');
    display.textContent = `${min}:${sec}`;
  };
  render();
  timerId = setInterval(() => {
    remaining -= 1;
    render();
    if (remaining <= 0) {
      clearInterval(timerId);
      display.textContent = 'Concluído 🌿';
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  document.getElementById('timerBox').classList.add('hidden');
}
