/* =========================
   UTILS.JS
========================= */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* =========================
   STATE.JS
========================= */
const state = {
  board: Array.from({ length: 8 }, () => Array(8).fill(null)),
  tray: [],
  score: 0,
  nex: 0,
  boosterActive: false,
  boosterTimer: null
};

/* =========================
   BOARD.JS
========================= */
const boardElement = document.getElementById('board');

function createBoard() {
  boardElement.innerHTML = '';
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      cell.dataset.x = x;
      cell.dataset.y = y;
      boardElement.appendChild(cell);
    }
  }
}

function updateBoard() {
  const cells = boardElement.querySelectorAll('.cell');
  cells.forEach(cell => {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const block = state.board[y][x];
    if (block) {
      cell.style.background = block.color;
    } else {
      cell.style.background = '#222';
    }
  });
}

/* =========================
   BLOCKS.JS
========================= */
const blockColors = ['red','blue','green','yellow','purple','orange'];

function generateBlock() {
  const shape = getRandomInt(1,3); // 1: single, 2: line, 3: square
  const color = blockColors[getRandomInt(0, blockColors.length-1)];
  return { shape, color };
}

function generateTray() {
  state.tray = [];
  for (let i = 0; i < 3; i++) {
    state.tray.push(generateBlock());
  }
  renderTray();
}

function renderTray() {
  const trayEl = document.getElementById('tray');
  trayEl.querySelectorAll('.slot').forEach((slot, i) => {
    slot.innerHTML = '';
    const block = state.tray[i];
    if (block) {
      const blockEl = document.createElement('div');
      blockEl.classList.add('block', block.color, 'pop');
      blockEl.draggable = true;
      blockEl.dataset.index = i;
      slot.appendChild(blockEl);
      addDragListeners(blockEl);
    }
  });
}

/* =========================
   PLACEMENT.JS
========================= */
function canPlaceBlock(block, startX, startY) {
  // simple: single block for now
  if (startX < 0 || startX >= 8 || startY < 0 || startY >= 8) return false;
  if (state.board[startY][startX]) return false;
  return true;
}

function placeBlock(index, x, y) {
  const block = state.tray[index];
  if (!canPlaceBlock(block,x,y)) return false;
  state.board[y][x] = block;
  state.tray[index] = null;
  renderTray();
  updateBoard();
  checkClear();
  return true;
}

/* =========================
   SCORE.JS
========================= */
function addScore(points) {
  if (state.boosterActive) points *= 2;
  state.score += points;
  document.getElementById('score').innerText = state.score;
  updateNex();
}

function updateNex() {
  state.nex = Math.floor(state.score / 1000);
  document.getElementById('coin').innerText = state.nex;
}

/* =========================
   SHOP.JS + BOOSTER.JS
========================= */
const shopEl = document.getElementById('shop');
const shopBtn = document.getElementById('shop-btn');
const closeShopBtn = document.getElementById('close-shop');
const boosterX2Btn = document.getElementById('booster-x2');

shopBtn.addEventListener('click',()=>shopEl.style.display='flex');
closeShopBtn.addEventListener('click',()=>shopEl.style.display='none');

boosterX2Btn.addEventListener('click',()=>{
  if (state.nex >= 5) {
    state.nex -= 5;
    document.getElementById('coin').innerText = state.nex;
    activateBooster();
  }
});

function activateBooster() {
  state.boosterActive = true;
  if (state.boosterTimer) clearTimeout(state.boosterTimer);
  state.boosterTimer = setTimeout(()=>{
    state.boosterActive = false;
  }, 5*60*1000); // 5 menit
}

/* =========================
   DRAG & DROP
========================= */
function addDragListeners(blockEl) {
  blockEl.addEventListener('dragstart', e=>{
    e.dataTransfer.setData('text/plain', blockEl.dataset.index);
  });
}

boardElement.addEventListener('dragover', e=>{
  e.preventDefault();
});

boardElement.addEventListener('drop', e=>{
  e.preventDefault();
  const index = e.dataTransfer.getData('text/plain');
  const rect = boardElement.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / (rect.width / 8));
  const y = Math.floor((e.clientY - rect.top) / (rect.height / 8));
  placeBlock(index,x,y);
});

/* =========================
   CLEAR + ANIMATIONS
========================= */
function checkClear() {
  let cleared = false;

  // Check rows
  for (let y=0;y<8;y++){
    if (state.board[y].every(cell=>cell!==null)){
      state.board[y] = Array(8).fill(null);
      cleared = true;
    }
  }

  // Check columns
  for (let x=0;x<8;x++){
    if (state.board.every(row=>row[x]!==null)){
      for (let y2=0;y2<8;y2++) state.board[y2][x] = null;
      cleared = true;
    }
  }

  if (cleared){
    updateBoard();
    addScore(100); // per clear
  }
}

/* =========================
   GAME.JS (MAIN)
========================= */
function initGame() {
  createBoard();
  generateTray();
  updateBoard();
}

window.addEventListener('load', initGame);
