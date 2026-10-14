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