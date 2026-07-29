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
  button.className=`highlight-card event-card ${event.fonte==="SESC"?"sesc":""}`;
  button.innerHTML=`<div class="highlight-image-wrap"><img class="highlight-image" src="${rootPrefix}${safeText(event.imagem,'assets/eventos/cultura.svg')}" alt="Imagem ilustrativa de ${safeText(event.titulo,'evento')}"><span class="source-badge">${safeText(event.fonte)}</span></div><div class="highlight-copy"><strong>${safeText(event.titulo,'Evento cultural')}</strong><span>${formatDate(event.data)} • ${safeText(event.local,'Consulte o local')}</span></div>`;
  button.addEventListener("click",()=>openEventModal(event));
  return button;
}
function createAgendaEvent(event){
  const article=document.createElement("article");
  article.className="agenda-event agenda-event-dynamic";
  article.innerHTML=`<img class="agenda-event-image" src="${rootPrefix}${safeText(event.imagem,'assets/eventos/cultura.svg')}" alt="Imagem ilustrativa de ${safeText(event.titulo,'evento')}"><div class="agenda-event-copy"><span class="event-source ${event.fonte==="SESC"?"sesc-source":""}">${safeText(event.fonte)}</span><h3>${safeText(event.titulo,'Evento cultural')}</h3><p class="event-meta">${formatDate(event.data)} • ${safeText(event.horario,'Consulte o horário')}<br>${safeText(event.local,'Consulte o local')}</p><p>${safeText(event.descricao)}</p><small class="illustrative-note">Imagem meramente ilustrativa.</small><br><a class="action-btn" href="${safeText(event.url,'#')}" target="_blank" rel="noopener">Ver no site oficial ↗</a></div>`;
  return article;
}
function openEventModal(event){
  const modal=document.querySelector("[data-event-modal]"); if(!modal)return;
  modal.querySelector("[data-event-modal-title]").textContent=safeText(event.titulo,"Evento");
  const source=modal.querySelector("[data-event-modal-source]"); source.textContent=safeText(event.fonte); source.classList.toggle("sesc-source",event.fonte==="SESC");
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
  const breath=document.querySelector("[data-breath]");const start=document.querySelector("[data-start-breath]");if(breath&&start){let timer;start.addEventListener("click",()=>{clearInterval(timer);let inhale=true;breath.textContent="Inspire";breath.classList.add("inhale");timer=setInterval(()=>{inhale=!inhale;breath.textContent=inhale?"Inspire":"Expire";breath.classList.toggle("inhale",inhale)},4000)})}
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
