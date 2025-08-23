(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Year (both spots)
  const y = String(new Date().getFullYear());
  const y1 = document.getElementById('year');  if (y1) y1.textContent = y;
  const y2 = document.getElementById('year2'); if (y2) y2.textContent = y;

  /* Reveal on scroll */
  const io = new IntersectionObserver((ents)=>ents.forEach(e=>{
    if (e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target); }
  }), {threshold:.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  /* Register modal (guarded) */
  const regModal = document.getElementById('register-modal');
  if (regModal) {
    ['open-register','open-register-hero']
      .map(id=>document.getElementById(id))
      .filter(Boolean)
      .forEach(btn=>btn.addEventListener('click', ()=>regModal.showModal()));
    document.getElementById('close-register')?.addEventListener('click', ()=>regModal.close());
  }

  const dl = document.getElementById('download-prospectus');
if (dl) {
  dl.addEventListener('click', async (e) => {
    // If the simple download attr already works, remove this block.
    e.preventDefault();
    const url = dl.getAttribute('href');
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'LochdIn_Sponsor_Prospectus.pdf';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    } catch (err) {
      console.error('Download failed', err);
      // Fallback: just navigate to the file
      location.href = url;
    }
  });
}

  /* Whiteboard code marks (<> {} etc) */
  const MARKS = ["<>","{ }","()</>","=>","let","</>","λ","∑","if()","while()","{;}","/* */","</","fn()","return;","const","std::","class{}","<script>"];
  const marksHost = document.getElementById('marks');
  let marksEls = [], mouse = { x:-1, y:-1 }, rafId = null;

  function renderMarks(){
    if (!marksHost) return;
    marksHost.innerHTML = ""; marksEls.length = 0;

    const w = innerWidth, h = innerHeight;
    const target = Math.min(36, Math.max(16, Math.floor(w*h/60000)));
    const PAD = 10, MAX_TRIES = 80;
    const placed = [];

    for (let i=0;i<target;i++){
      let tries=0, ok=false, el;
      while(tries++<MAX_TRIES && !ok){
        el = document.createElement('span');
        el.textContent = MARKS[(Math.random()*MARKS.length)|0];

        const rot = (Math.random()*140 - 70).toFixed(2);
        const scale = (1.15 + Math.random()*1.0).toFixed(2);
        const base = (Math.random()*0.25 + 0.45); // stronger base opacity

        el.style.setProperty('--r', rot+'deg');
        el.style.setProperty('--s', scale);
        el.style.opacity = base.toFixed(2);
        el.dataset.base = base.toString();

        const x = Math.random()*(w-40) + 20, y = Math.random()*(h-40) + 20;
        el.style.left = x+'px'; el.style.top = y+'px';
        el.style.visibility = 'hidden';
        marksHost.appendChild(el);

        const r = el.getBoundingClientRect();
        const rect = { left:r.left-PAD, top:r.top-PAD, right:r.right+PAD, bottom:r.bottom+PAD };
        const collides = placed.some(q => !(rect.right<q.left || rect.left>q.right || rect.bottom<q.top || rect.top>q.bottom));
        if (!collides){
          el.style.visibility = 'visible';
          placed.push(rect);
          el.dataset.x = ((rect.left + rect.right)/2).toFixed(1);
          el.dataset.y = ((rect.top + rect.bottom)/2).toFixed(1);
          marksEls.push(el);
          ok = true;
        } else {
          el.remove();
        }
      }
      if (!ok) break;
    }
  }

  function proxDarken(){
    rafId = null;
    if (mouse.x < 0) return;
    const R = Math.max(140, Math.min(300, Math.hypot(innerWidth, innerHeight)*0.12));
    for (const el of marksEls){
      const ex = parseFloat(el.dataset.x), ey = parseFloat(el.dataset.y);
      const dist = Math.hypot(ex - mouse.x, ey - mouse.y);
      const base = parseFloat(el.dataset.base);
      const boost = Math.max(0, 1 - (dist / R));
      el.style.opacity = Math.min(1, base + boost*0.35).toFixed(2);
      el.style.filter  = boost > 0 ? `contrast(${1+boost*0.25}) brightness(${1-boost*0.08})` : 'none';
    }
  }

  renderMarks();
  addEventListener('pointermove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; if(!rafId) rafId=requestAnimationFrame(proxDarken); }, {passive:true});
  addEventListener('resize', ()=>{ clearTimeout(window.__mkMarks); window.__mkMarks = setTimeout(renderMarks, 150); });

  /* Optional canvas squiggles (behind everything) */
  const canvas = document.getElementById('scribbles');
  if (canvas && canvas.getContext && !prefersReduced){
    const ctx = canvas.getContext('2d');
    let w=0, h=0, dpr=1, t=0;

    function resize(){
      dpr = Math.min(2, devicePixelRatio || 1);
      w = canvas.width  = Math.floor(innerWidth  * dpr);
      h = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width  = innerWidth  + 'px';
      canvas.style.height = innerHeight + 'px';
    }
    resize(); addEventListener('resize', resize);

    const lines = Array.from({length: 16}, (_,i)=>({
      x: Math.random()*w, y: Math.random()*h,
      vx:(Math.random()*2-1)*0.6, vy:(Math.random()*2-1)*0.6, hue:i%4
    }));

    function colFor(hue){
      const cs = getComputedStyle(document.documentElement);
      const map = [cs.getPropertyValue('--a'), cs.getPropertyValue('--b'), cs.getPropertyValue('--c'), cs.getPropertyValue('--d')].map(s=>s.trim());
      return map[hue % map.length] || '#22d3ee';
    }

    (function draw(){
      t += 0.016;
      ctx.clearRect(0,0,w,h);
      ctx.globalAlpha = 0.8;
      ctx.lineCap = 'round';

      lines.forEach((L,i)=>{
        L.vx += (Math.random()*0.4-0.2);
        L.vy += (Math.random()*0.4-0.2);
        L.vx *= 0.98; L.vy *= 0.98;
        L.x += L.vx; L.y += L.vy;

        if (L.x<0) L.x+=w; if (L.x>w) L.x-=w;
        if (L.y<0) L.y+=h; if (L.y>h) L.y-=h;

        ctx.strokeStyle = colFor(L.hue);
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath();
        const ox = Math.sin(t*2 + i)*12*dpr;
        const oy = Math.cos(t*2.3 + i)*12*dpr;
        ctx.moveTo(L.x, L.y);
        ctx.bezierCurveTo(L.x+ox, L.y-oy, L.x-ox, L.y+oy, L.x+ox*0.6, L.y+oy*0.6);
        ctx.stroke();
      });

      requestAnimationFrame(draw);
    })();
  }
})();
