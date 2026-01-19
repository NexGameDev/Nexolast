const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const fxLayer = document.getElementById("fx-layer");

const SIZE = 8;
let board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
let score = 0;
let combo = 0;
let selectedBlock = null;

bestEl.textContent = localStorage.getItem("best") || 0;

/* =========================
   SHAPES
========================= */
const SHAPES = [
  [[1]],
  [[1,1]],
  [[1],[1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,0],[1,1]],
  [[0,1],[1,1]],
  [[1,1,0],[0,1,1]],
];

/* =========================
   INIT BOARD
========================= */
for (let i = 0; i < 64; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.dataset.i = Math.floor(i / 8);
  cell.dataset.j = i % 8;
  cell.onclick = () => tryPlace(cell);
  boardEl.appendChild(cell);
}

/* =========================
   BLOCK SPAWN
========================= */
function spawnBlocks() {
  blockListEl.innerHTML = "";
  selectedBlock = null;

  let blocks = [];
  while (blocks.length < 3) {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    if (blocks.length === 0 || canFit(shape)) blocks.push(shape);
  }

  blocks.forEach(shape => {
    const el = document.createElement("div");
    el.className = "block";
    el.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;

    shape.forEach(row => row.forEach(v => {
      if (v) el.appendChild(document.createElement("div"));
      else el.appendChild(document.createElement("span"));
    }));

    el.onclick = () => {
      document.querySelectorAll(".block").forEach(b => b.classList.remove("selected"));
      el.classList.add("selected");
      selectedBlock = shape;
    };

    blockListEl.appendChild(el);
  });
}

/* =========================
   PLACE BLOCK
========================= */
function tryPlace(cell) {
  if (!selectedBlock) return;
  const x = +cell.dataset.i;
  const y = +cell.dataset.j;

  if (!canPlace(selectedBlock, x, y)) return;

  selectedBlock.forEach((row, i) =>
    row.forEach((v, j) => {
      if (v) {
        board[x + i][y + j] = 1;
        boardEl.children[(x + i) * 8 + (y + j)].classList.add("filled");
      }
    })
  );

  score += selectedBlock.flat().filter(Boolean).length * 10;
  clearLines();
  spawnBlocks();
  updateScore();
}

/* =========================
   CHECK
========================= */
function canPlace(shape, x, y) {
  return shape.every((row, i) =>
    row.every((v, j) =>
      !v || (board[x + i]?.[y + j] === 0)
    )
  );
}

function canFit(shape) {
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++)
      if (canPlace(shape, i, j)) return true;
  return false;
}

/* =========================
   CLEAR & COMBO
========================= */
function clearLines() {
  let cleared = 0;

  for (let i = 0; i < 8; i++) {
    if (board[i].every(v => v)) {
      board[i].fill(0);
      cleared++;
    }
  }

  for (let j = 0; j < 8; j++) {
    if (board.every(r => r[j])) {
      board.forEach(r => r[j] = 0);
      cleared++;
    }
  }

  if (cleared) {
    combo++;
    score += cleared * 100 * combo;
    showCombo(`COMBO x${combo}`);
  } else combo = 0;

  redraw();
}

/* =========================
   FX
========================= */
function showCombo(text) {
  const el = document.createElement("div");
  el.className = "floating-text";
  el.textContent = text;
  fxLayer.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

/* =========================
   UTILS
========================= */
function redraw() {
  board.flat().forEach((v, i) =>
    boardEl.children[i].classList.toggle("filled", v)
  );
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > bestEl.textContent) {
    bestEl.textContent = score;
    localStorage.setItem("best", score);
  }
}

/* =========================
   START
========================= */
spawnBlocks();const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const fxLayer = document.getElementById("fx-layer");

const SIZE = 8;
let board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
let score = 0;
let combo = 0;
let selectedBlock = null;

bestEl.textContent = localStorage.getItem("best") || 0;

/* =========================
   SHAPES
========================= */
const SHAPES = [
  [[1]],
  [[1,1]],
  [[1],[1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,0],[1,1]],
  [[0,1],[1,1]],
  [[1,1,0],[0,1,1]],
];

/* =========================
   INIT BOARD
========================= */
for (let i = 0; i < 64; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.dataset.i = Math.floor(i / 8);
  cell.dataset.j = i % 8;
  cell.onclick = () => tryPlace(cell);
  boardEl.appendChild(cell);
}

/* =========================
   BLOCK SPAWN
========================= */
function spawnBlocks() {
  blockListEl.innerHTML = "";
  selectedBlock = null;

  let blocks = [];
  while (blocks.length < 3) {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    if (blocks.length === 0 || canFit(shape)) blocks.push(shape);
  }

  blocks.forEach(shape => {
    const el = document.createElement("div");
    el.className = "block";
    el.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;

    shape.forEach(row => row.forEach(v => {
      if (v) el.appendChild(document.createElement("div"));
      else el.appendChild(document.createElement("span"));
    }));

    el.onclick = () => {
      document.querySelectorAll(".block").forEach(b => b.classList.remove("selected"));
      el.classList.add("selected");
      selectedBlock = shape;
    };

    blockListEl.appendChild(el);
  });
}

/* =========================
   PLACE BLOCK
========================= */
function tryPlace(cell) {
  if (!selectedBlock) return;
  const x = +cell.dataset.i;
  const y = +cell.dataset.j;

  if (!canPlace(selectedBlock, x, y)) return;

  selectedBlock.forEach((row, i) =>
    row.forEach((v, j) => {
      if (v) {
        board[x + i][y + j] = 1;
        boardEl.children[(x + i) * 8 + (y + j)].classList.add("filled");
      }
    })
  );

  score += selectedBlock.flat().filter(Boolean).length * 10;
  clearLines();
  spawnBlocks();
  updateScore();
}

/* =========================
   CHECK
========================= */
function canPlace(shape, x, y) {
  return shape.every((row, i) =>
    row.every((v, j) =>
      !v || (board[x + i]?.[y + j] === 0)
    )
  );
}

function canFit(shape) {
  for (let i = 0; i < 8; i++)
    for (let j = 0; j < 8; j++)
      if (canPlace(shape, i, j)) return true;
  return false;
}

/* =========================
   CLEAR & COMBO
========================= */
function clearLines() {
  let cleared = 0;

  for (let i = 0; i < 8; i++) {
    if (board[i].every(v => v)) {
      board[i].fill(0);
      cleared++;
    }
  }

  for (let j = 0; j < 8; j++) {
    if (board.every(r => r[j])) {
      board.forEach(r => r[j] = 0);
      cleared++;
    }
  }

  if (cleared) {
    combo++;
    score += cleared * 100 * combo;
    showCombo(`COMBO x${combo}`);
  } else combo = 0;

  redraw();
}

/* =========================
   FX
========================= */
function showCombo(text) {
  const el = document.createElement("div");
  el.className = "floating-text";
  el.textContent = text;
  fxLayer.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

/* =========================
   UTILS
========================= */
function redraw() {
  board.flat().forEach((v, i) =>
    boardEl.children[i].classList.toggle("filled", v)
  );
}

function updateScore() {
  scoreEl.textContent = score;
  if (score > bestEl.textContent) {
    bestEl.textContent = score;
    localStorage.setItem("best", score);
  }
}

/* =========================
   START
========================= */
spawnBlocks();
