// script.js
// No external libs. All interactive behavior for the site.
// Works mobile-first. Handles pages, PIN, gallery swipe, particles, hearts, confetti/fireworks, music playback.

// Diagnostic log to confirm script execution in deployed pages (no functional change)
console.log('noorab-birthday: script.js loaded');

(function () {
  // Run only after DOM is parsed to avoid timing-related null references.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    /* ------- Utilities ------- */
    const $ = selector => document.querySelector(selector);
    const $$ = selector => Array.from(document.querySelectorAll(selector));
    const pages = {
      lock: $('#page-lock'),
      pin: $('#page-pin'),
      welcome: $('#page-welcome'),
      birthday: $('#page-birthday'),
      gallery: $('#page-gallery'),
      letter: $('#page-letter'),
      final: $('#page-final')
    };

    // Simple page navigation with nice transitions
    function showPage(name) {
      Object.keys(pages).forEach(k=>{
        if (!pages[k]) return;
        if (k === name) {
          pages[k].classList.add('active');
          pages[k].classList.remove('fade-out');
        } else if (pages[k].classList.contains('active')) {
          pages[k].classList.remove('active');
          pages[k].classList.add('fade-out');
        } else {
          pages[k].classList.remove('active','fade-out');
        }
      });
      // some pages trigger visual effects
      if (name === 'gallery') requestAnimationFrame(()=>galleryRefresh());
      if (name === 'final') startConfetti();
    }

    /* ------- Floating background particles & hearts ------- */
    const bgCanvas = document.getElementById('bgCanvas');
    const ctx = bgCanvas ? bgCanvas.getContext('2d') : null;
    let particles = [];
    function resizeCanvas() {
      if (!bgCanvas) return;
      bgCanvas.width = innerWidth;
      bgCanvas.height = innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function initParticles() {
      if (!bgCanvas || !ctx) return;
      particles = [];
      const count = Math.round((innerWidth*innerHeight)/80000);
      for (let i=0;i<count;i++){
        particles.push({
          x: Math.random()*bgCanvas.width,
          y: Math.random()*bgCanvas.height,
          r: Math.random()*1.7 + 0.6,
          v: (Math.random()*0.4 + 0.1),
          a: Math.random()*Math.PI*2,
          color: `rgba(183,28,28,${0.04 + Math.random()*0.06})`
        });
      }
    }
    initParticles();
    function renderParticles() {
      if (!ctx || !bgCanvas) return;
      ctx.clearRect(0,0,bgCanvas.width,bgCanvas.height);
      particles.forEach(p=>{
        p.y -= p.v;
        if (p.y < -10){ p.y = bgCanvas.height + 10; p.x = Math.random()*bgCanvas.width; }
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fill();
      });
      requestAnimationFrame(renderParticles);
    }
    renderParticles();

    // floating hearts generated into #floating-hearts
    const heartsRoot = $('#floating-hearts');
    function spawnHeart() {
      if (!heartsRoot) return;
      const heart = document.createElement('div');
      heart.className = 'heart';
      const size = 12 + Math.random()*28;
      heart.style.width = `${size}px`;
      heart.style.height = `${size}px`;
      heart.style.left = `${Math.random()*100}%`;
      heart.style.top = `${60 + Math.random()*40}%`;
      heart.style.opacity = (0.4 + Math.random()*0.8).toFixed(2);
      // heart SVG
      heart.innerHTML = `
        <svg viewBox="0 0 32 32" width="${size}" height="${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M23.2 4.8c-2.6 0-4.9 1.6-6.2 3.9-1.3-2.3-3.6-3.9-6.2-3.9C5 4.8 2 8 2 12.5c0 8 14 14.7 14 14.7s14-6.7 14-14.7C30 8 27 4.8 23.2 4.8z" fill="url(#g)"/>
          <defs>
            <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stop-color="rgba(255,45,85,0.95)"/>
              <stop offset="1" stop-color="rgba(183,28,28,0.95)"/>
            </linearGradient>
          </defs>
        </svg>`;
      heartsRoot.appendChild(heart);
      // animate float upward and fade
      const duration = 6000 + Math.random()*8000;
      heart.animate([
        { transform: `translateY(0) scale(${0.9+Math.random()*0.3})`, opacity: heart.style.opacity },
        { transform: `translateY(-180vh) rotate(${(Math.random()*80-40)}deg) scale(${1.1+Math.random()*0.5})`, opacity: 0 }
      ], { duration, easing: 'linear' });
      setTimeout(()=>heart.remove(), duration);
    }
    // create random hearts periodically
    setInterval(spawnHeart, 800);

    /* ------- Lock screen interaction ------- */
    const profileBtn = $('#profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', ()=> {
        showPage('pin');
        // small focus on keypad when entering
        setTimeout(()=>$('#keypad button')?.focus(), 500);
      });
      profileBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          profileBtn.click();
        }
      });
    } else {
      console.warn('profileBtn not found — clicks will not be attached.');
    }

    /* ------- PIN logic ------- */
    const keypadRoot = $('#keypad');
    const pinDots = $('#pinDots');
    const pinMessage = $('#pinMessage');
    const CORRECT_PIN = '2007';
    let currentPIN = '';

    function updatePINDisplay() {
      if (!pinDots || !pinMessage) return;
      pinDots.innerHTML = '';
      for (let i=0;i<4;i++){
        const dot = document.createElement('div');
        dot.className = 'dot' + (i < currentPIN.length ? ' filled' : '');
        pinDots.appendChild(dot);
      }
      pinMessage.textContent = currentPIN.length ? `${currentPIN.length} / 4 entered` : 'Enter your 4-digit passkey';
    }

    function createKeypad() {
      if (!keypadRoot) return;
      keypadRoot.innerHTML = '';
      // Create digits 1-9 then 0
      for (let d of ['1','2','3','4','5','6','7','8','9']){
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.type = 'button';
        btn.innerHTML = `<div>${d}</div>`;
        btn.setAttribute('data-digit', d);
        btn.addEventListener('click', onDigit);
        keypadRoot.appendChild(btn);
      }
      // blank placeholder to keep layout centered
      const placeholder = document.createElement('div');
      placeholder.className = 'key' ;
      placeholder.style.visibility = 'hidden';
      keypadRoot.appendChild(placeholder);

      const zeroBtn = document.createElement('button');
      zeroBtn.className = 'key';
      zeroBtn.type = 'button';
      zeroBtn.innerHTML = `<div>0</div>`;
      zeroBtn.setAttribute('data-digit','0');
      zeroBtn.addEventListener('click', onDigit);
      keypadRoot.appendChild(zeroBtn);
    }

    function onDigit(e){
      if (currentPIN.length >= 4) return;
      currentPIN += e.currentTarget.getAttribute('data-digit');
      updatePINDisplay();
      if (currentPIN.length === 4) {
        setTimeout(validatePIN, 250);
      }
    }

    createKeypad();
    updatePINDisplay();

    const pinClearBtn = $('#pinClear');
    const pinBackBtn = $('#pinBack');

    if (pinClearBtn) {
      pinClearBtn.addEventListener('click', ()=> {
        currentPIN = '';
        updatePINDisplay();
      });
    }
    if (pinBackBtn) {
      pinBackBtn.addEventListener('click', ()=> {
        currentPIN = currentPIN.slice(0,-1);
        updatePINDisplay();
      });
    }

    // shake animation for wrong PIN
    function wrongPINFeedback() {
      const card = $('.pin-card') || $('#page-pin .glass-card');
      if (card) card.style.animation = 'shake 600ms';
      if (pinMessage) pinMessage.textContent = 'Wrong Passkey ❤️';
      setTimeout(()=>{ if (card) card.style.animation = ''; if (pinMessage) pinMessage.textContent = 'Try again'; }, 650);
      currentPIN = '';
      updatePINDisplay();
      // small heart pop
      spawnHeart();
    }

    const bgMusic = $('#bgMusic');

    // unlock animation: small glow and transition to welcome
    function correctPINFeedback() {
      const card = $('.pin-card') || $('#page-pin .glass-card');
      if (card) {
        card.animate([
          { transform: 'scale(1)', boxShadow: 'var(--shadow)' },
          { transform: 'scale(1.03)', boxShadow: '0 30px 80px rgba(183,28,28,0.26)' },
          { transform: 'scale(1)', boxShadow: 'var(--shadow)' }
        ], { duration: 700, easing: 'ease-out' });
      }
      if (pinMessage) pinMessage.textContent = 'Unlocked';
      // Start music because it's a user gesture context (PIN entry)
      try {
        if (bgMusic) { bgMusic.currentTime = 0; bgMusic.play().catch(()=>{}); }
      } catch(err){}
      // tiny delay to show unlock then go to welcome
      setTimeout(()=> showPage('welcome'), 700);
    }

    function validatePIN() {
      if (currentPIN === CORRECT_PIN) {
        correctPINFeedback();
        currentPIN = '';
        updatePINDisplay();
      } else {
        wrongPINFeedback();
      }
    }

    /* ------- Welcome button -> Birthday page ------- */
    const beginBtn = $('#beginBtn');
    if (beginBtn) beginBtn.addEventListener('click', ()=> showPage('birthday'));

    /* ------- Birthday: calculate age ------- */
    function calcAge(dobStr) {
      const dob = new Date(dobStr);
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
      return age;
    }
    function updateAgeDisplay() {
      const ageElem = $('#ageYears');
      if (!ageElem) return;
      const age = calcAge('2007-07-19'); // YYYY-MM-DD
      ageElem.textContent = `${age} years`;
    }
    updateAgeDisplay();

    const memoriesBtn = $('#memoriesBtn');
    if (memoriesBtn) memoriesBtn.addEventListener('click', ()=> showPage('gallery'));

    /* ------- Gallery slider + swipe support ------- */
    const carousel = $('#carousel');
    let isDown=false, startX, scrollLeft;
    function galleryRefresh(){ /* no-op placeholder to match original logic */ }

    if (carousel) {
      // pointer/mouse events for swipe
      carousel.addEventListener('pointerdown', (e) => {
        isDown = true;
        try { carousel.setPointerCapture(e.pointerId); } catch(_) {}
        carousel.classList.add('dragging');
        startX = e.clientX;
        scrollLeft = carousel.scrollLeft;
      });
      carousel.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const walk = (startX - e.clientX);
        carousel.scrollLeft = scrollLeft + walk;
      });
      carousel.addEventListener('pointerup', (e) => {
        isDown = false;
        try { carousel.releasePointerCapture(e.pointerId); } catch(_) {}
        carousel.classList.remove('dragging');
        snapToNearest();
      });
      carousel.addEventListener('pointercancel', ()=>{ isDown = false; carousel.classList.remove('dragging'); });
    }

    function snapToNearest() {
      if (!carousel) return;
      // snap to centered items (uses scroll-snap, but ensure nearest alignment)
      const children = Array.from(carousel.children);
      const center = carousel.scrollLeft + carousel.offsetWidth/2;
      let closest = children[0];
      let minDist = Infinity;
      children.forEach(c => {
        const cCenter = c.offsetLeft + c.offsetWidth/2;
        const dist = Math.abs(cCenter - center);
        if (dist < minDist){ minDist = dist; closest = c; }
      });
      carousel.scrollTo({ left: Math.max(0, closest.offsetLeft - (carousel.offsetWidth - closest.offsetWidth)/2), behavior: 'smooth' });
    }

    const prevImg = $('#prevImg');
    const nextImg = $('#nextImg');
    if (prevImg) prevImg.addEventListener('click', ()=> {
      if (!carousel) return;
      const children = Array.from(carousel.children);
      const left = carousel.scrollLeft;
      let target = children[0];
      for (let i=children.length-1;i>=0;i--){
        if (children[i].offsetLeft < left - 10) { target = children[i]; break; }
      }
      carousel.scrollTo({ left: Math.max(0, target.offsetLeft - (carousel.offsetWidth - target.offsetWidth)/2), behavior: 'smooth' });
    });
    if (nextImg) nextImg.addEventListener('click', ()=> {
      if (!carousel) return;
      const children = Array.from(carousel.children);
      const left = carousel.scrollLeft;
      let target = children[children.length-1];
      for (let c of children){
        if (c.offsetLeft > left + 10) { target = c; break; }
      }
      carousel.scrollTo({ left: Math.max(0, target.offsetLeft - (carousel.offsetWidth - target.offsetWidth)/2), behavior: 'smooth' });
    });

    const openLetterBtn = $('#openLetterBtn');
    if (openLetterBtn) openLetterBtn.addEventListener('click', ()=> showPage('letter'));

    /* ------- Envelope / Love letter animation ------- */
    const envelope = $('#envelope');
    const letterText = $('#letterText');
    const letterPaper = $('#letterPaper');

    function openEnvelope() {
      if (!envelope) return;
      if (envelope.classList.contains('open')) return;
      envelope.classList.add('open');
      // reveal the message content (it must match exactly — already placed in HTML)
      if (letterPaper) letterPaper.setAttribute('aria-hidden','false');
      // slight reveal animation done by CSS
      setTimeout(()=> {
        // focus celebrate button for accessibility
        const celebrateBtn = $('#celebrateBtn');
        if (celebrateBtn) celebrateBtn.focus();
      }, 700);
    }

    if (envelope) {
      envelope.addEventListener('click', openEnvelope);
      envelope.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); } });
    }

    const celebrateBtn = $('#celebrateBtn');
    if (celebrateBtn) celebrateBtn.addEventListener('click', ()=> showPage('final'));

    /* ------- Confetti & Fireworks for final page ------- */
    const confettiCanvas = $('#confettiCanvas');
    const cfCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
    let confettiPieces = [];
    function resizeConfetti() {
      if (!confettiCanvas) return;
      confettiCanvas.width = innerWidth;
      confettiCanvas.height = innerHeight;
    }
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);

    let confettiRAF = null;
    let fireworksAnimationRunning = false;
    const fireworks = [];

    function startConfetti() {
      if (!confettiCanvas || !cfCtx) return;
      confettiPieces = [];
      const count = 120;
      for (let i=0;i<count;i++){
        confettiPieces.push({
          x: Math.random()*confettiCanvas.width,
          y: Math.random()*confettiCanvas.height - confettiCanvas.height,
          size: (4 + Math.random()*10),
          angle: Math.random()*Math.PI*2,
          spin: (Math.random()*0.2 - 0.1),
          vy: 1 + Math.random()*4,
          color: `hsl(${Math.floor(330 + Math.random()*40)},80%,60%)`
        });
      }
      if (!confettiRAF) requestAnimationFrame(renderConfetti);
      // fireworks bursts
      setInterval(fireworkBurst, 900);
    }

    function renderConfetti(ts) {
      if (!cfCtx || !confettiCanvas) return;
      cfCtx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
      confettiPieces.forEach(p=>{
        p.y += p.vy;
        p.x += Math.sin(p.y*0.01)*0.7;
        p.angle += p.spin;
        cfCtx.save();
        cfCtx.translate(p.x, p.y);
        cfCtx.rotate(p.angle);
        cfCtx.fillStyle = p.color;
        cfCtx.fillRect(-p.size/2, -p.size/2, p.size, p.size*0.6);
        cfCtx.restore();
        if (p.y > confettiCanvas.height + 40) {
          p.y = -20 - Math.random()*200;
          p.x = Math.random()*confettiCanvas.width;
        }
      });
      // draw fireworks overlay
      if (fireworks.length) {
        fireworks.forEach((fw, idx) => {
          fw.particles.forEach(p => {
            // update
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.alpha -= 0.015;
          });
          // remove dead
          fw.particles = fw.particles.filter(p => p.alpha > 0);
          if (fw.particles.length === 0) fireworks.splice(idx,1);
        });
        // draw
        fireworks.forEach(fw => {
          fw.particles.forEach(p => {
            cfCtx.beginPath();
            // fallback color handling: draw with rgba approximation
            cfCtx.fillStyle = `rgba(255,90,120,${p.alpha})`;
            cfCtx.arc(p.x, p.y, p.size, 0, Math.PI*2);
            cfCtx.fill();
          });
        });
      }
      confettiRAF = requestAnimationFrame(renderConfetti);
    }

    // fireworks implementation (simple expanding particles)
    function fireworkBurst() {
      if (!confettiCanvas) return;
      const x = Math.random()*confettiCanvas.width * 0.9 + confettiCanvas.width*0.05;
      const y = Math.random()*confettiCanvas.height*0.6 + confettiCanvas.height*0.05;
      const count = 24 + Math.floor(Math.random()*24);
      const hue = 330 + Math.random()*40;
      const burst = {particles:[]};
      for (let i=0;i<count;i++){
        const ang = Math.random()*Math.PI*2;
        const speed = 2 + Math.random()*5;
        burst.particles.push({
          x, y,
          vx: Math.cos(ang)*speed,
          vy: Math.sin(ang)*speed,
          alpha:1,
          size:2 + Math.random()*3,
          color: `hsla(${hue + Math.random()*40 - 20},90%,60%,1)`
        });
      }
      fireworks.push(burst);
    }

    /* ------- Preload images and music to ensure offline-ready experience ------- */
    const imagesToPreload = [
      'profile.jpg',
      '1.jpg',
      '2.jpg',
      '3.jpg',
      '4.jpg',
      '5.jpg'
    ];
    imagesToPreload.forEach(src=>{
      const i = new Image();
      i.src = src;
    });
    // Preload audio but do not autoplay until user gesture
    if (bgMusic) {
      try { bgMusic.load(); } catch(_) {}
    }

    /* ------- Initial UI effects & wiring ------- */
    // small entrance animation
    setTimeout(()=> {
      spawnHeart(); spawnHeart(); spawnHeart();
    }, 600);

    // Make keypad accessible by keyboard - allow numeric keyboard input
    window.addEventListener('keydown', (e) => {
      const key = e.key;
      if (pages.pin && pages.pin.classList.contains('active')) {
        if (/^[0-9]$/.test(key)) {
          // emulate button press
          const btn = keypadRoot ? keypadRoot.querySelector(`[data-digit="${key}"]`) : null;
          if (btn) btn.click();
        } else if (key === 'Backspace') {
          const pb = $('#pinBack');
          if (pb) pb.click();
        } else if (key === 'Escape') {
          const pc = $('#pinClear');
          if (pc) pc.click();
        }
      }
    });

    // When music is ended or interrupted, ensure loop
    if (bgMusic) bgMusic.addEventListener('ended', ()=> bgMusic.play().catch(()=>{}));

    // ensure age updates daily if site left open
    setInterval(updateAgeDisplay, 1000*60*60);

    // small helper to ensure gallery sizes on load
    window.addEventListener('load', ()=> { if (carousel) snapToNearest(); });
    window.addEventListener('orientationchange', () => setTimeout(()=>{ if (carousel) snapToNearest(); }, 300));

    // Prevent overscroll on mobile from moving body
    document.addEventListener('touchmove', function(e){
      // allow scrolling inside carousel vertically only; otherwise prevent
      if (e.target && e.target.closest && e.target.closest('.carousel')) return;
      e.preventDefault();
    }, {passive:false});

    // Accessibility: ensure focus outline if user tabs
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') document.body.classList.add('user-tabbing');
    });

    // Set initial page
    showPage('lock');

    // On beforeunload pause music
    window.addEventListener('pagehide', ()=> {
      try { if (bgMusic) bgMusic.pause(); } catch(_) {}
    });

    /* ------- End of script ------- */
  }
})();
