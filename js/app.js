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


// Respiração guiada avançada
function initGuidedBreathing(){
 const app=document.querySelector('[data-breathing-app]'); if(!app)return;
 const patterns={calma:[['Inspire',4,'Puxe o ar suavemente pelo nariz.','inspire'],['Expire',4,'Solte o ar devagar.','expire']],quadrada:[['Inspire',4,'Puxe o ar suavemente.','inspire'],['Segure',4,'Mantenha sem tensão.','hold'],['Expire',4,'Solte o ar devagar.','expire'],['Aguarde',4,'Permaneça sem ar, com conforto.','rest']],478:[['Inspire',4,'Puxe o ar pelo nariz.','inspire'],['Segure',7,'Mantenha com suavidade.','hold'],['Expire',8,'Solte lentamente pela boca.','expire']]};
 let pattern='calma',phase=0,remaining=0,timer=null,running=false;
 const circle=app.querySelector('[data-breath-circle]'),label=app.querySelector('[data-breath-label]'),count=app.querySelector('[data-breath-count]'),guide=app.querySelector('[data-breath-guidance]'),bar=app.querySelector('[data-breath-progress]'),start=app.querySelector('[data-start-guided-breath]'),stop=app.querySelector('[data-stop-guided-breath]');
 app.querySelectorAll('[data-breath-pattern]').forEach(btn=>btn.addEventListener('click',()=>{if(running)return;app.querySelectorAll('[data-breath-pattern]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');pattern=btn.dataset.breathPattern;resetView()}));
 function resetView(){clearInterval(timer);running=false;circle.className='breath-circle-pro';label.textContent='Pronto?';count.textContent='';guide.textContent='Encontre uma posição confortável.';bar.style.width='0';start.hidden=false;stop.hidden=true}
 function runPhase(){const current=patterns[pattern][phase];remaining=current[1];circle.className='breath-circle-pro phase-'+current[3];circle.style.transitionDuration=current[1]+'s';label.textContent=current[0];count.textContent=remaining+'s';guide.textContent=current[2];bar.style.transition='none';bar.style.width='0';requestAnimationFrame(()=>requestAnimationFrame(()=>{bar.style.transition=`width ${current[1]}s linear`;bar.style.width='100%'}));clearInterval(timer);timer=setInterval(()=>{remaining--;count.textContent=Math.max(remaining,0)+'s';if(remaining<=0){clearInterval(timer);phase=(phase+1)%patterns[pattern].length;runPhase()}},1000)}
 start.addEventListener('click',()=>{running=true;phase=0;start.hidden=true;stop.hidden=false;runPhase()});stop.addEventListener('click',resetView);resetView();
}

function shuffle(list){const copy=[...list];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
function initOrganizeGame(){
 const game=document.querySelector('[data-organize-game]');if(!game)return;
 const tray=game.querySelector('[data-organize-items]'),msg=game.querySelector('[data-organize-message]');
 const catalog=[['✏️','Lápis','papelaria'],['🖊️','Caneta','papelaria'],['✂️','Tesoura','papelaria'],['📏','Régua','papelaria'],['📎','Clipes','papelaria'],['🖇️','Grampeador','papelaria'],['📘','Livro','livros'],['📒','Caderno','livros'],['📚','Livros','livros'],['🗂️','Pasta','livros'],['💻','Notebook','tecnologia'],['🖱️','Mouse','tecnologia'],['⌨️','Teclado','tecnologia'],['📱','Celular','tecnologia'],['🪴','Planta','decoracao'],['🖼️','Porta-retrato','decoracao'],['💡','Luminária','decoracao'],['🌼','Flor','decoracao'],['☕','Caneca','bebidas'],['🧃','Garrafinha','bebidas'],['🥤','Copo','bebidas'],['🎧','Fones','acessorios'],['🔑','Chaves','acessorios'],['👓','Óculos','acessorios']];
 let selected=null,placed=0,total=0;
 function chooseItems(){const groups={};catalog.forEach(x=>(groups[x[2]]??=[]).push(x));return shuffle(Object.keys(groups)).flatMap(k=>shuffle(groups[k]).slice(0,2))}
 function bindItem(button){button.addEventListener('click',()=>{tray.querySelectorAll('.sort-item').forEach(x=>x.classList.remove('selected'));selected=button;button.classList.add('selected');msg.textContent='Agora toque no espaço correspondente.'})}
 function reset(){selected=null;placed=0;tray.innerHTML='';game.querySelectorAll('.sort-zone').forEach(z=>z.classList.remove('correct','wrong'));const items=shuffle(chooseItems());total=items.length;items.forEach(([emoji,label,kind])=>{const b=document.createElement('button');b.className='sort-item';b.dataset.kind=kind;b.setAttribute('aria-label',label);b.textContent=emoji;bindItem(b);tray.append(b)});msg.textContent='Escolha um objeto para começar.'}
 game.querySelectorAll('.sort-zone').forEach(z=>z.addEventListener('click',()=>{if(!selected){msg.textContent='Primeiro escolha um objeto.';return}if(z.dataset.accept===selected.dataset.kind){selected.classList.remove('selected');selected.classList.add('placed');z.classList.add('correct');selected=null;placed++;msg.textContent=placed===total?'Mesa organizada. Que sensação boa! ✨':'Muito bem. Escolha o próximo objeto.'}else{z.classList.remove('wrong');void z.offsetWidth;z.classList.add('wrong');msg.textContent='Esse objeto combina melhor com outro espaço.'}}));
 game.querySelector('[data-reset-organize]').addEventListener('click',reset);reset()
}
function initColorGame(){
 const game=document.querySelector('[data-color-game]');if(!game)return;
 const palette=game.querySelector('[data-color-palette]'),sequence=game.querySelector('[data-color-sequence]'),msg=game.querySelector('[data-color-message]');
 const palettes=[['#fff4bf','#f8dc82','#e7b94c','#c87f38','#8f4b35','#582c2c'],['#eef8d8','#cde7a3','#9fc66f','#6c9e55','#477743','#285038'],['#e8f4ff','#bddcf6','#82b9e5','#4d8bc3','#32639a','#203f68'],['#f4eaff','#ddc8f4','#bd9de1','#9672c4','#6d4e98','#442f67'],['#ffe9ef','#ffc8d8','#f59aae','#df6e88','#ad4662','#743044'],['#fff0df','#ffd0a7','#f3a56f','#d9784f','#a64f3b','#68342f']];
 let shades=[],next=0;
 function reset(){shades=shuffle(palettes)[0];next=0;sequence.innerHTML='';palette.innerHTML='';shuffle(shades.map((color,index)=>({color,index}))).forEach(({color,index})=>{const b=document.createElement('button');b.className='color-tile';b.style.background=color;b.dataset.index=index;b.setAttribute('aria-label','Peça de cor');b.addEventListener('click',()=>pick(b));palette.append(b)});msg.textContent='Comece pela peça mais clara.'}
 function pick(b){if(Number(b.dataset.index)!==next){msg.textContent='Observe com calma: existe uma tonalidade mais clara.';return}b.classList.add('used');const copy=b.cloneNode();copy.classList.remove('used');copy.disabled=true;sequence.append(copy);next++;msg.textContent=next===shades.length?'Degradê completo. Ficou harmonioso! 🎨':'Continue da mais clara para a mais escura.'}
 game.querySelector('[data-reset-colors]').addEventListener('click',reset);reset()
}
function initGardenGame(){
 const game=document.querySelector('[data-garden-game]');if(!game)return;
 const tray=game.querySelector('[data-garden-items]'),ground=game.querySelector('[data-garden-ground]'),msg=game.querySelector('[data-garden-message]');
 const catalog=[['🌷','Tulipa','flores'],['🌼','Margarida','flores'],['🌺','Hibisco','flores'],['🌻','Girassol','flores'],['🪴','Vaso com planta','vasos'],['🌵','Cacto','vasos'],['🌱','Muda','vasos'],['🪨','Pedra','pedras'],['🟤','Seixo','pedras'],['⚪','Pedra clara','pedras'],['💧','Regador','cuidados'],['🧤','Luvas','cuidados'],['🪏','Pá de jardim','cuidados']];
 let selected=null,placed=0,total=0;
 function chooseItems(){const groups={};catalog.forEach(x=>(groups[x[2]]??=[]).push(x));return shuffle(Object.keys(groups)).flatMap(k=>shuffle(groups[k]).slice(0,2))}
 function reset(){selected=null;placed=0;tray.innerHTML='';ground.classList.remove('garden-complete');game.querySelectorAll('.garden-zone').forEach(z=>{z.classList.remove('correct','wrong');z.querySelectorAll('.garden-placed').forEach(x=>x.remove())});const items=shuffle(chooseItems());total=items.length;items.forEach(([emoji,label,kind])=>{const b=document.createElement('button');b.className='garden-item';b.dataset.kind=kind;b.setAttribute('aria-label',label);b.textContent=emoji;b.addEventListener('click',()=>{tray.querySelectorAll('.garden-item').forEach(x=>x.classList.remove('selected'));selected=b;b.classList.add('selected');msg.textContent='Agora escolha o lugar correspondente.'});tray.append(b)});msg.textContent='Escolha um elemento do jardim.'}
 game.querySelectorAll('.garden-zone').forEach(z=>z.addEventListener('click',()=>{if(!selected){msg.textContent='Primeiro escolha um elemento.';return}if(z.dataset.accept===selected.dataset.kind){const placedEl=document.createElement('span');placedEl.className='garden-placed';placedEl.textContent=selected.textContent;z.append(placedEl);selected.classList.add('placed');selected.classList.remove('selected');selected=null;placed++;z.classList.add('correct');if(placed===total){ground.classList.add('garden-complete');msg.textContent='Jardim pronto. Ficou tranquilo e harmonioso! 🌿'}else msg.textContent='Muito bem. Escolha o próximo elemento.'}else{z.classList.remove('wrong');void z.offsetWidth;z.classList.add('wrong');msg.textContent='Esse elemento combina melhor com outro lugar.'}}));
 game.querySelector('[data-reset-garden]').addEventListener('click',reset);reset()
}
function initBubbleGame(){const game=document.querySelector('[data-bubble-game]');if(!game)return;const board=game.querySelector('[data-bubble-board]'),msg=game.querySelector('[data-bubble-message]');function reset(){board.innerHTML='';for(let i=0;i<18;i++){const b=document.createElement('button');b.className='relax-bubble';const size=34+Math.random()*34;b.style.width=b.style.height=size+'px';b.style.left=Math.random()*88+'%';b.style.top=Math.random()*77+'%';b.style.animationDelay=(Math.random()*2)+'s';b.setAttribute('aria-label','Estourar bolha');b.addEventListener('click',()=>{b.classList.add('popped');const left=board.querySelectorAll('.relax-bubble:not(.popped)').length;msg.textContent=left?'Continue no seu ritmo.':'Todas as bolhas foram embora. Respire fundo. 🫧'});board.append(b)}msg.textContent='Uma bolha de cada vez.'}game.querySelector('[data-reset-bubbles]').addEventListener('click',reset);reset()}
function initHumor(){const app=document.querySelector('[data-humor-app]');if(!app)return;const data={piada:[['📚','Por que o livro foi ao médico?','Porque estava com muitas páginas em branco!'],['☕','O que o café disse quando chegou ao trabalho?','Hoje eu vim expresso!'],['🖥️','Por que o computador foi descansar?','Porque precisava desligar um pouco.']],quadrinho:[['A professora disse: “Hoje vou organizar tudo!”','Cinco minutos depois…','“Começarei organizando uma pausa.”'],['“Você já bebeu água hoje?”','“Bebi café. Conta?”','“A garrafinha pediu revisão dessa resposta.”']],charge:[['📱','A reunião poderia ser um e-mail… mas o e-mail também pediu uma pausa.'],['🧠','Meu cérebro abriu 15 abas. Nenhuma delas lembra onde está a lista de tarefas.'],['⏰','Quando o despertador toca, até o botão “soneca” parece uma proposta de bem-estar.']]};let type='piada',index=0;const stage=app.querySelector('[data-humor-stage]');function render(){const item=data[type][index%data[type].length];if(type==='piada')stage.innerHTML=`<div class="joke-card"><div class="joke-emoji">${item[0]}</div><h3>${item[1]}</h3><p>${item[2]}</p></div>`;if(type==='quadrinho')stage.innerHTML=`<div class="comic-strip">${item.map((t,i)=>`<div class="comic-panel"><div class="speech">${t}</div><div class="comic-character">${['👩‍🏫','🗂️','😌'][i]}</div></div>`).join('')}</div>`;if(type==='charge')stage.innerHTML=`<div class="charge-card"><div class="charge-art">${item[0]}</div><div><h3>Charge do dia</h3><p>${item[1]}</p></div></div>`}app.querySelectorAll('[data-humor-type]').forEach(b=>b.addEventListener('click',()=>{type=b.dataset.humorType;index=0;app.querySelectorAll('[data-humor-type]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render()}));app.querySelector('[data-next-humor]').addEventListener('click',()=>{index++;render()});render()}

document.addEventListener('DOMContentLoaded',()=>{initGuidedBreathing();initOrganizeGame();initColorGame();initGardenGame();initBubbleGame();initHumor()});
