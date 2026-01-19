/* =========================
   BASIC SETUP
========================= */
const BOARD_SIZE = 8;
const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const fxLayer = document.getElementById("fx-layer");

let board = [];
let selectedBlock = null;
let score = 0;
let best = localStorage.getItem("nexolast-best") || 0;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
scoreEl.textContent = score;
bestEl.textContent = best;

/* =========================
   BLOCK SHAPES (VARIASI)
========================= */
const SHAPES = [
  [[1]],
  [[1,1]],
  [[1,1,1]],
  [[1],[1]],
  [[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,0],[1,1]],
  [[0,1],[1,1]],
  [[1,1,0],[0,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,1],[0,1,0]]
];

/* =========================
   INIT BOARD
========================= */
function initBoard() {
  board = [];
  boardEl.innerHTML = "";
  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    board.push(0);
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    boardEl.appendChild(cell);
  }
}

/* =========================
   BLOCK GENERATOR (SMART)
========================= */
function generateBlocks() {
  blockListEl.innerHTML = "";

  let guaranteed = false;

  for (let i = 0; i < 3; i++) {
    let shape;

    if (!guaranteed) {
      const possible = SHAPES.filter(s => canPlaceAnywhere(s));
      if (possible.length) {
        shape = possible[Math.floor(Math.random() * possible.length)];
        guaranteed = true;
      }
    }

    if (!shape) {
      shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    }

    createBlock(shape);
  }
}

function createBlock(shape) {
  const block = document.createElement("div");
  block.className = "block";
  block.shape = shape;

  block.style.gridTemplateColumns = `repeat(${shape[0].length}, 1fr)`;

  shape.forEach(row => {
    row.forEach(cell => {
      const d = document.createElement("div");
      if (!cell) d.style.visibility = "hidden";
      block.appendChild(d);
    });
  });

  block.addEventListener("click", () => selectBlock(block));
  blockListEl.appendChild(block);
}

/* =========================
   BLOCK SELECT
========================= */
function selectBlock(block) {
  document.querySelectorAll(".block").forEach(b => b.classList.remove("selected"));
  block.classList.add("selected");
  selectedBlock = block;
}

/* =========================
   BOARD INTERACTION
========================= */
boardEl.addEventListener("click", e => {
  if (!selectedBlock || !e.target.classList.contains("cell")) return;

  const index = +e.target.dataset.index;
  const x = index % BOARD_SIZE;
  const y = Math.floor(index / BOARD_SIZE);

  if (canPlace(selectedBlock.shape, x, y)) {
    placeBlock(selectedBlock.shape, x, y);
    selectedBlock.remove();
    selectedBlock = null;

    checkClear();
    if (!blockListEl.children.length) generateBlocks();
    if (isGameOver()) showGameOver();
  }
});

/* =========================
   PLACE BLOCK
========================= */
function canPlace(shape, x, y) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = x + c;
      const ny = y + r;
      if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return false;
      if (board[ny * BOARD_SIZE + nx]) return false;
    }
  }
  return true;
}

function canPlaceAnywhere(shape) {
  for (let y = 0; y < BOARD_SIZE; y++)
    for (let x = 0; x < BOARD_SIZE; x++)
      if (canPlace(shape, x, y)) return true;
  return false;
}

function placeBlock(shape, x, y) {
  shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      const idx = (y + r) * BOARD_SIZE + (x + c);
      board[idx] = 1;
      boardEl.children[idx].classList.add("filled", "pop");
    });
  });

  score += shape.flat().filter(Boolean).length * 10;
  updateScore();
}

/* =========================
   CLEAR & COMBO
========================= */
function checkClear() {
  let rows = [];
  let cols = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    if (board.slice(y * BOARD_SIZE, y * BOARD_SIZE + BOARD_SIZE).every(v => v)) {
      rows.push(y);
    }
  }

  for (let x = 0; x < BOARD_SIZE; x++) {
    let full = true;
    for (let y = 0; y < BOARD_SIZE; y++) {
      if (!board[y * BOARD_SIZE + x]) {
        full = false;
        break;
      }
    }
    if (full) cols.push(x);
  }

  if (!rows.length && !cols.length) return;

  let cleared = rows.length + cols.length;
  let comboScore = cleared * 100;

  rows.forEach(y => {
    for (let x = 0; x < BOARD_SIZE; x++) {
      clearCell(y * BOARD_SIZE + x);
    }
  });

  cols.forEach(x => {
    for (let y = 0; y < BOARD_SIZE; y++) {
      clearCell(y * BOARD_SIZE + x);
    }
  });

  score += comboScore;
  updateScore();
  showCombo(cleared);
}

function clearCell(i) {
  board[i] = 0;
  boardEl.children[i].classList.remove("filled");
}

/* =========================
   COMBO FX
========================= */
function showCombo(count) {
  const txt = document.createElement("div");
  txt.className = "floating-text";
  txt.textContent = count > 1 ? `COMBO x${count}` : "+CLEAR";
  txt.style.left = "50%";
  txt.style.top = "140px";
  fxLayer.appendChild(txt);
  setTimeout(() => txt.remove(), 600);
}

/* =========================
   SCORE
========================= */
function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem("nexolast-best", best);
  }
}

/* =========================
   GAME OVER
========================= */
function isGameOver() {
  return [...blockListEl.children].every(b => !canPlaceAnywhere(b.shape));
}

function showGameOver() {
  document.getElementById("game-over").classList.remove("hidden");
}

/* =========================
   START
========================= */
initBoard();
generateBlocks();
