const frases=["Acredite no seu propósito: pequenas atitudes transformam grandes dias.", "Seu trabalho deixa marcas bonitas na vida de muitas pessoas.", "Cuidar de si também fortalece tudo o que você oferece aos outros.", "Quando a equipe caminha unida, os desafios ficam mais leves.", "Reconheça a sua dedicação: ela faz diferença todos os dias.", "Gratidão transforma o que temos em força para continuar.", "Uma palavra gentil pode mudar o dia de alguém.", "Você não precisa fazer tudo de uma vez; avance com calma.", "Cada novo dia traz uma oportunidade de recomeçar.", "Seu esforço de hoje ajuda a construir resultados de amanhã.", "A colaboração faz talentos individuais se tornarem conquistas coletivas.", "Respire fundo e confie no caminho que está construindo.", "Há coragem também em pedir ajuda e dividir responsabilidades.", "Celebre as pequenas conquistas: elas sustentam os grandes sonhos.", "O respeito torna qualquer ambiente mais acolhedor.", "Seu bem-estar merece espaço na sua rotina.", "A gentileza é uma força que se multiplica quando é compartilhada.", "Tudo bem desacelerar para recuperar as energias.", "Você é parte importante desta equipe.", "Escutar com atenção é uma das formas mais bonitas de cuidar.", "O aprendizado acontece um passo de cada vez.", "A união transforma desafios em possibilidades.", "Faça o melhor que puder hoje, sem esquecer de cuidar de você.", "Uma pausa consciente pode renovar o restante do dia.", "Valorize quem caminha ao seu lado.", "Seu trabalho tem valor, e sua presença também.", "A confiança cresce quando reconhecemos nossas próprias conquistas.", "Cooperar é construir um resultado que pertence a todos.", "Que hoje você encontre motivos simples para agradecer.", "Ser gentil consigo também é necessário.", "Novos resultados começam com pequenas mudanças.", "O equilíbrio nasce quando respeitamos nossos limites.", "Compartilhar conhecimentos fortalece toda a equipe.", "Você já superou muitos dias difíceis; confie em si.", "A dedicação diária cria caminhos que antes pareciam impossíveis.", "Onde existe acolhimento, as pessoas florescem.", "Pausar não é desistir; é recuperar forças para continuar.", "A melhor equipe é aquela em que todos se sentem valorizados.", "Permita-se reconhecer tudo o que já evoluiu.", "O cuidado presente hoje se transforma em bem-estar amanhã.", "Comece com o que você tem e avance no seu ritmo.", "A empatia aproxima pessoas e fortalece relações.", "Seu sorriso pode ser o acolhimento que alguém precisava.", "Toda contribuição importa quando o objetivo é coletivo.", "Cultive pensamentos que tragam calma e esperança.", "Agradecer pelo caminho também ajuda a enxergar o progresso.", "Você merece falar consigo com o mesmo carinho que oferece aos outros.", "Grandes mudanças começam em escolhas simples.", "Juntos, podemos tornar a rotina mais leve e significativa.", "Há beleza em continuar aprendendo.", "Respeitar o próprio ritmo é uma forma de sabedoria.", "A motivação cresce quando lembramos por que começamos.", "Hoje é um bom dia para reconhecer alguém da equipe.", "A calma ajuda a encontrar soluções mais claras.", "Seu compromisso inspira quem está ao seu redor.", "Um ambiente saudável começa com atitudes respeitosas.", "Cada pessoa traz uma força única para a equipe.", "Não diminua suas conquistas só porque ainda há caminho pela frente.", "A esperança também se constrói nas pequenas ações.", "Cuidar das relações é cuidar do trabalho em equipe.", "Faça uma pausa, respire e retome com mais leveza.", "Você pode transformar o dia começando por uma atitude positiva.", "Quando compartilhamos responsabilidades, multiplicamos possibilidades.", "Seu desenvolvimento acontece também nos dias mais comuns.", "A gratidão ajuda a perceber o que realmente importa.", "Acolher diferenças torna a equipe mais forte.", "Seu valor não depende de um dia perfeito.", "A persistência tranquila também leva longe.", "O bem que fazemos volta em forma de vínculos e aprendizado.", "Confie: você está construindo algo importante todos os dias."];

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
  const quote=document.querySelector("[data-daily-quote]");const dateEl=document.querySelector("[data-daily-date]");if(quote){const now=new Date();const dayKey=Math.floor(new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()/86400000);quote.textContent=frases[((dayKey%frases.length)+frases.length)%frases.length];if(dateEl)dateEl.textContent=now.toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}
  const modal=document.querySelector("[data-event-modal]");if(modal){const close=()=>{modal.hidden=true;document.body.classList.remove("modal-open")};modal.querySelectorAll("[data-close-event]").forEach(btn=>btn.addEventListener("click",close));document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.hidden)close()})}
  loadEvents();
});

// Conteúdo da respiração muda conforme o dia da semana.
(()=>{
 const plans=[
  {title:"Prática livre",text:"Respire no seu ritmo e aproveite alguns minutos de calma."},
  {title:"Foco e Energia",text:"Uma respiração guiada para começar a semana com presença e disposição."},
  {title:"Redução do Estresse",text:"Diminua o ritmo e solte as tensões acumuladas."},
  {title:"Pausa Consciente",text:"Volte a atenção ao presente e faça uma pausa restauradora."},
  {title:"Concentração",text:"Organize os pensamentos e recupere o foco com a respiração."},
  {title:"Relaxamento",text:"Encerre a semana soltando o corpo e acalmando a mente."},
  {title:"Prática livre",text:"Respire no seu ritmo e aproveite alguns minutos de calma."}
 ];
 const box=document.querySelector('[data-breath-prep]'); if(!box)return; const plan=plans[new Date().getDay()];
 const h=box.querySelector('h2,h3'); const p=box.querySelector('p'); if(h)h.textContent=plan.title; if(p)p.textContent=plan.text;
})();

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


// Jogos de descompressão — fases automáticas, sem ranking e otimizadas para toque/celular.
(()=>{
  const shuffle=(arr)=>{const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
  const choose=(arr,n)=>shuffle(arr).slice(0,n);
  const wait=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

  const phaseBadge=(root)=>{
    let badge=root.querySelector('.game-phase-badge');
    if(!badge){badge=document.createElement('span');badge.className='game-phase-badge';root.querySelector('.game-title-row > div')?.append(badge)}
    return badge;
  };

  const celebrate=async(root,title,subtitle)=>{
    root.classList.add('game-transitioning');
    let overlay=root.querySelector('.game-celebration');
    if(!overlay){overlay=document.createElement('div');overlay.className='game-celebration';overlay.setAttribute('aria-live','polite');root.append(overlay)}
    overlay.innerHTML=`<div><strong>✨ ${title}</strong><span>${subtitle}</span></div>`;
    overlay.classList.add('show');
    await wait(1800);
    overlay.classList.remove('show');
    await wait(180);
    root.classList.remove('game-transitioning');
  };

  const setupSortGame=({rootSel,itemsSel,zonesSel,messageSel,resetSel,pool,baseCount=8})=>{
    const root=document.querySelector(rootSel); if(!root)return;
    const tray=root.querySelector(itemsSel), zones=[...root.querySelectorAll(zonesSel)], msg=root.querySelector(messageSel), reset=root.querySelector(resetSel), badge=phaseBadge(root);
    let selected=null,remaining=0,phase=1,locked=false;

    const select=(btn)=>{
      if(locked||btn.disabled)return;
      root.querySelectorAll('.game-piece.selected').forEach(x=>x.classList.remove('selected'));
      selected=btn;btn.classList.add('selected');msg.textContent=`Agora toque em “${btn.dataset.label}”.`;
    };

    const newPhase=()=>{
      locked=false;selected=null;tray.innerHTML='';zones.forEach(z=>z.classList.remove('correct','wrong'));
      const count=Math.min(baseCount+(phase-1)*2,pool.length);
      const items=choose(pool,count);remaining=items.length;
      badge.textContent=`Fase ${phase}`;
      items.forEach(item=>{
        const b=document.createElement('button');b.type='button';b.className='game-piece';b.dataset.type=item.type;b.dataset.label=item.label;
        b.innerHTML=`<span>${item.icon}</span><small>${item.name}</small>`;b.addEventListener('click',()=>select(b));tray.append(b);
      });
      msg.textContent='Escolha um objeto para começar.';
    };

    const finishPhase=async()=>{
      locked=true;msg.textContent='Fase concluída! Preparando a próxima…';
      await celebrate(root,'Fase concluída!',`A fase ${phase+1} vai começar.`);
      phase++;newPhase();
    };

    zones.forEach(zone=>zone.addEventListener('click',()=>{
      if(locked)return;
      if(!selected){msg.textContent='Primeiro toque em um objeto.';return}
      if(zone.dataset.accept===selected.dataset.type){
        zone.classList.add('correct');selected.classList.add('placed');selected.disabled=true;selected=null;remaining--;
        if(remaining){msg.textContent=`Muito bem! Faltam ${remaining}.`}
        else finishPhase();
      }else{
        zone.classList.add('wrong');setTimeout(()=>zone.classList.remove('wrong'),450);msg.textContent='Esse objeto combina melhor com outro espaço.';
      }
    }));

    reset?.addEventListener('click',()=>{phase=1;newPhase()});newPhase();
  };

  setupSortGame({rootSel:'[data-organize-game]',itemsSel:'[data-organize-items]',zonesSel:'.sort-zone',messageSel:'[data-organize-message]',resetSel:'[data-reset-organize]',baseCount:8,pool:[
    {icon:'✏️',name:'Lápis',type:'papelaria',label:'Papelaria'},{icon:'🖊️',name:'Caneta',type:'papelaria',label:'Papelaria'},{icon:'📏',name:'Régua',type:'papelaria',label:'Papelaria'},{icon:'✂️',name:'Tesoura',type:'papelaria',label:'Papelaria'},{icon:'📎',name:'Clipes',type:'papelaria',label:'Papelaria'},{icon:'📒',name:'Caderno',type:'livros',label:'Livros'},{icon:'📚',name:'Livros',type:'livros',label:'Livros'},{icon:'📁',name:'Pasta',type:'livros',label:'Livros'},{icon:'💻',name:'Notebook',type:'tecnologia',label:'Tecnologia'},{icon:'🖱️',name:'Mouse',type:'tecnologia',label:'Tecnologia'},{icon:'📱',name:'Celular',type:'tecnologia',label:'Tecnologia'},{icon:'💡',name:'Luminária',type:'tecnologia',label:'Tecnologia'},{icon:'🪴',name:'Planta',type:'decoracao',label:'Decoração'},{icon:'🖼️',name:'Porta-retrato',type:'decoracao',label:'Decoração'},{icon:'🌼',name:'Flor',type:'decoracao',label:'Decoração'},{icon:'☕',name:'Caneca',type:'bebidas',label:'Bebidas'},{icon:'💧',name:'Água',type:'bebidas',label:'Bebidas'},{icon:'🧴',name:'Álcool em gel',type:'acessorios',label:'Acessórios'},{icon:'🎧',name:'Fone',type:'acessorios',label:'Acessórios'},{icon:'📌',name:'Grampeador',type:'acessorios',label:'Acessórios'}]});

  setupSortGame({rootSel:'[data-garden-game]',itemsSel:'[data-garden-items]',zonesSel:'.garden-zone',messageSel:'[data-garden-message]',resetSel:'[data-reset-garden]',baseCount:6,pool:[
    {icon:'🌷',name:'Tulipa',type:'flores',label:'Flores'},{icon:'🌻',name:'Girassol',type:'flores',label:'Flores'},{icon:'🌸',name:'Flor',type:'flores',label:'Flores'},{icon:'🪴',name:'Vaso',type:'vasos',label:'Vasos'},{icon:'🏺',name:'Vaso alto',type:'vasos',label:'Vasos'},{icon:'🪨',name:'Pedra',type:'pedras',label:'Pedras'},{icon:'◽',name:'Seixo',type:'pedras',label:'Pedras'},{icon:'💧',name:'Regador',type:'cuidados',label:'Cuidados'},{icon:'🧤',name:'Luvas',type:'cuidados',label:'Cuidados'},{icon:'🌱',name:'Muda',type:'cuidados',label:'Cuidados'},{icon:'🏮',name:'Lanterna',type:'vasos',label:'Vasos'},{icon:'🪑',name:'Banco',type:'pedras',label:'Pedras'}]});

  const colorRoot=document.querySelector('[data-color-game]');
  if(colorRoot){
    const palette=colorRoot.querySelector('[data-color-palette]'),sequence=colorRoot.querySelector('[data-color-sequence]'),msg=colorRoot.querySelector('[data-color-message]'),badge=phaseBadge(colorRoot);
    let order=[],step=0,phase=1,locked=false;
    const families=[['#fde8ef','#f9b9cf','#f47da7','#df3e75','#9f1749'],['#e8f1ff','#b7d2ff','#79a8f5','#3f72cf','#244693'],['#eaf8e9','#bde7b9','#82c879','#4c9d4b','#28622d'],['#fff4dd','#ffdca1','#ffb95c','#e98522','#9f4b10'],['#f2eaff','#d4bdf7','#ad87e5','#7d55bd','#4b2d7f'],['#e8fbfa','#afe9e5','#6bcac4','#319d98','#17625f']];
    const lum=x=>{x=x.slice(1);return .2126*parseInt(x.slice(0,2),16)+.7152*parseInt(x.slice(2,4),16)+.0722*parseInt(x.slice(4,6),16)};
    const finish=async()=>{locked=true;msg.textContent='Degradê concluído! Preparando a próxima fase…';await celebrate(colorRoot,'Fase concluída!',`Nova combinação em instantes.`);phase++;newColors()};
    const newColors=()=>{
      locked=false;badge.textContent=`Fase ${phase}`;
      const family=families[Math.floor(Math.random()*families.length)];
      const amount=Math.min(3+phase,5);const picked=family.slice(0,amount);const colors=shuffle(picked);
      order=[...picked].sort((a,b)=>lum(b)-lum(a));step=0;palette.innerHTML='';sequence.innerHTML='';
      colors.forEach(c=>{const b=document.createElement('button');b.type='button';b.className='color-piece';b.style.background=c;b.setAttribute('aria-label','Peça colorida');b.addEventListener('click',()=>{
        if(locked||b.disabled)return;
        if(c===order[step]){b.disabled=true;b.classList.add('used');const dot=document.createElement('span');dot.style.background=c;sequence.append(dot);step++;if(step===order.length)finish();else msg.textContent='Continue da mais clara para a mais escura.'}
        else{b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),400);msg.textContent='Tente uma cor um pouco mais clara.'}
      });palette.append(b)});msg.textContent='Comece pela peça mais clara.';
    };
    colorRoot.querySelector('[data-reset-colors]')?.addEventListener('click',()=>{phase=1;newColors()});newColors();
  }

  const bubbleRoot=document.querySelector('[data-bubble-game]');
  if(bubbleRoot){
    const board=bubbleRoot.querySelector('[data-bubble-board]'),msg=bubbleRoot.querySelector('[data-bubble-message]'),badge=phaseBadge(bubbleRoot);
    let phase=1,left=0,locked=false;
    const palettes=[['#79cfff','#819eea'],['#ffb3d1','#d98be7'],['#8fe0be','#64b99d'],['#ffd58f','#ff9b70']];

    const finish=async()=>{locked=true;msg.textContent='Todas as bolhas foram estouradas!';await celebrate(bubbleRoot,'Fase concluída!',`Preparando a fase ${phase+1}.`);phase++;fill()};

    const fill=()=>{
      locked=false;board.innerHTML='';badge.textContent=`Fase ${phase}`;
      const count=Math.min(18+(phase-1)*3,42);left=count;
      const minSize=Math.max(34,58-(phase-1)*3),maxSize=Math.max(minSize+10,78-(phase-1)*2);
      const boardHeight=Math.min(410,260+(phase-1)*18);board.style.height=`${boardHeight}px`;
      const colors=palettes[(phase-1)%palettes.length];
      const rectWidth=Math.max(board.clientWidth||320,280);

      for(let i=0;i<count;i++){
        const size=minSize+Math.floor(Math.random()*(maxSize-minSize+1));
        const b=document.createElement('button');b.type='button';b.className='bubble';b.setAttribute('aria-label',`Estourar bolha ${i+1}`);
        b.style.setProperty('--size',`${size}px`);b.style.setProperty('--bubble-a',colors[0]);b.style.setProperty('--bubble-b',colors[1]);
        const x=Math.max(0,Math.floor(Math.random()*Math.max(1,rectWidth-size-8)));
        const y=Math.max(0,Math.floor(Math.random()*Math.max(1,boardHeight-size-8)));
        b.style.left=`${x}px`;b.style.top=`${y}px`;b.style.zIndex=String(1+Math.floor(Math.random()*count));
        b.addEventListener('click',()=>{
          if(locked||b.classList.contains('popped'))return;
          b.classList.add('popped');left--;if(navigator.vibrate)navigator.vibrate(18);
          if(left){msg.textContent=`${left} bolhas restantes. Sem pressa.`}else finish();
        });board.append(b);
      }
      msg.textContent='As bolhas estão sobrepostas novamente. Estoure no seu ritmo.';
    };
    bubbleRoot.querySelector('[data-reset-bubbles]')?.addEventListener('click',()=>{phase=1;fill()});
    requestAnimationFrame(fill);
  }
})();

// Três piadas diárias, sem tirinhas ou charges.
(()=>{const box=document.querySelector('[data-daily-jokes-list]');if(!box)return;const jokes=[
"Por que o livro de matemática ficou triste? Porque tinha muitos problemas.","O que o zero disse para o oito? Que cinto bonito!","O café foi ao médico porque estava muito passado.","O que uma impressora disse para a outra? Essa folha é sua ou é impressão minha?","Por que o computador foi ao médico? Porque estava com um vírus.","Qual é o contrário de volátil? Vem cá, sobrinho!","Por que o lápis foi promovido? Porque estava sempre apontando boas ideias.","O que o relógio fez quando ficou com fome? Foi comer um segundo.","Por que a agenda foi trabalhar feliz? Porque tinha um dia cheio de possibilidades.","O que a caneta disse ao papel? Você deixa tudo muito bem escrito.","Por que a cadeira foi elogiada? Porque sempre dava apoio.","O que o café disse para o açúcar? Sem você, minha vida fica amarga.","Por que o celular colocou óculos? Porque perdeu os contatos.","O que a borracha disse ao lápis? Pode errar, estou aqui para ajudar.","Por que o calendário é tão popular? Porque tem muitos encontros.","O que a lâmpada disse ao interruptor? Você me liga.","Por que o caderno estava tranquilo? Porque tinha tudo anotado.","O que uma parede disse para a outra? A gente se encontra na esquina.","Por que a vassoura não se atrasou? Porque saiu varrendo.","O que o tomate foi fazer no banco? Tirar extrato.","Por que o pão não contou o segredo? Porque era assunto de família.","O que a nuvem disse para o céu? Estou passada.","Por que o elevador é educado? Porque sempre dá espaço para subir.","O que a régua disse ao lápis? Pode contar comigo.","Por que o sapato foi para a escola? Para aprender a dar bons passos.","O que uma xícara disse para a outra? Você é chá-rmosa.","Por que o ventilador é bom de conversa? Porque sempre puxa assunto.","O que a porta disse para a chave? Você abre meu coração.","Por que a mochila estava animada? Porque estava cheia de planos.","O que o espelho respondeu? Reflita sobre isso."
];const d=Math.floor(new Date(new Date().setHours(0,0,0,0)).getTime()/86400000);const start=((d*3)%jokes.length+jokes.length)%jokes.length;box.innerHTML=[0,1,2].map((n,i)=>`<article class="joke-card"><span>${i+1}</span><p>${jokes[(start+n)%jokes.length]}</p></article>`).join('');})();
