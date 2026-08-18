(()=>{
  const canvas=document.querySelector('#c');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const N=15,T=28,C=420;
  const levelEl=document.querySelector('#lv');
  const scoreEl=document.querySelector('#sc');
  const msg=document.querySelector('#m');

  let level=1,score=0,walls=new Set(),stars=[];
  let player,enemy,running=true,lost=false,last=performance.now(),transition=false;
  const key=(x,y)=>`${x},${y}`;
  const DIRS={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};

  const atCenter=o=>Math.abs(o.x-Math.round(o.x))<0.09&&Math.abs(o.y-Math.round(o.y))<0.09;
  const canMove=(o,d)=>{
    if(!d)return false;
    const gx=Math.round(o.x),gy=Math.round(o.y);
    return !walls.has(key(gx+d.x,gy+d.y));
  };
  const snap=o=>{o.x=Math.round(o.x);o.y=Math.round(o.y)};

  function buildWalls(){
    walls=new Set();
    for(let i=0;i<N;i++){
      walls.add(key(i,0));walls.add(key(i,N-1));walls.add(key(0,i));walls.add(key(N-1,i));
    }
    const bars=2+Math.floor(level/2);
    for(let q=0;q<bars;q++){
      const x=3+q*3;
      if(x>=N-1)break;
      for(let y=2;y<N-2;y++) if((y+q*2)%5!==0) walls.add(key(x,y));
    }
    walls.delete(key(1,1));walls.delete(key(N-2,N-2));
  }

  function setup(){
    buildWalls();
    player={x:1,y:1,dir:null,want:null,target:null,speed:4.15};
    enemy={x:N-2,y:N-2,dir:null,target:null,speed:Math.min(2.05+level*.13,3.25)};
    stars=[];
    const amount=Math.min(5+level*2,24);
    const free=[];
    for(let y=1;y<N-1;y++)for(let x=1;x<N-1;x++){
      if(!walls.has(key(x,y))&&!(x===1&&y===1)&&!(x===N-2&&y===N-2))free.push({x,y});
    }
    for(let i=free.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[free[i],free[j]]=[free[j],free[i]]}
    stars=free.slice(0,amount);
    running=true;lost=false;transition=false;
    msg.textContent='Colete todas as estrelas e fuja do inimigo! 👾';
    levelEl.textContent=level;
    draw();
  }

  function requestDirection(d){
    if(lost){setup();}
    if(!running||transition)return;
    player.want=d;
    if(!player.dir&&atCenter(player)&&canMove(player,d)){snap(player);player.dir=d;}
  }

  function moveEntity(o,dt,isPlayer=false){
    let remaining=o.speed*dt;
    while(remaining>0.0001){
      if(!o.target){
        snap(o);
        if(isPlayer&&o.want&&canMove(o,o.want))o.dir=o.want;
        if(!o.dir||!canMove(o,o.dir)){o.dir=null;return;}
        o.target={x:o.x+o.dir.x,y:o.y+o.dir.y};
      }
      const dx=o.target.x-o.x,dy=o.target.y-o.y;
      const dist=Math.hypot(dx,dy);
      if(dist<=remaining+.0001){
        o.x=o.target.x;o.y=o.target.y;remaining-=dist;o.target=null;
        if(isPlayer&&o.want&&canMove(o,o.want))o.dir=o.want;
        if(!isPlayer)return;
      }else{
        o.x+=dx/dist*remaining;o.y+=dy/dist*remaining;remaining=0;
      }
    }
  }

  function chooseEnemyDirection(){
    if(enemy.target)return;
    snap(enemy);
    const options=Object.values(DIRS).filter(d=>canMove(enemy,d));
    if(!options.length){enemy.dir=null;return;}
    const reverse=enemy.dir&&{x:-enemy.dir.x,y:-enemy.dir.y};
    let candidates=options;
    if(reverse&&options.length>1)candidates=options.filter(d=>d.x!==reverse.x||d.y!==reverse.y);
    candidates.sort((a,b)=>{
      const da=Math.abs(enemy.x+a.x-player.x)+Math.abs(enemy.y+a.y-player.y);
      const db=Math.abs(enemy.x+b.x-player.x)+Math.abs(enemy.y+b.y-player.y);
      return da-db;
    });
    enemy.dir=Math.random()<0.78?candidates[0]:candidates[Math.floor(Math.random()*candidates.length)];
  }

  function collect(){
    const i=stars.findIndex(s=>Math.hypot(s.x-player.x,s.y-player.y)<.24);
    if(i<0)return;
    stars.splice(i,1);score++;scoreEl.textContent=score;
    if(stars.length===0)finishLevel();
  }

  function finishLevel(){
    running=false;transition=true;
    if(level===10){msg.textContent='🏆 Você completou o Come-Come! Pequenas pausas também fazem bem. 💛';transition=false;return;}
    msg.textContent='🌟 Fase concluída!';
    setTimeout(()=>{level++;setup()},850);
  }

  function checkHit(){
    if(Math.hypot(player.x-enemy.x,player.y-enemy.y)<.62){
      running=false;lost=true;player.dir=null;player.target=null;enemy.dir=null;enemy.target=null;
      msg.textContent='👾 O inimigo pegou você! Toque em uma direção para tentar novamente.';
    }
  }

  function update(dt){
    if(!running)return;
    moveEntity(player,dt,true);
    collect();
    chooseEnemyDirection();
    moveEntity(enemy,dt,false);
    checkHit();
  }

  function draw(){
    ctx.fillStyle='#173f33';ctx.fillRect(0,0,C,C);
    ctx.fillStyle='#68b6df';
    walls.forEach(v=>{const [x,y]=v.split(',').map(Number);ctx.fillRect(x*T+2,y*T+2,T-4,T-4)});
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='20px Arial';
    stars.forEach(s=>ctx.fillText('⭐',s.x*T+T/2,s.y*T+T/2));

    const px=player.x*T+T/2,py=player.y*T+T/2;
    let angle=0;if(player.dir){if(player.dir.x<0)angle=Math.PI;else if(player.dir.y<0)angle=-Math.PI/2;else if(player.dir.y>0)angle=Math.PI/2;}
    const mouth=.22+.12*Math.abs(Math.sin(performance.now()/105));
    ctx.fillStyle='#f6c344';ctx.beginPath();ctx.moveTo(px,py);ctx.arc(px,py,10,angle+mouth,angle+Math.PI*2-mouth);ctx.closePath();ctx.fill();

    const ex=enemy.x*T+T/2,ey=enemy.y*T+T/2;
    ctx.fillStyle='#d95d63';ctx.beginPath();ctx.arc(ex,ey-1,10,Math.PI,0);ctx.lineTo(ex+10,ey+9);ctx.lineTo(ex+5,ey+5);ctx.lineTo(ex,ey+9);ctx.lineTo(ex-5,ey+5);ctx.lineTo(ex-10,ey+9);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex-4,ey-2,2.4,0,Math.PI*2);ctx.arc(ex+4,ey-2,2.4,0,Math.PI*2);ctx.fill();
  }

  function loop(now){
    const dt=Math.min((now-last)/1000,.035);last=now;
    update(dt);draw();requestAnimationFrame(loop);
  }

  document.querySelectorAll('[data-dir]').forEach(btn=>{
    const [x,y]=btn.dataset.dir.split(',').map(Number);
    const dir={x,y};
    btn.addEventListener('pointerdown',e=>{e.preventDefault();requestDirection(dir)});
  });

  window.addEventListener('keydown',e=>{
    const map={ArrowUp:DIRS.up,ArrowDown:DIRS.down,ArrowLeft:DIRS.left,ArrowRight:DIRS.right,w:DIRS.up,W:DIRS.up,s:DIRS.down,S:DIRS.down,a:DIRS.left,A:DIRS.left,d:DIRS.right,D:DIRS.right};
    const dir=map[e.key];if(!dir)return;e.preventDefault();requestDirection(dir);
  },{passive:false});

  setup();requestAnimationFrame(loop);
})();
