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
