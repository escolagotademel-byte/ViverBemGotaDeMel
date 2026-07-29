const frases=["Uma pausa também é cuidado.","Seu bem-estar merece espaço na rotina.","Respire fundo: você não precisa resolver tudo de uma vez.","Pequenos gestos de cuidado transformam o dia.","Você faz diferença todos os dias.","Desacelerar também é seguir em frente.","Cuide de si com o mesmo carinho que oferece aos outros.","Hoje, escolha falar consigo com gentileza.","Seu esforço merece reconhecimento.","Descansar é parte do caminho.","Um minuto de calma pode mudar o restante do dia.","Valorize as pequenas conquistas.","Seu corpo também precisa ser ouvido.","Gentileza consigo é uma forma de força.","Faça uma pausa, alongue-se e recomece.","Você não precisa dar conta de tudo sozinho.","O cuidado começa nos pequenos hábitos.","Permita-se viver o momento presente.","Cada dia oferece uma nova possibilidade.","Acolha seus sentimentos sem julgamento.","Seu ritmo também é válido.","Respire: você está fazendo o melhor que pode.","Uma rotina mais leve começa com uma escolha.","Compartilhar também alivia.","Cultive pensamentos que façam bem.","O descanso renova a criatividade.","Seu trabalho é importante, e você também.","Celebre o que deu certo hoje.","Cuidar da mente é cuidar da vida.","Há força na calma.","Cuidar de quem cuida faz toda a diferença."];

const icons={teatro:"🎭",musica:"🎵",exposicao:"🎨",cinema:"🎬",danca:"💃",comedia:"😂",infantil:"🎪",esporte:"🏃",cultura:"✨"};
const pageIsInsidePages=location.pathname.includes("/pages/");
const rootPrefix=pageIsInsidePages?"../":"";

function formatDate(value){
  if(!value)return "Data no site oficial";
  const d=new Date(`${value}T12:00:00`);
  return d.toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short",year:"numeric"});
}
function safeText(value,fallback=""){return String(value||fallback)}
function createEventCard(event){
  const button=document.createElement("button");
  button.type="button";
  button.className=`highlight-card event-card ${String(event.fonte).toUpperCase()==="SESC"?"source-sesc":"source-appai"}`;
  button.innerHTML=`<div class="highlight-image-wrap"><img class="highlight-image" src="${rootPrefix}${safeText(event.imagem,'assets/eventos/cultura.svg')}" alt="Imagem ilustrativa de ${safeText(event.titulo,'evento')}"><span class="source-badge ${String(event.fonte).toUpperCase()==="SESC"?"sesc-source":"appai-source"}">${safeText(event.fonte)}</span></div><div class="highlight-copy"><strong>${safeText(event.titulo,'Evento cultural')}</strong><span>${formatDate(event.data)} • ${safeText(event.local,'Consulte o local')}</span></div>`;
  button.addEventListener("click",()=>openEventModal(event));
  return button;
}
function createAgendaEvent(event){
  const article=document.createElement("article");
  article.className="agenda-event agenda-event-dynamic";
  article.innerHTML=`<img class="agenda-event-image" src="${rootPrefix}${safeText(event.imagem,'assets/eventos/cultura.svg')}" alt="Imagem ilustrativa de ${safeText(event.titulo,'evento')}"><div class="agenda-event-copy"><span class="event-source ${String(event.fonte).toUpperCase()==="SESC"?"sesc-source":"appai-source"}">${safeText(event.fonte)}</span><h3>${safeText(event.titulo,'Evento cultural')}</h3><p class="event-meta">${formatDate(event.data)} • ${safeText(event.horario,'Consulte o horário')}<br>${safeText(event.local,'Consulte o local')}</p><p>${safeText(event.descricao)}</p><small class="illustrative-note">Imagem meramente ilustrativa.</small><br><a class="action-btn" href="${safeText(event.url,'#')}" target="_blank" rel="noopener">Ver no site oficial ↗</a></div>`;
  return article;
}
function openEventModal(event){
  const modal=document.querySelector("[data-event-modal]"); if(!modal)return;
  modal.querySelector("[data-event-modal-title]").textContent=safeText(event.titulo,"Evento");
  const source=modal.querySelector("[data-event-modal-source]"); source.textContent=safeText(event.fonte); source.classList.toggle("sesc-source",String(event.fonte).toUpperCase()==="SESC"); source.classList.toggle("appai-source",String(event.fonte).toUpperCase()!=="SESC");
  modal.querySelector("[data-event-modal-meta]").textContent=`${formatDate(event.data)} • ${safeText(event.horario,"Consulte o horário")} • ${safeText(event.local,"Consulte o local")}`;
  modal.querySelector("[data-event-modal-description]").textContent=safeText(event.descricao);
  const image=modal.querySelector("[data-event-modal-image]"); image.src=`${rootPrefix}${safeText(event.imagem,'assets/eventos/cultura.svg')}`; image.alt=`Imagem ilustrativa de ${safeText(event.titulo,'evento')}`;
  modal.querySelector("[data-event-modal-link]").href=safeText(event.url,"#");
  modal.hidden=false; document.body.classList.add("modal-open");
}
async function loadEvents(){
  const carousel=document.querySelector("[data-events-carousel]");
  const list=document.querySelector("[data-events-list]");
  if(!carousel&&!list)return;
  try{
    const response=await fetch(`${rootPrefix}data/eventos.json?ts=${Date.now()}`,{cache:"no-store"});
    if(!response.ok)throw new Error("Agenda indisponível");
    const payload=await response.json();
    const today=new Date(); today.setHours(0,0,0,0);
    const events=(payload.eventos||[]).filter(e=>{const d=new Date(`${e.data}T12:00:00`);return !Number.isNaN(d.getTime())&&d>=today}).sort((a,b)=>a.data.localeCompare(b.data)||a.titulo.localeCompare(b.titulo,"pt-BR"));
    if(carousel){carousel.innerHTML=""; events.slice(0,12).forEach(e=>carousel.append(createEventCard(e))); if(!events.length)carousel.innerHTML='<div class="events-empty">A agenda automática ainda não foi atualizada. Use “Ver agenda” para acessar os sites oficiais.</div>';}
    if(list){list.innerHTML=""; events.forEach(e=>list.append(createAgendaEvent(e))); if(!events.length)list.innerHTML='<div class="events-empty">Nenhum evento futuro foi identificado na última consulta automática.</div>';}
    const status=document.querySelector("[data-events-status]");
    if(status&&payload.atualizadoEm){status.textContent=`Última atualização automática: ${new Date(payload.atualizadoEm).toLocaleString("pt-BR")}. Informações sujeitas a alterações nos sites oficiais.`;}
  }catch(error){
    const message='<div class="events-empty">Não foi possível carregar a agenda agora. Consulte a APPAI e o SESC pelos links oficiais.</div>';
    if(carousel)carousel.innerHTML=message;if(list)list.innerHTML=message;
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".accordion-trigger").forEach(t=>t.addEventListener("click",()=>{const c=document.getElementById(t.getAttribute("aria-controls"));const open=t.getAttribute("aria-expanded")==="true";t.setAttribute("aria-expanded",String(!open));c.classList.toggle("open",!open)}));
  const quote=document.querySelector("[data-daily-quote]");const dateEl=document.querySelector("[data-daily-date]");if(quote){const now=new Date();quote.textContent=frases[(now.getDate()-1)%frases.length];if(dateEl)dateEl.textContent=now.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}
  const modal=document.querySelector("[data-event-modal]");if(modal){const close=()=>{modal.hidden=true;document.body.classList.remove("modal-open")};modal.querySelectorAll("[data-close-event]").forEach(btn=>btn.addEventListener("click",close));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)close()})}
  loadEvents();
});

// Respiração guiada: mostra a preparação antes do início e mantém a sessão sem distrações.
(()=>{
  const prep=document.querySelector('[data-breath-prep]');
  const session=document.querySelector('[data-breath-session]');
  const start=document.querySelector('[data-start-breath]');
  const stop=document.querySelector('[data-stop-breath]');
  const circle=document.querySelector('[data-breath]');
  const phaseEl=document.querySelector('[data-breath-phase]');
  const countEl=document.querySelector('[data-breath-count]');
  const guidance=document.querySelector('[data-breath-guidance]');
  if(!prep||!session||!start||!circle||!phaseEl||!countEl)return;
  let timers=[]; let running=false;
  const clearAll=()=>{timers.forEach(clearTimeout);timers=[];running=false;circle.classList.remove('inhale','hold','exhale')};
  const later=(fn,ms)=>{const id=setTimeout(fn,ms);timers.push(id)};
  const setPhase=(name,cls,text)=>{circle.classList.remove('inhale','hold','exhale');circle.classList.add(cls);phaseEl.textContent=name;guidance.textContent=text;let n=4;countEl.textContent=n;const tick=()=>{if(!running)return;n--;countEl.textContent=Math.max(n,0);if(n>0)later(tick,1000)};later(tick,1000)};
  const cycle=()=>{if(!running)return;setPhase('Inspire','inhale','Puxe o ar lentamente pelo nariz.');later(()=>{if(!running)return;setPhase('Segure','hold','Mantenha o ar sem forçar.');later(()=>{if(!running)return;setPhase('Expire','exhale','Solte o ar devagar pela boca.');later(cycle,4000)},4000)},4000)};
  const begin=()=>{clearAll();running=true;prep.hidden=true;session.hidden=false;session.scrollIntoView({behavior:'smooth',block:'start'});phaseEl.textContent='Prepare-se';guidance.textContent='Começaremos em instantes.';circle.classList.remove('inhale','hold','exhale');let n=3;countEl.textContent=n;const countdown=()=>{if(!running)return;n--;countEl.textContent=n;if(n>0)later(countdown,1000);else cycle()};later(countdown,1000)};
  const end=()=>{clearAll();session.hidden=true;prep.hidden=false;prep.scrollIntoView({behavior:'smooth',block:'start'})};
  start.addEventListener('click',begin); if(stop)stop.addEventListener('click',end);
})();

// Alongamentos: abre a ilustração escolhida em tamanho grande e conduz o tempo.
(()=>{
  const cards=[...document.querySelectorAll('[data-stretch]')];
  const modal=document.querySelector('[data-stretch-modal]');
  if(!cards.length||!modal)return;
  const panel=modal.querySelector('.stretch-modal-panel');
  const visual=modal.querySelector('[data-stretch-visual]');
  const title=modal.querySelector('[data-stretch-title]');
  const instruction=modal.querySelector('[data-stretch-instruction]');
  const time=modal.querySelector('[data-stretch-time]');
  const action=modal.querySelector('[data-stretch-action]');
  let current=null, interval=null, stage='ready';
  const resetTimer=()=>{clearInterval(interval);interval=null};
  const open=(card)=>{current=card;stage='ready';resetTimer();panel.classList.remove('finished');visual.innerHTML=card.querySelector('svg').outerHTML;title.textContent=card.dataset.title;instruction.textContent=card.dataset.instruction;time.textContent='20';action.textContent='Começar';modal.hidden=false;document.body.classList.add('modal-open')};
  const close=()=>{resetTimer();modal.hidden=true;document.body.classList.remove('modal-open')};
  const run=()=>{stage='running';action.disabled=true;let left=20;time.textContent=left;interval=setInterval(()=>{left--;time.textContent=left;if(left<=0){resetTimer();stage='switch';action.disabled=false;instruction.textContent=current.dataset.switch;action.textContent='Continuar';}},1000)};
  const finish=()=>{stage='finished';panel.classList.add('finished');instruction.textContent='Muito bem! Movimento concluído.';action.textContent='Concluir'};
  action.addEventListener('click',()=>{if(stage==='ready')run();else if(stage==='switch')finish();else close()});
  cards.forEach(card=>card.addEventListener('click',()=>open(card)));
  modal.querySelectorAll('[data-close-stretch]').forEach(el=>el.addEventListener('click',close));
})();


// Jogos de descompressão — módulo independente e seguro para toque/celular.
(()=>{
  const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const choose=(arr,n)=>shuffle(arr).slice(0,n);
  const setupSortGame=({rootSel,itemsSel,zonesSel,messageSel,resetSel,pool,count=10})=>{
    const root=document.querySelector(rootSel); if(!root)return;
    const tray=root.querySelector(itemsSel), zones=[...root.querySelectorAll(zonesSel)], msg=root.querySelector(messageSel), reset=root.querySelector(resetSel);
    let selected=null,remaining=0;
    const select=(btn)=>{root.querySelectorAll('.game-piece.selected').forEach(x=>x.classList.remove('selected'));selected=btn;btn.classList.add('selected');msg.textContent=`Agora toque em “${btn.dataset.label}”.`};
    const newGame=()=>{selected=null;tray.innerHTML='';zones.forEach(z=>z.classList.remove('correct','wrong'));const items=choose(pool,Math.min(count,pool.length));remaining=items.length;items.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='game-piece';b.dataset.type=item.type;b.dataset.label=item.label;b.innerHTML=`<span>${item.icon}</span><small>${item.name}</small>`;b.addEventListener('click',()=>select(b));tray.append(b)});msg.textContent='Escolha um objeto para começar.'};
    zones.forEach(zone=>zone.addEventListener('click',()=>{if(!selected){msg.textContent='Primeiro toque em um objeto.';return}if(zone.dataset.accept===selected.dataset.type){zone.classList.add('correct');selected.classList.add('placed');selected.disabled=true;selected=null;remaining--;msg.textContent=remaining?`Muito bem! Faltam ${remaining}.`:'Tudo organizado. Respire e aprecie o resultado.'}else{zone.classList.add('wrong');setTimeout(()=>zone.classList.remove('wrong'),450);msg.textContent='Esse objeto combina melhor com outro espaço.'}}));
    reset?.addEventListener('click',newGame);newGame();
  };
  setupSortGame({rootSel:'[data-organize-game]',itemsSel:'[data-organize-items]',zonesSel:'.sort-zone',messageSel:'[data-organize-message]',resetSel:'[data-reset-organize]',count:12,pool:[
    {icon:'✏️',name:'Lápis',type:'papelaria',label:'Papelaria'},{icon:'🖊️',name:'Caneta',type:'papelaria',label:'Papelaria'},{icon:'📏',name:'Régua',type:'papelaria',label:'Papelaria'},{icon:'✂️',name:'Tesoura',type:'papelaria',label:'Papelaria'},{icon:'📎',name:'Clipes',type:'papelaria',label:'Papelaria'},{icon:'📒',name:'Caderno',type:'livros',label:'Livros'},{icon:'📚',name:'Livros',type:'livros',label:'Livros'},{icon:'📁',name:'Pasta',type:'livros',label:'Livros'},{icon:'💻',name:'Notebook',type:'tecnologia',label:'Tecnologia'},{icon:'🖱️',name:'Mouse',type:'tecnologia',label:'Tecnologia'},{icon:'📱',name:'Celular',type:'tecnologia',label:'Tecnologia'},{icon:'💡',name:'Luminária',type:'tecnologia',label:'Tecnologia'},{icon:'🪴',name:'Planta',type:'decoracao',label:'Decoração'},{icon:'🖼️',name:'Porta-retrato',type:'decoracao',label:'Decoração'},{icon:'🌼',name:'Flor',type:'decoracao',label:'Decoração'},{icon:'☕',name:'Caneca',type:'bebidas',label:'Bebidas'},{icon:'💧',name:'Água',type:'bebidas',label:'Bebidas'},{icon:'🧴',name:'Álcool em gel',type:'acessorios',label:'Acessórios'},{icon:'🎧',name:'Fone',type:'acessorios',label:'Acessórios'},{icon:'📌',name:'Grampeador',type:'acessorios',label:'Acessórios'}]});
  setupSortGame({rootSel:'[data-garden-game]',itemsSel:'[data-garden-items]',zonesSel:'.garden-zone',messageSel:'[data-garden-message]',resetSel:'[data-reset-garden]',count:10,pool:[
    {icon:'🌷',name:'Tulipa',type:'flores',label:'Flores'},{icon:'🌻',name:'Girassol',type:'flores',label:'Flores'},{icon:'🌸',name:'Flor',type:'flores',label:'Flores'},{icon:'🪴',name:'Vaso',type:'vasos',label:'Vasos'},{icon:'🏺',name:'Vaso alto',type:'vasos',label:'Vasos'},{icon:'🪨',name:'Pedra',type:'pedras',label:'Pedras'},{icon:'◽',name:'Seixo',type:'pedras',label:'Pedras'},{icon:'💧',name:'Regador',type:'cuidados',label:'Cuidados'},{icon:'🧤',name:'Luvas',type:'cuidados',label:'Cuidados'},{icon:'🌱',name:'Muda',type:'cuidados',label:'Cuidados'},{icon:'🏮',name:'Lanterna',type:'vasos',label:'Vasos'},{icon:'🪑',name:'Banco',type:'pedras',label:'Pedras'}]});

  const colorRoot=document.querySelector('[data-color-game]');
  if(colorRoot){const palette=colorRoot.querySelector('[data-color-palette]'),sequence=colorRoot.querySelector('[data-color-sequence]'),msg=colorRoot.querySelector('[data-color-message]');let order=[],step=0;const families=[['#fde8ef','#f9b9cf','#f47da7','#df3e75','#9f1749'],['#e8f1ff','#b7d2ff','#79a8f5','#3f72cf','#244693'],['#eaf8e9','#bde7b9','#82c879','#4c9d4b','#28622d'],['#fff4dd','#ffdca1','#ffb95c','#e98522','#9f4b10'],['#f2eaff','#d4bdf7','#ad87e5','#7d55bd','#4b2d7f'],['#e8fbfa','#afe9e5','#6bcac4','#319d98','#17625f']];
    const newColors=()=>{const colors=shuffle(families[Math.floor(Math.random()*families.length)]);order=[...colors].sort((a,b)=>{const lum=x=>{x=x.slice(1);return .2126*parseInt(x.slice(0,2),16)+.7152*parseInt(x.slice(2,4),16)+.0722*parseInt(x.slice(4,6),16)};return lum(b)-lum(a)});step=0;palette.innerHTML='';sequence.innerHTML='';colors.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='color-piece';b.style.background=c;b.setAttribute('aria-label','Peça colorida');b.addEventListener('click',()=>{if(b.disabled)return;if(c===order[step]){b.disabled=true;b.classList.add('used');const dot=document.createElement('span');dot.style.background=c;sequence.append(dot);step++;msg.textContent=step===order.length?'Degradê concluído!':'Continue da mais clara para a mais escura.'}else{b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),400);msg.textContent='Tente uma cor um pouco mais clara.'}});palette.append(b)});msg.textContent='Comece pela peça mais clara.'};colorRoot.querySelector('[data-reset-colors]')?.addEventListener('click',newColors);newColors();}

  const bubbleRoot=document.querySelector('[data-bubble-game]');
  if(bubbleRoot){const board=bubbleRoot.querySelector('[data-bubble-board]'),msg=bubbleRoot.querySelector('[data-bubble-message]');const fill=()=>{board.innerHTML='';let left=24;for(let i=0;i<24;i++){const b=document.createElement('button');b.type='button';b.className='bubble';b.setAttribute('aria-label','Estourar bolha');b.style.setProperty('--size',`${42+Math.floor(Math.random()*26)}px`);b.addEventListener('click',()=>{if(b.classList.contains('popped'))return;b.classList.add('popped');left--;msg.textContent=left?`${left} bolhas restantes. Sem pressa.`:'Pronto. Faça uma respiração profunda.'});board.append(b)}msg.textContent='Uma bolha de cada vez.'};bubbleRoot.querySelector('[data-reset-bubbles]')?.addEventListener('click',fill);fill();}
})();
