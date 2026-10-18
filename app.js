(() => {
  const body = document.body;
  const pip = document.querySelector('#pip');
  const toast = document.querySelector('#toast');
  let toastTimer;
  let audioContext;
  let soundOn = false;
  let loopTimer;
  let noteIndex = 0;
  const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46];

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // Pip's warm pinprick eyes gently follow a mouse or a touch, with a tiny clamped range.
  function lookAt(x, y) {
    const rect = pip.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height * .4;
    const dx = Math.max(-4, Math.min(4, (x - cx) / 38));
    const dy = Math.max(-4, Math.min(4, (y - cy) / 38));
    pip.style.setProperty('--look-x', `${dx}px`);
    pip.style.setProperty('--look-y', `${dy}px`);
  }
  window.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') lookAt(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('pointerdown', e => lookAt(e.clientX, e.clientY), { passive: true });

  function chime(frequency = 740, duration = .2) {
    if (!soundOn) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) { notify('This browser cannot play the tiny chimes.'); return; }
    audioContext ||= new AudioCtx();
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.07, audioContext.currentTime + .025);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + duration + .02);
  }

  function setSound(on) {
    soundOn = on;
    const button = document.querySelector('#soundToggle');
    button.setAttribute('aria-pressed', String(on));
    document.querySelector('#soundIcon').textContent = on ? '♫' : '♪';
    document.querySelector('#soundLabel').textContent = on ? 'Lullaby playing · Mute' : 'Play a lullaby';
    document.querySelector('.music-card').classList.toggle('is-playing', on);
    clearInterval(loopTimer);
    if (on) {
      chime(notes[noteIndex++ % notes.length], .45);
      loopTimer = setInterval(() => chime(notes[noteIndex++ % notes.length], .45), 620);
    }
  }
  document.querySelector('#soundToggle').addEventListener('click', () => setSound(!soundOn));
  document.querySelector('.play-inline').addEventListener('click', () => setSound(!soundOn));

  const moodToggle = document.querySelector('#moodToggle');
  moodToggle.addEventListener('click', () => {
    const on = body.classList.toggle('dream-mode');
    moodToggle.setAttribute('aria-pressed', String(on));
    document.querySelector('#moodLabel').textContent = on ? 'Dream mode' : 'Lights out';
    moodToggle.querySelector('span').textContent = on ? '☀' : '☾';
    chime(on ? 880 : 660, .16);
  });
  document.querySelector('#lampButton').addEventListener('click', () => {
    if (!body.classList.contains('dream-mode')) moodToggle.click();
    else notify('All three nightlights are glowing. ✦');
  });

  // Story line fills in as its section enters the viewport.
  const storyTrack = document.querySelector('.story-track');
  const progress = document.querySelector('#storyProgress');
  function updateStory() {
    const rect = storyTrack.getBoundingClientRect();
    const available = rect.height - window.innerHeight * .6;
    const passed = Math.max(0, Math.min(available, -rect.top + window.innerHeight * .35));
    progress.style.height = `${available > 0 ? passed / available * 100 : 100}%`;
  }
  window.addEventListener('scroll', updateStory, { passive: true });
  window.addEventListener('resize', updateStory, { passive: true });
  updateStory();

  // The block tower is a no-pressure toy; it resets at 9 blocks to keep the stage tidy.
  const tower = document.querySelector('#tower');
  const blockCount = document.querySelector('#blockCount');
  const toyStage = document.querySelector('#toyStage');
  function addBlock() {
    if (tower.children.length >= 9) { notify('A very sturdy tower! Pip says: reset and build again.'); return; }
    const block = document.createElement('div');
    block.className = `block block-${['one','two','three'][tower.children.length % 3]}`;
    block.textContent = ['✦', '☾', '♡', '✧', '♫'][tower.children.length % 5];
    tower.append(block);
    blockCount.textContent = tower.children.length;
    chime(540 + tower.children.length * 45, .12);
    if (tower.children.length === 7) notify('Seven blocks! This is definitely engineering.');
  }
  function resetTower() {
    while (tower.children.length > 3) tower.lastElementChild.remove();
    blockCount.textContent = tower.children.length;
    notify('Tower reset. Pip is ready for another try.');
  }
  document.querySelector('#addBlock').addEventListener('click', addBlock);
  toyStage.addEventListener('click', e => { if (e.target.closest('#addBlock')) return; resetTower(); });
  toyStage.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); resetTower(); } });

  // Local wishes persist only in this browser; input is rendered as text, never HTML.
  const wishForm = document.querySelector('#wishForm');
  const wishInput = document.querySelector('#wishInput');
  const wishWall = document.querySelector('#wishWall');
  function renderWishes() {
    wishWall.replaceChildren();
    try {
      const wishes = JSON.parse(localStorage.getItem('pip-wishes') || '[]');
      wishes.slice(-5).forEach(text => {
        const slip = document.createElement('span');
        slip.className = 'wish-slip'; slip.textContent = text; wishWall.append(slip);
      });
    } catch { /* Private browsing may disable local storage; the rest of the page still works. */ }
  }
  renderWishes();
  wishForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = wishInput.value.trim();
    if (!text) return;
    try {
      const wishes = JSON.parse(localStorage.getItem('pip-wishes') || '[]');
      wishes.push(text); localStorage.setItem('pip-wishes', JSON.stringify(wishes.slice(-5)));
      renderWishes();
    } catch {
      const slip = document.createElement('span'); slip.className = 'wish-slip'; slip.textContent = text; wishWall.append(slip);
      document.querySelector('#formNote').textContent = 'Saved for this visit; browser storage is unavailable.';
    }
    wishInput.value = ''; chime(880, .16); notify('Your wish is pinned on the nursery wall. ✦');
  });

  // A modest per-browser odometer, with a fixed first visit and no network tracking.
  try {
    const n = Number(localStorage.getItem('pip-visits') || 0) + 1;
    localStorage.setItem('pip-visits', String(n));
    document.querySelector('#counter').textContent = String(n).padStart(6, '0');
  } catch { document.querySelector('#counter').textContent = '000001'; }

  // Hidden delight: tap Pip's crooked smile five times.
  let smileTaps = 0; let smileReset;
  pip.addEventListener('click', () => {
    smileTaps++; clearTimeout(smileReset); smileReset = setTimeout(() => smileTaps = 0, 1800);
    if (smileTaps >= 5) {
      smileTaps = 0; notify('Pip says: you found my secret yawn! 🌙');
      for (let i = 0; i < 18; i++) {
        const star = document.createElement('span'); star.className = 'sparkle'; star.textContent = ['✦','✧','♡'][i % 3];
        star.style.left = `${35 + Math.random() * 30}vw`; star.style.top = `${23 + Math.random() * 22}vh`;
        star.style.setProperty('--dx', `${Math.random() * 100 - 50}px`); document.body.append(star); setTimeout(() => star.remove(), 750);
      }
      chime(1046.5, .4);
    }
  });

  // Optional sparkle trail uses pointer movement, and quietly skips coarse touch screens.
  let lastSparkle = 0;
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const now = performance.now(); if (now - lastSparkle < 90) return; lastSparkle = now;
    const star = document.createElement('span'); star.className = 'sparkle'; star.textContent = Math.random() > .5 ? '✦' : '✧';
    star.style.left = `${e.clientX}px`; star.style.top = `${e.clientY}px`;
    star.style.setProperty('--dx', `${Math.random() * 24 - 12}px`); document.querySelector('#sparkles').append(star); setTimeout(() => star.remove(), 750);
  }, { passive: true });

  document.querySelector('#chaosToggle').addEventListener('click', e => {
    const on = body.classList.toggle('chaos');
    e.currentTarget.textContent = on ? 'Back to cozy mode ☾' : 'Try silly mode ✦';
    notify(on ? 'Silly mode: extra sprinkles, same soft landing!' : 'Back to soft and sleepy.');
  });
})();
