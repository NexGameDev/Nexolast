/* =========================
   BASIC SETUP
========================= */
const BOARD_SIZE = 8;
const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const fxLayer = document.getElementById("fx-layer");

let board = [];
let draggingBlock = null;
let ghostEl = null;
let ghostOffset = { x: 0, y: 0 };

let score = 0;
let best = localStorage.getItem("nexolast-best") || 0;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
scoreEl.textContent = score;
bestEl.textContent = best;

/* =========================
   BLOCK SHAPES
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
    if (!shape) shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
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

  block.addEventListener("pointerdown", e => startDrag(e, block));
  blockListEl.appendChild(block);
}

/* =========================
   DRAG SYSTEM
========================= */
function startDrag(e, block) {
  draggingBlock = block;
  block.classList.add("selected");

  ghostEl = block.cloneNode(true);
  ghostEl.style.position = "fixed";
  ghostEl.style.pointerEvents = "none";
  ghostEl.style.opacity = "0.8";
  ghostEl.style.zIndex = "999";
  document.body.appendChild(ghostEl);

  const rect = block.getBoundingClientRect();
  ghostOffset.x = e.clientX - rect.left;
  ghostOffset.y = e.clientY - rect.top;

  moveGhost(e);
  document.addEventListener("pointermove", moveGhost);
  document.addEventListener("pointerup", endDrag);
}

function moveGhost(e) {
  if (!ghostEl) return;

  ghostEl.style.left = e.clientX - ghostOffset.x + "px";
  ghostEl.style.top = e.clientY - ghostOffset.y + "px";

  clearPreview();

  const cell = getCellFromPoint(e.clientX, e.clientY);
  if (!cell) return;

  const index = +cell.dataset.index;
  const x = index % BOARD_SIZE;
  const y = Math.floor(index / BOARD_SIZE);

  const valid = canPlace(draggingBlock.shape, x, y);
  previewPlacement(draggingBlock.shape, x, y, valid);
}

function endDrag(e) {
  document.removeEventListener("pointermove", moveGhost);
  document.removeEventListener("pointerup", endDrag);

  clearPreview();

  const cell = getCellFromPoint(e.clientX, e.clientY);
  if (cell) {
    const index = +cell.dataset.index;
    const x = index % BOARD_SIZE;
    const y = Math.floor(index / BOARD_SIZE);

    if (canPlace(draggingBlock.shape, x, y)) {
      placeBlock(draggingBlock.shape, x, y);
      draggingBlock.remove();
      checkClear();
      if (!blockListEl.children.length) generateBlocks();
      if (isGameOver()) showGameOver();
    }
  }

  draggingBlock.classList.remove("selected");
  draggingBlock = null;
  ghostEl?.remove();
  ghostEl = null;
}

/* =========================
   PREVIEW / HIGHLIGHT
========================= */
function previewPlacement(shape, x, y, valid) {
  shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      const nx = x + c;
      const ny = y + r;
      if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) return;
      const idx = ny * BOARD_SIZE + nx;
      boardEl.children[idx].classList.add(
        valid ? "preview-valid" : "preview-invalid"
      );
    });
  });
}

function clearPreview() {
  document.querySelectorAll(".cell.preview-valid, .cell.preview-invalid")
    .forEach(c => c.classList.remove("preview-valid", "preview-invalid"));
}

/* =========================
   BOARD LOGIC
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
  let added = 0;
  shape.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      const idx = (y + r) * BOARD_SIZE + (x + c);
      board[idx] = 1;
      boardEl.children[idx].classList.add("filled", "pop");
      added++;
    });
  });
  score += added * 10;
  updateScore();
}

/* =========================
   CLEAR & COMBO
========================= */
function checkClear() {
  let rows = [];
  let cols = [];

  for (let y = 0; y < BOARD_SIZE; y++) {
    if (board.slice(y * BOARD_SIZE, y * BOARD_SIZE + BOARD_SIZE).every(v => v))
      rows.push(y);
  }

  for (let x = 0; x < BOARD_SIZE; x++) {
    let full = true;
    for (let y = 0; y < BOARD_SIZE; y++) {
      if (!board[y * BOARD_SIZE + x]) { full = false; break; }
    }
    if (full) cols.push(x);
  }

  if (!rows.length && !cols.length) return;

  const cleared = rows.length + cols.length;
  rows.forEach(y => {
    for (let x = 0; x < BOARD_SIZE; x++) clearCell(y * BOARD_SIZE + x);
  });
  cols.forEach(x => {
    for (let y = 0; y < BOARD_SIZE; y++) clearCell(y * BOARD_SIZE + x);
  });

  score += cleared * 100;
  updateScore();
  showCombo(cleared);
}

function clearCell(i) {
  board[i] = 0;
  boardEl.children[i].classList.remove("filled");
}

/* =========================
   FX
========================= */
function showCombo(count) {
  const t = document.createElement("div");
  t.className = "floating-text";
  t.textContent = count > 1 ? `COMBO x${count}` : "+CLEAR";
  t.style.left = "50%";
  t.style.top = "140px";
  fxLayer.appendChild(t);
  setTimeout(() => t.remove(), 600);
}

/* =========================
   SCORE & GAME OVER
========================= */
function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem("nexolast-best", best);
  }
}

function isGameOver() {
  return [...blockListEl.children].every(b => !canPlaceAnywhere(b.shape));
}

function showGameOver() {
  document.getElementById("game-over").classList.remove("hidden");
}

/* =========================
   UTIL
========================= */
function getCellFromPoint(x, y) {
  return document.elementFromPoint(x, y)?.classList.contains("cell")
    ? document.elementFromPoint(x, y)
    : null;
}

/* =========================
   START
========================= */
initBoard();
generateBlocks();
