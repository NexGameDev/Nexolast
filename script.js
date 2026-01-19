/* =========================
   NEXOLAST - FINAL STABLE
   TAP BASED + SMART RNG
========================= */

const SIZE = 8;
const TOTAL = SIZE * SIZE;

/* ===== DOM ===== */
const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const scorePanel = document.getElementById("score-panel");
const gameOverEl = document.getElementById("game-over");
const restartBtn = document.getElementById("restart");

/* ===== STATE ===== */
let board = Array(TOTAL).fill(0);
let score = 0;
let combo = 0;

let selectedBlock = null;
let selectedShape = null;

/* ===== SHAPES ===== */
const SHAPES = [
  [[0,0]],
  [[0,0],[1,0]],
  [[0,0],[2,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0],[1,1]],
];

/* ===== INIT ===== */
initBoard();
loadBest();
spawnBlocks();

/* ===== BOARD ===== */
function initBoard() {
  boardEl.innerHTML = "";
  for (let i = 0; i < TOTAL; i++) {
    const c = document.createElement("div");
    c.className = "cell";
    c.dataset.index = i;

    c.addEventListener("click", () => {
      if (!selectedShape) return;
      if (canPlace(i, selectedShape)) {
        place(i, selectedShape);
        selectedBlock.remove();
        clearSelection();
        handleClear();
        if (!blockListEl.children.length) spawnBlocks();
      }
    });

    c.addEventListener("mousemove", () => preview(i));
    boardEl.appendChild(c);
  }
}

/* ===== SCORE ===== */
function addScore(val) {
  score += val;
  scoreEl.textContent = score;

  if (score > bestEl.textContent) {
    bestEl.textContent = score;
    localStorage.setItem("nexolast-best", score);
  }
}

function loadBest() {
  bestEl.textContent = localStorage.getItem("nexolast-best") || 0;
}

/* ===== SPAWN BLOCKS ===== */
function spawnBlocks() {
  blockListEl.innerHTML = "";
  combo = 0;
  updateCombo();

  const shape = findFittableShape();

  for (let i = 0; i < 3; i++) {
    blockListEl.appendChild(createBlock(shape));
  }

  if (!canFitAnywhere(shape)) endGame();
}

function findFittableShape() {
  for (let s of SHAPES) {
    if (canFitAnywhere(s)) return s;
  }
  return [[0,0]];
}

/* ===== BLOCK ===== */
function createBlock(shape) {
  const block = document.createElement("div");
  block.className = "block pop";
  block.shape = shape;

  const w = Math.max(...shape.map(p => p[0])) + 1;
  block.style.gridTemplateColumns = `repeat(${w}, auto)`;

  shape.forEach(() => block.appendChild(document.createElement("div")));

  block.addEventListener("click", () => selectBlock(block));
  return block;
}

function selectBlock(block) {
  clearSelection();
  selectedBlock = block;
  selectedShape = block.shape;
  block.classList.add("selected");
}

function clearSelection() {
  document.querySelectorAll(".block.selected")
    .forEach(b => b.classList.remove("selected"));
  selectedBlock = null;
  selectedShape = null;
  clearPreview();
}

/* ===== PREVIEW ===== */
function preview(index) {
  clearPreview();
  if (!selectedShape) return;

  const row = Math.floor(index / SIZE);
  let valid = true;

  selectedShape.forEach(([x,y]) => {
    const r = row + y;
    const c = (index % SIZE) + x;
    if (r >= SIZE || c >= SIZE || board[r*SIZE+c]) valid = false;
  });

  selectedShape.forEach(([x,y]) => {
    const r = row + y;
    const c = (index % SIZE) + x;
    if (r < SIZE && c < SIZE) {
      boardEl.children[r*SIZE+c]
        .classList.add(valid ? "preview-valid" : "preview-invalid");
    }
  });
}

function clearPreview() {
  document.querySelectorAll(".preview-valid,.preview-invalid")
    .forEach(c => c.classList.remove("preview-valid","preview-invalid"));
}

/* ===== PLACE ===== */
function canPlace(index, shape) {
  const row = Math.floor(index / SIZE);
  return shape.every(([x,y]) => {
    const r = row + y;
    const c = (index % SIZE) + x;
    return r < SIZE && c < SIZE && !board[r*SIZE+c];
  });
}

function place(index, shape) {
  const row = Math.floor(index / SIZE);
  shape.forEach(([x,y]) => {
    const r = row + y;
    const c = (index % SIZE) + x;
    const i = r*SIZE+c;
    board[i] = 1;
    boardEl.children[i].classList.add("filled","pop");
  });
  addScore(shape.length * 10);
}

/* ===== CLEAR ===== */
function handleClear() {
  let cleared = 0;

  for (let r = 0; r < SIZE; r++) {
    if ([...Array(SIZE).keys()].every(c => board[r*SIZE+c])) {
      for (let c = 0; c < SIZE; c++) clearCell(r*SIZE+c);
      cleared++;
    }
  }

  for (let c = 0; c < SIZE; c++) {
    if ([...Array(SIZE).keys()].every(r => board[r*SIZE+c])) {
      for (let r = 0; r < SIZE; r++) clearCell(r*SIZE+c);
      cleared++;
    }
  }

  if (cleared) {
    combo++;
    addScore(cleared * 100 * combo);
  } else combo = 0;

  updateCombo();
}

function clearCell(i) {
  board[i] = 0;
  boardEl.children[i].classList.add("clear");
  setTimeout(() => {
    boardEl.children[i].classList.remove("filled","clear");
  }, 200);
}

function updateCombo() {
  scorePanel.dataset.combo = combo ? `COMBO x${combo}` : "";
}

/* ===== GAME OVER ===== */
function canFitAnywhere(shape) {
  for (let i = 0; i < TOTAL; i++) {
    if (canPlace(i, shape)) return true;
  }
  return false;
}

function endGame() {
  gameOverEl.classList.remove("hidden");
}

restartBtn.onclick = () => location.reload();
