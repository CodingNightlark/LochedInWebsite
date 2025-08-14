(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- PALETTES ---------- */
  const palettes = [
    { bg:"#fffaf2", ink:"#131313", a:"#ff5dad", b:"#00c2ff", c:"#ffd166", d:"#00f5a0" },
    { bg:"#fff7ff", ink:"#1e1b1b", a:"#ff8a05", b:"#9340ff", c:"#00e5ff", d:"#ffe800" },
    { bg:"#fbfff3", ink:"#161616", a:"#ff3d81", b:"#00bcd4", c:"#ffea00", d:"#00e676" },
    { bg:"#fff6ec", ink:"#101010", a:"#ff6ec7", b:"#00a3ff", c:"#ffd54f", d:"#00ffbd" },
    { bg:"#f9f5ff", ink:"#17131e", a:"#ff4d6d", b:"#3bc9db", c:"#ffd43b", d:"#69db7c" }
  ];

  function applyPalette(p) {
    const r = document.documentElement;
    r.style.setProperty('--bg', p.bg);
    r.style.setProperty('--ink', p.ink);
    r.style.setProperty('--a', p.a);
    r.style.setProperty('--b', p.b);
    r.style.setProperty('--c', p.c);
    r.style.setProperty('--d', p.d);
  }

  let currentPalette = palettes[Math.floor(Math.random()*palettes.length)];
  applyPalette(currentPalette);

  /* ---------- RANDOM FLOATING STICKERS ---------- */
  const floaters = document.getElementById('floaters');
  const words = ['hack','ship','wow','scotland','nessie','merge','push','craft','glory','tea'];
  for (let i=0; i<8; i++){
    const s = document.createElement('div');
    s.className = 'sticker floater';
    s.textContent = words[Math.floor(Math.random()*words.length)];
    s.style.left = (Math.random()*90 + 5) + 'vw';
    s.style.top  = (Math.random()*70 + 10) + 'vh';
    s.style.setProperty('--rot', (Math.random()*6-3)+'deg');
    s.style.zIndex = 0;
    floaters.appendChild(s);
  }

  /* ---------- DRAGGABLE ---------- */
  document.querySelectorAll('.draggable').forEach(el => {
    let startX=0, startY=0, x=0, y=0, dragging=false;

    const onDown = e => {
      dragging = true; el.style.transition = 'none';
      startX = (e.touches? e.touches[0].clientX : e.clientX) - x;
      startY = (e.touches? e.touches[0].clientY : e.clientY) - y;
      el.classList.add('dragging');
    };
    const onMove = e => {
      if(!dragging) return;
      x = (e.touches? e.touches[0].clientX : e.clientX) - startX;
      y = (e.touches? e.touches[0].clientY : e.clientY) - startY;
      el.style.transform = `translate(${x}px, ${y}px) rotate(2deg)`;
    };
    const onUp = () => { dragging=false; el.classList.remove('dragging'); el.style.transition='transform .15s ease'; };
    el.addEventListener('mousedown', onDown); el.addEventListener('touchstart', onDown, {passive:true});
    window.addEventListener('mousemove', onMove); window.addEventListener('touchmove', onMove, {passive:true});
    window.addEventListener('mouseup', onUp); window.addEventListener('touchend', onUp);
  });

  /* ---------- RANDOM TILT SEEDS ---------- */
  document.querySelectorAll('.tilty').forEach(el => {
    el.style.setProperty('--seed', Math.random().toString());
  });

  /* ---------- REVEAL ON SCROLL ---------- */
  const io = new IntersectionObserver((entries)=> {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('show'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  /* ---------- SCRIBBLE BACKGROUND (canvas) ---------- */
  const c = document.getElementById('scribbles');
  const ctx = c.getContext('2d');
  let w=0, h=0, dpr=1, t=0;

  function resize(){
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = c.width = Math.floor(innerWidth * dpr);
    h = c.height = Math.floor(innerHeight * dpr);
    c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px';
  }
  resize(); addEventListener('resize', resize);

  const lines = Array.from({length: 16}, (_,i) => ({
    x: Math.random()*w, y: Math.random()*h,
    vx: (Math.random()*2-1)*0.6, vy: (Math.random()*2-1)*0.6,
    hue: i%4
  }));

  function colFor(hue){
    const map = [getComputedStyle(document.documentElement).getPropertyValue('--a'),
                 getComputedStyle(document.documentElement).getPropertyValue('--b'),
                 getComputedStyle(document.documentElement).getPropertyValue('--c'),
                 getComputedStyle(document.documentElement).getPropertyValue('--d')].map(s=>s.trim());
    return map[hue % map.length] || '#ff00ff';
  }

  function draw(){
    if (prefersReduced) return;

    t += 0.016;
    ctx.clearRect(0,0,w,h);
    ctx.globalAlpha = 0.8;

    lines.forEach((L,i)=>{
      // move with slight wander
      L.vx += (Math.random()*0.4-0.2);
      L.vy += (Math.random()*0.4-0.2);
      L.vx *= 0.98; L.vy *= 0.98;
      L.x += L.vx; L.y += L.vy;

      // wrap
      if (L.x<0) L.x+=w; if (L.x>w) L.x-=w;
      if (L.y<0) L.y+=h; if (L.y>h) L.y-=h;

      // squiggle
      ctx.strokeStyle = colFor(L.hue);
      ctx.lineWidth = 2 * dpr;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const ox = Math.sin(t*2 + i)*12*dpr;
      const oy = Math.cos(t*2.3 + i)*12*dpr;
      ctx.moveTo(L.x, L.y);
      ctx.bezierCurveTo(L.x+ox, L.y-oy, L.x-ox, L.y+oy, L.x+ox*0.6, L.y+oy*0.6);
      ctx.stroke();
    });

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);

  /* ---------- HOVER RIPPLE (mouse position → CSS vars) ---------- */
  document.querySelectorAll('.hover-wobble, .sticker, .card').forEach(el=>{
    el.addEventListener('mousemove', e=>{
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- CONFETTI (paper squares) ---------- */
  const confettiBtn = document.getElementById('confetti');
  confettiBtn?.addEventListener('click', ()=>{
    if (prefersReduced) return;
    for (let i=0;i<120;i++){
      const s = document.createElement('i');
      s.className = 'confetti';
      s.style.left = '50%';
      s.style.top = '62%';
      s.style.setProperty('--tx', (Math.random()*800 - 400) + 'px');
      s.style.setProperty('--ty', (Math.random()*-400 - 120) + 'px');
      s.style.background = i%4===0 ? getComputedStyle(document.documentElement).getPropertyValue('--a') :
                           i%4===1 ? getComputedStyle(document.documentElement).getPropertyValue('--b') :
                           i%4===2 ? getComputedStyle(document.documentElement).getPropertyValue('--c') :
                                     getComputedStyle(document.documentElement).getPropertyValue('--d');
      document.body.appendChild(s);
      setTimeout(()=>s.remove(), 1600);
    }
  });

  /* ---------- CHAOS & RANDOMIZE ---------- */
  document.getElementById('randomize').addEventListener('click', ()=>{
    currentPalette = palettes[(palettes.indexOf(currentPalette)+1)%palettes.length];
    applyPalette(currentPalette);
  });

  let chaos = false;
  document.getElementById('chaos').addEventListener('click', ()=>{
    chaos = !chaos;
    document.body.classList.toggle('chaos', chaos);
    // extra floaters on chaos
    if (chaos){
      for (let i=0;i<6;i++){
        const star = document.createElement('div');
        star.className = 'sticker floater';
        star.textContent = '★';
        star.style.left = (Math.random()*90 + 5) + 'vw';
        star.style.top  = (Math.random()*70 + 10) + 'vh';
        star.style.setProperty('--rot', (Math.random()*20-10)+'deg');
        floaters.appendChild(star);
      }
    } else {
      document.querySelectorAll('.floater').forEach((el,idx)=>{ if (idx>=8) el.remove(); });
    }
  });

  /* ---------- minor: add seed rotations on load ---------- */
  document.querySelectorAll('.sticker, .polaroid').forEach(el=>{
    const r = (Math.random()*2-1).toFixed(2);
    el.style.setProperty('--rot', r+'deg');
  });

  /* ---------- confetti CSS (injected minimal) ---------- */
  const style = document.createElement('style');
  style.textContent = `    
    .confetti{    
      position: fixed; width:10px; height:10px; border-radius:2px;
      transform: translate(-50%,-50%); animation: pop 1.1s cubic-bezier(.2,.7,.3,1);
      will-change: transform, opacity; z-index: 60;
    }
    @keyframes pop{
      0%{ opacity:1; transform: translate(-50%,-50%) rotate(0deg) }
      100%{ opacity:0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) rotate(720deg) }
    }
  `;
  document.head.appendChild(style);

})();
