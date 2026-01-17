/* =========================
   NEXOLAST - BLOCK BLAST CLONE
   FULL MECHANICS + SMOOTH FX
========================= */

/* ====== CONSTANTS ====== */
const SIZE = 8;
const TOTAL = SIZE * SIZE;

/* ====== DOM ====== */
const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const fxLayer = document.getElementById("fx-layer");
const gameOverEl = document.getElementById("game-over");
const restartBtn = document.getElementById("restart");

/* ====== STATE ====== */
let board = Array(TOTAL).fill(0);
let score = 0;
let combo = 0;
let draggingBlock = null;
let dragShape = null;

/* ====== SHAPES (BLOCK LIST) ====== */
const SHAPES = [
  [[0,0]],
  [[0,0],[1,0]],
  [[0,0],[2,0]],
  [[0,0],[3,0]],
  [[0,0],[4,0]],
  [[0,0],[0,1],[1,0],[1,1]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[0,0],[1,0],[1,1]],
  [[0,0],[1,0],[2,0],[2,1]],
];

/* ====== INIT ====== */
initBoard();
loadBest();
spawnBlocks();

/* ====== BOARD CREATION ====== */
function initBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < TOTAL; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    boardEl.appendChild(cell);
  }
}

/* ====== SCORE ====== */
function addScore(value, x, y, text = null) {
  score += value;
  scoreEl.textContent = score;

  if (score > bestEl.textContent) {
    bestEl.textContent = score;
    localStorage.setItem("nexolast-best", score);
  }

  if (x !== null && y !== null) {
    const fx = document.createElement("div");
    fx.className = "floating-text";
    fx.style.left = x + "px";
    fx.style.top = y + "px";
    fx.textContent = text || `+${value}`;
    fxLayer.appendChild(fx);
    setTimeout(() => fx.remove(), 700);
  }
}

function loadBest() {
  bestEl.textContent = localStorage.getItem("nexolast-best") || 0;
}

/* ====== BLOCK SPAWN (SMART RANDOMIZER) ====== */
function spawnBlocks() {
  blockListEl.innerHTML = "";
  let guaranteed = false;

  for (let i = 0; i < 3; i++) {
    let shape;
    if (!guaranteed) {
      shape = findFittableShape();
      guaranteed = true;
    } else {
      shape = randomShape();
    }
    blockListEl.appendChild(createBlock(shape));
  }

  if (!anyBlockFits()) {
    endGame();
  }
}

function randomShape() {
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

function findFittableShape() {
  for (let s of SHAPES) {
    if (canFitAnywhere(s)) return s;
  }
  return [[0,0]];
}

/* ====== CREATE BLOCK ====== */
function createBlock(shape) {
  const block = document.createElement("div");
  block.className = "block pop";
  block.draggable = true;
  block.shape = shape;

  const w = Math.max(...shape.map(p => p[0])) + 1;
  block.style.gridTemplateColumns = `repeat(${w}, auto)`;

  shape.forEach(() => {
    const tile = document.createElement("div");
    block.appendChild(tile);
  });

  block.addEventListener("dragstart", () => {
    draggingBlock = block;
    dragShape = shape;
  });

  block.addEventListener("dragend", clearPreview);
  return block;
}

/* ====== DRAG & PREVIEW ====== */
boardEl.addEventListener("dragover", e => {
  e.preventDefault();
  const idx = getCellIndex(e);
  if (idx === null) return;
  previewShape(idx, dragShape);
});

boardEl.addEventListener("drop", e => {
  e.preventDefault();
  const idx = getCellIndex(e);
  if (idx === null) return;

  if (placeShape(idx, dragShape)) {
    draggingBlock.remove();
    draggingBlock = null;
    clearPreview();
    handleClear();
    spawnBlocks();
  }
});

function getCellIndex(e) {
  const cell = e.target.closest(".cell");
  return cell ? Number(cell.dataset.index) : null;
}

function previewShape(index, shape) {
  clearPreview();
  let valid = true;

  shape.forEach(([x,y]) => {
    const i = index + x + y * SIZE;
    if (i < 0 || i >= TOTAL || board[i]) valid = false;
  });

  shape.forEach(([x,y]) => {
    const i = index + x + y * SIZE;
    if (i >= 0 && i < TOTAL) {
      boardEl.children[i].classList.add(valid ? "preview-valid" : "preview-invalid");
    }
  });
}

function clearPreview() {
  document.querySelectorAll(".preview-valid,.preview-invalid")
    .forEach(c => c.classList.remove("preview-valid","preview-invalid"));
}

/* ====== PLACE SHAPE ====== */
function placeShape(index, shape) {
  for (let [x,y] of shape) {
    const i = index + x + y * SIZE;
    if (i < 0 || i >= TOTAL || board[i]) return false;
  }

  shape.forEach(([x,y]) => {
    const i = index + x + y * SIZE;
    board[i] = 1;
    boardEl.children[i].classList.add("filled","pop");
  });

  addScore(shape.length * 10, 160, 300);
  return true;
}

/* ====== CLEAR SYSTEM ====== */
function handleClear() {
  let lines = [];

  for (let r = 0; r < SIZE; r++) {
    if ([...Array(SIZE).keys()].every(c => board[r*SIZE + c])) {
      lines.push([...Array(SIZE).keys()].map(c => r*SIZE + c));
    }
  }

  for (let c = 0; c < SIZE; c++) {
    if ([...Array(SIZE).keys()].every(r => board[r*SIZE + c])) {
      lines.push([...Array(SIZE).keys()].map(r => r*SIZE + c));
    }
  }

  if (lines.length) {
    combo++;
    lines.flat().forEach(i => {
      board[i] = 0;
      boardEl.children[i].classList.add("clear");
      setTimeout(() => boardEl.children[i].classList.remove("filled","clear"), 200);
    });

    addScore(lines.length * 100 * combo, 160, 200, `COMBO x${combo}`);
    shakeBoard();
  } else {
    combo = 0;
  }
}

/* ====== GAME OVER ====== */
function anyBlockFits() {
  return [...blockListEl.children].some(b => canFitAnywhere(b.shape));
}

function canFitAnywhere(shape) {
  for (let i = 0; i < TOTAL; i++) {
    if (placeCheck(i, shape)) return true;
  }
  return false;
}

function placeCheck(index, shape) {
  return shape.every(([x,y]) => {
    const i = index + x + y * SIZE;
    return i >= 0 && i < TOTAL && !board[i];
  });
}

function endGame() {
  gameOverEl.classList.remove("hidden");
}

restartBtn.onclick = () => location.reload();

/* ====== FX ====== */
function shakeBoard() {
  boardEl.style.transform = "translateX(-4px)";
  setTimeout(() => boardEl.style.transform = "translateX(4px)", 50);
  setTimeout(() => boardEl.style.transform = "translateX(0)", 100);
  }
