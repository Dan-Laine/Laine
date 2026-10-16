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
  buildNotebook();                        // fit the notes onto pages (adds pages if needed)
  showSpread(0, false);                   // always start on the first notebook page
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
    message.textContent = 'Could not play this song. Try another browser.';
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

/* ===== 7. Notebook pages and bookmarks (inside Part 3) =====
   The notebook has a FIXED size. The notes live in the hidden #nb-notes list in index.html.
   buildNotebook() puts as many notes as fit on each right-hand page and, when the rest
   won't fit, automatically adds a new page (with a decorated left-hand page next to it).
   On phones every page is shown one at a time. */
const nbBook = document.querySelector('.notebook');
const nbNotesSrc = document.getElementById('nb-notes');
const nbLeftsSrc = document.getElementById('nb-lefts');
const nbNotes = Array.from(nbNotesSrc.children);
const nbLefts = Array.from(nbLeftsSrc.children);     // 2 photo pages + 2 decorated pages (the decorated ones repeat if needed)
const bookmarkNext = document.getElementById('bookmark-next');   // red: next page
const bookmarkBack = document.getElementById('bookmark-back');   // green: previous page
const nbStickers = ['apple-half', 'flower', 'ladybug', 'clover', 'sprout', 'apple-solid'];
let spreads = [];
let spreadIndex = 0;
let builtKey = '';

const nbIsPhone = () => window.matchMedia('(max-width: 700px)').matches;
const nbKey = () => nbIsPhone() + '|' + nbBook.clientWidth + '|' + nbBook.clientHeight;

function releaseNotebook() {
  nbLefts.forEach(p => { p.querySelectorAll('.nb-num').forEach(n => n.remove()); nbLeftsSrc.appendChild(p); });
  nbNotes.forEach(n => nbNotesSrc.appendChild(n));
  nbBook.querySelectorAll('.spread').forEach(sp => sp.remove());
  spreads = [];
}

function buildNotebook() {
  releaseNotebook();
  const phone = nbIsPhone();

  // 1) measure how many notes fit on one right-hand page
  const probe = document.createElement('div');
  probe.className = 'spread';
  const pg = document.createElement('div');
  pg.className = 'page right';
  pg.style.visibility = 'hidden';
  probe.appendChild(pg);
  nbBook.appendChild(probe);
  const padBottom = parseFloat(getComputedStyle(pg).paddingBottom) || 0;
  const fits = () => { const last = pg.lastElementChild; return !last || last.offsetTop + last.offsetHeight <= pg.clientHeight - padBottom; };
  const groups = [];
  let group = [];
  nbNotes.forEach(note => {
    pg.appendChild(note);
    if (!fits() && group.length) {            // it doesn't fit: start a new page with this note
      pg.removeChild(note);
      groups.push(group);
      group = [];
      pg.textContent = '';
      pg.appendChild(note);
    }
    group.push(note);
  });
  if (group.length) groups.push(group);
  probe.remove();
  builtKey = nbKey();

  // 2) build the real pages
  let number = 1;
  const addNumber = page => {
    const tag = document.createElement('span');
    tag.className = 'nb-num';
    tag.setAttribute('aria-hidden', 'true');
    tag.textContent = number++;
    page.appendChild(tag);
  };
  const leftFor = i => {
    if (i < nbLefts.length) return nbLefts[i];
    const copy = nbLefts[2 + (i % 2)].cloneNode(true);   // repeat the decorated pages if there are even more notes
    copy.removeAttribute('id');
    return copy;
  };
  const rightFor = (notes, i) => {
    const page = document.createElement('div');
    page.className = 'page right';
    notes.forEach(n => page.appendChild(n));
    const sticker = nbStickers[i % nbStickers.length];
    page.insertAdjacentHTML('beforeend',
      '<svg class="nb-sticker" style="--a:' + (i % 2 ? '-10deg' : '12deg') + '" aria-hidden="true"><use href="#' + sticker + '" width="100%" height="100%"/></svg>' +
      '<span class="nb-star" aria-hidden="true">' + (i % 2 ? '✿' : '✦') + '</span>');
    return page;
  };
  const makeSpread = (...pages) => {
    const sp = document.createElement('div');
    sp.className = 'spread';
    sp.hidden = true;
    pages.forEach(p => sp.appendChild(p));
    if (pages.some(p => p.dataset.alt)) sp.classList.add('alt');   // mirrored photo layout, as before
    nbBook.appendChild(sp);
    spreads.push(sp);
  };
  groups.forEach((notes, i) => {
    const left = leftFor(i);
    const right = rightFor(notes, i);
    addNumber(left);
    if (phone) { makeSpread(left); addNumber(right); makeSpread(right); }
    else { addNumber(right); makeSpread(left, right); }
  });
}

function showSpread(index, animate) {
  spreadIndex = Math.max(0, Math.min(spreads.length - 1, index));
  spreads.forEach((sp, i) => { sp.hidden = i !== spreadIndex; sp.classList.remove('flip'); });
  const active = spreads[spreadIndex];
  if (active && animate) requestAnimationFrame(() => active.classList.add('flip'));
  bookmarkNext.hidden = spreadIndex >= spreads.length - 1;
  bookmarkBack.hidden = spreadIndex <= 0;
  notebook.scrollTop = 0;
}

bookmarkNext.addEventListener('click', () => { showSpread(spreadIndex + 1, true); (bookmarkNext.hidden ? bookmarkBack : bookmarkNext).focus(); });
bookmarkBack.addEventListener('click', () => { showSpread(spreadIndex - 1, true); (bookmarkBack.hidden ? bookmarkNext : bookmarkBack).focus(); });
document.addEventListener('keydown', e => {
  if (notebook.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === 'ArrowRight' && spreadIndex < spreads.length - 1) showSpread(spreadIndex + 1, true);
  if (e.key === 'ArrowLeft' && spreadIndex > 0) showSpread(spreadIndex - 1, true);
});
let nbResizeTimer;
window.addEventListener('resize', () => {          // rebuild the pages if the window size changes while the notebook is open
  if (notebook.hidden) return;
  clearTimeout(nbResizeTimer);
  nbResizeTimer = setTimeout(() => {
    if (nbKey() === builtKey) return;
    buildNotebook();
    showSpread(spreadIndex, false);
  }, 150);
});

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

/* ===== 9. Going to page 2 ("More About Me"): a quick fade, then the new page opens ===== */
const moreLink = document.querySelector('.more-btn');
if (moreLink) {
  moreLink.addEventListener('click', e => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { window.location.href = moreLink.href; }, 260);
  });
}
window.addEventListener('pageshow', () => document.body.classList.remove('leaving'));   // coming back with the browser's Back button
/* ===== 10. Notebook polaroids: click (or press Enter) to view the photo bigger ===== */
(function () {
  const viewer = document.createElement('div');
  viewer.className = 'pol-viewer';
  viewer.hidden = true;
  viewer.setAttribute('role', 'dialog');
  viewer.setAttribute('aria-modal', 'true');
  viewer.setAttribute('aria-label', 'Polaroid photo');
  viewer.innerHTML = '<button type="button" class="pol-x" aria-label="Close photo">&times;</button><figure><img alt=""></figure>';
  document.body.appendChild(viewer);
  const bigImg = viewer.querySelector('img');
  const xBtn = viewer.querySelector('.pol-x');
  let lastFocus = null;

  function openPol(fig) {
    const img = fig.querySelector('img');
    if (!img || fig.querySelector('.photo.missing')) return;
    lastFocus = fig;
    bigImg.src = img.currentSrc || img.src;
    bigImg.alt = img.alt;
    viewer.hidden = false;
    xBtn.focus();
  }
  function closePol() {
    if (viewer.hidden) return;
    viewer.hidden = true;
    bigImg.removeAttribute('src');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  // Polaroids are rebuilt when the notebook opens, so listen on the whole notebook
  const nbView = document.getElementById('notebook-view');
  nbView.addEventListener('click', e => {
    const fig = e.target.closest('.polaroid');
    if (fig) openPol(fig);
  });
  nbView.addEventListener('keydown', e => {
    const fig = e.target.closest && e.target.closest('.polaroid');
    if (fig && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openPol(fig); }
  });
  // make every notebook polaroid keyboard-friendly
  nbView.querySelectorAll('.polaroid').forEach(f => { f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'View photo bigger'); });

  viewer.addEventListener('click', e => { if (e.target === viewer || e.target === xBtn) closePol(); });
  // Escape closes only the photo (capture phase so the notebook stays open)
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !viewer.hidden) { e.stopImmediatePropagation(); closePol(); }
  }, true);
})();