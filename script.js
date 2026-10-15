/* ===== 1. Image fallbacks =====
   If an image file is missing, show a placeholder instead. */
document.querySelectorAll('.photo img').forEach(img => {
  const frame = img.closest('.photo');
  const markMissing = () => frame.classList.add('missing');
  img.addEventListener('error', markMissing);
  if (img.complete && img.naturalWidth === 0) markMissing();
});

/* ===== 2. Notebook view (Part 3) ===== */
const openBtn = document.getElementById('open-notebook');
const closeBtn = document.getElementById('close-notebook');
const notebook = document.getElementById('notebook-view');
const portfolio = document.getElementById('portfolio');
let savedScroll = 0;

function openNotebook() {
  savedScroll = window.scrollY;           // remember where we were
  portfolio.hidden = true;
  notebook.hidden = false;
  document.body.classList.add('notebook-open');
  showSpread(1, false);                   // always start on the first notebook page
  notebook.scrollTop = 0;
  closeBtn.focus();
}

function closeNotebook() {
  notebook.hidden = true;
  portfolio.hidden = false;
  document.body.classList.remove('notebook-open');
  // Jump straight back (no smooth animation) so the page doesn't drift
  const root = document.documentElement;
  root.style.scrollBehavior = 'auto';      // works in every browser, including older Safari
  window.scrollTo(0, savedScroll);
  root.style.scrollBehavior = '';
  openBtn.focus({ preventScroll: true });
}

openBtn.addEventListener('click', openNotebook);
closeBtn.addEventListener('click', closeNotebook);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !notebook.hidden) closeNotebook();
});

/* ===== 3. Scroll-triggered entrance animations ===== */
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });
  revealEls.forEach(el => observer.observe(el));
} else {
  revealEls.forEach(el => el.classList.add('visible'));
}

/* ===== 4. Expandable game cards (Part 5) ===== */
document.querySelectorAll('.game-card').forEach(card => {
  const toggle = () => {
    const open = card.classList.toggle('open');
    card.setAttribute('aria-expanded', open);
  };
  card.addEventListener('click', toggle);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
  });
});

/* ===== 5. Music player (Part 4) ===== */
const audio = document.getElementById('audio');
const cards = Array.from(document.querySelectorAll('.song-card'));
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const progress = document.getElementById('progress');
const nowTitle = document.getElementById('now-title');
const message = document.getElementById('player-msg');
let current = -1; // index of the loaded song, -1 = none yet

function loadSong(index) {
  current = (index + cards.length) % cards.length;
  const card = cards[current];
  cards.forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  nowTitle.textContent = card.dataset.title;
  message.textContent = '';
  audio.src = card.dataset.audio;
  progress.value = 0;
}

function playSong() {
  if (current === -1) loadSong(0);
  audio.play().catch(() => {
    // Happens when the audio file doesn't exist yet
    message.textContent = 'No audio file found. Add ' + cards[current].dataset.audio + ' to play this song.';
    playBtn.textContent = '▶';
  });
}

function togglePlay() {
  if (current !== -1 && !audio.paused) audio.pause(); else playSong();
}

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => { loadSong(current === -1 ? 0 : current - 1); playSong(); });
nextBtn.addEventListener('click', () => { loadSong(current + 1); playSong(); });
cards.forEach((card, i) => {
  card.querySelector('.play-card').addEventListener('click', () => {
    if (current === i && !audio.paused) audio.pause(); else { if (current !== i) loadSong(i); playSong(); }
  });
});

audio.addEventListener('play', () => { playBtn.textContent = '⏸'; });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; });
audio.addEventListener('ended', () => { loadSong(current + 1); playSong(); });
audio.addEventListener('timeupdate', () => {
  if (audio.duration) progress.value = (audio.currentTime / audio.duration) * 100;
});
progress.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (progress.value / 100) * audio.duration;
});

/* ===== 6. Volume control ===== */
const volumeSlider = document.getElementById('volume');
const muteBtn = document.getElementById('mute');
let lastVolume = 0.7;                 // volume to return to after un-muting

function updateVolumeUI() {
  const v = audio.muted ? 0 : audio.volume;
  volumeSlider.value = Math.round(v * 100);
  muteBtn.dataset.level = v === 0 ? 'mute' : v < 0.5 ? 'low' : 'high';   // CSS shows the matching apple icon
  muteBtn.setAttribute('aria-label', v === 0 ? 'Unmute' : 'Mute');
}

volumeSlider.addEventListener('input', () => {
  const v = volumeSlider.value / 100;
  audio.volume = v;
  audio.muted = (v === 0);
  if (v > 0) lastVolume = v;
  updateVolumeUI();
});

muteBtn.addEventListener('click', () => {
  if (audio.muted || audio.volume === 0) {
    audio.muted = false;
    audio.volume = lastVolume || 0.7;
  } else {
    lastVolume = audio.volume;
    audio.muted = true;
  }
  updateVolumeUI();
});

audio.addEventListener('volumechange', updateVolumeUI);
audio.volume = 0.7;                   // start at 70% (matches the slider)
updateVolumeUI();

/* ===== 7. Notebook pages and bookmarks (inside Part 3) ===== */
const spread1 = document.getElementById('spread-1');
const spread2 = document.getElementById('spread-2');
const bookmarkNext = document.getElementById('bookmark-next');   // red: open the extra page
const bookmarkBack = document.getElementById('bookmark-back');   // green: back to the first page

function showSpread(number, animate) {
  spread1.hidden = number !== 1;
  spread2.hidden = number !== 2;
  bookmarkNext.hidden = number !== 1;
  bookmarkBack.hidden = number !== 2;
  const active = number === 1 ? spread1 : spread2;
  active.classList.remove('flip');
  if (animate) requestAnimationFrame(() => active.classList.add('flip'));
  notebook.scrollTop = 0;
}

bookmarkNext.addEventListener('click', () => { showSpread(2, true); bookmarkBack.focus(); });
bookmarkBack.addEventListener('click', () => { showSpread(1, true); bookmarkNext.focus(); });

/* ===== 8. Hobby playing cards: tap or press Enter/Space to flip ===== */
document.querySelectorAll('.flip-card').forEach(card => {
  const flip = () => {
    const flipped = card.classList.toggle('flipped');
    card.setAttribute('aria-pressed', flipped);
  };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
  });
});