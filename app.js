const KEY_ORDER = 'vocab_shuffled_order';
const KEY_INDEX = 'vocab_current_index';
const KEY_STATE = 'vocab_current_state';

let vocab = [];
let shuffledOrder = [];
let currentIndex = 0;
let currentState = 1;

function fisherYates(ids) {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function saveState() {
  localStorage.setItem(KEY_ORDER, JSON.stringify(shuffledOrder));
  localStorage.setItem(KEY_INDEX, String(currentIndex));
  localStorage.setItem(KEY_STATE, String(currentState));
}

function newRound() {
  shuffledOrder = fisherYates(vocab.map(w => w.id));
  currentIndex = 0;
  currentState = 1;
  saveState();
}

function loadState() {
  const rawOrder = localStorage.getItem(KEY_ORDER);
  const rawIndex = localStorage.getItem(KEY_INDEX);
  const rawState = localStorage.getItem(KEY_STATE);
  if (rawOrder && rawIndex !== null && rawState !== null) {
    shuffledOrder = JSON.parse(rawOrder);
    currentIndex = parseInt(rawIndex, 10);
    currentState = parseInt(rawState, 10);
    return true;
  }
  return false;
}

function currentWord() {
  return vocab.find(w => w.id === shuffledOrder[currentIndex]);
}

function setReveal(el, text, show, animate) {
  if (show) {
    el.textContent = text;
    if (animate) {
      requestAnimationFrame(() => el.classList.add('visible'));
    } else {
      el.classList.add('visible');
    }
  } else {
    el.classList.remove('visible');
    el.textContent = '';
  }
}

function render(animate = true) {
  const word = currentWord();
  if (!word) return;

  document.getElementById('word').textContent = word.word;

  setReveal(document.getElementById('french'), word.french, currentState >= 3, animate);
  setReveal(document.getElementById('example'), word.example, currentState >= 4, animate);

  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i < currentState);
  });

  document.getElementById('progress-num').textContent = currentIndex + 1;

  document.getElementById('back-btn').disabled = (currentIndex === 0 && currentState === 1);
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'en-US';
  window.speechSynthesis.speak(utt);
}

function launchFireworks() {
  const canvas = document.getElementById('fireworks-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  // Union Jack colours
  const colors = ['#C8102E', '#FFFFFF', '#012169', '#C8102E', '#FFFFFF'];
  const bursts = [];

  for (let b = 0; b < 9; b++) {
    setTimeout(() => {
      const particles = [];
      const x = canvas.width * (0.1 + Math.random() * 0.8);
      const y = canvas.height * (0.08 + Math.random() * 0.55);
      const col1 = colors[Math.floor(Math.random() * colors.length)];
      const col2 = colors[Math.floor(Math.random() * colors.length)];
      const count = 90;
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const speed = 3.5 + Math.random() * 5;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          color: i % 2 === 0 ? col1 : col2,
          alpha: 1,
          radius: 2 + Math.random() * 2.5,
          decay: 0.012 + Math.random() * 0.01
        });
      }
      bursts.push(particles);
    }, b * 200);
  }

  const end = performance.now() + 2800;

  function animate(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    bursts.forEach(particles => {
      particles.forEach(p => {
        if (p.alpha <= 0) return;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.09;
        p.vx *= 0.98;
        p.alpha -= p.decay;
        if (p.alpha < 0) p.alpha = 0;
        else alive = true;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.globalAlpha = 1;
    if (now < end || alive) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  requestAnimationFrame(animate);
}

function showCongrats() {
  const el = document.getElementById('congrats');
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
    newRound();
    render(false);
  }, 3000);
}

function advance() {
  if (currentState < 4) {
    currentState++;
    if (currentState === 2) speak(currentWord().word);
    saveState();
    render(true);
  } else {
    currentIndex++;
    if (currentIndex >= shuffledOrder.length) {
      showCongrats();
      return;
    }
    currentState = 1;
    saveState();
    if (currentIndex > 0 && currentIndex % 20 === 0) launchFireworks();
    render(false);
  }
}

function goBack() {
  if (currentState > 1) {
    currentState = 1;
  } else if (currentIndex > 0) {
    currentIndex--;
    currentState = 1;
  } else {
    return;
  }
  saveState();
  render(false);
}

async function init() {
  const res = await fetch('./english_vocabulary_500.json');
  const data = await res.json();
  vocab = data.words;

  if (!loadState()) {
    newRound();
  }

  render(false);

  document.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      advance();
    }
  });

  document.getElementById('main-area').addEventListener('click', advance);

  document.getElementById('back-btn').addEventListener('click', e => {
    e.stopPropagation();
    goBack();
  });
}

init().catch(err => console.error('Failed to load vocabulary:', err));
