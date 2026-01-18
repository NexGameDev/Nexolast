/* =========================
   NEXOLAST - GAME LOGIC
   ========================= */

/* ===== CONFIG ===== */
const GRID_SIZE = 8;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

/* ===== STATE ===== */
let board = Array(CELL_COUNT).fill(0);
let score = 0;
let combo = 1;
let highScore = parseInt(localStorage.getItem("nexolast_highscore")) || 0;

let draggingBlock = null;
let dragShape = null;
let ghostCells = [];

/* ===== ELEMENTS ===== */
const boardEl = document.querySelector(".board");
const cells = document.querySelectorAll(".cell");
const trayEl = document.querySelector(".tray");
const scoreEl = document.querySelector(".score");
const bestEl = document.querySelector(".best");

bestEl.textContent = highScore;

/* ===== SHAPES ===== */
const SHAPES = [
  [[0,0]],
  [[0,0],[1,0]],
  [[0,0],[2,0]],
  [[0,0],[3,0]],
  [[0,0],[4,0]],
  [[0,0],[0,1]],
  [[0,0],[0,2]],
  [[0,0],[0,3]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[1,0],[0,1],[1,1],[2,1],[1,2]]
];

/* ===== INIT ===== */
spawnTray();
updateScore();

/* ======================
   BLOCK GENERATION
   ====================== */
function spawnTray() {
  trayEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const shape = smartRandomShape();
    const block = createBlock(shape);
    trayEl.appendChild(block);
  }
}

function smartRandomShape() {
  const empty = board.filter(v => v === 0).length;
  if (empty < 20) {
    return SHAPES[Math.floor(Math.random() * 4)];
  }
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

/* ======================
   BLOCK CREATION
   ====================== */
function createBlock(shape) {
  const block = document.createElement("div");
  block.className = "block";
  block.dataset.shape = JSON.stringify(shape);

  shape.forEach(p => {
    const cell = document.createElement("div");
    cell.className = "mini";
    cell.style.left = p[0] * 22 + "px";
    cell.style.top = p[1] * 22 + "px";
    block.appendChild(cell);
  });

  enableDrag(block);
  return block;
}

/* ======================
   DRAG SYSTEM
   ====================== */
function enableDrag(block) {
  block.addEventListener("pointerdown", e => {
    draggingBlock = block;
    dragShape = JSON.parse(block.dataset.shape);
    block.classList.add("dragging");
  });

  window.addEventListener("pointermove", e => {
    if (!draggingBlock) return;
    draggingBlock.style.left = e.clientX - 40 + "px";
    draggingBlock.style.top = e.clientY - 40 + "px";
    showGhost(e.clientX, e.clientY);
  });

  window.addEventListener("pointerup", e => {
    if (!draggingBlock) return;
    if (placeBlock(e.clientX, e.clientY)) {
      draggingBlock.remove();
      afterPlace();
    } else {
      clearGhost();
      draggingBlock.style.left = "";
      draggingBlock.style.top = "";
    }
    draggingBlock.classList.remove("dragging");
    draggingBlock = null;
  });
}

/* ======================
   GHOST PREVIEW
   ====================== */
function showGhost(x, y) {
  clearGhost();
  const rect = boardEl.getBoundingClientRect();
  const gx = Math.floor((x - rect.left) / rect.width * GRID_SIZE);
  const gy = Math.floor((y - rect.top) / rect.height * GRID_SIZE);

  let valid = true;
  dragShape.forEach(p => {
    const nx = gx + p[0];
    const ny = gy + p[1];
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) valid = false;
    else if (board[ny * GRID_SIZE + nx]) valid = false;
  });

  dragShape.forEach(p => {
    const nx = gx + p[0];
    const ny = gy + p[1];
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return;
    const idx = ny * GRID_SIZE + nx;
    cells[idx].classList.add(valid ? "ghost-valid" : "ghost-invalid");
    ghostCells.push(idx);
  });
}

function clearGhost() {
  ghostCells.forEach(i => {
    cells[i].classList.remove("ghost-valid", "ghost-invalid");
  });
  ghostCells = [];
}

/* ======================
   PLACE BLOCK
   ====================== */
function placeBlock(x, y) {
  const rect = boardEl.getBoundingClientRect();
  const gx = Math.floor((x - rect.left) / rect.width * GRID_SIZE);
  const gy = Math.floor((y - rect.top) / rect.height * GRID_SIZE);

  for (let p of dragShape) {
    const nx = gx + p[0];
    const ny = gy + p[1];
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return false;
    if (board[ny * GRID_SIZE + nx]) return false;
  }

  dragShape.forEach(p => {
    const idx = (gy + p[1]) * GRID_SIZE + (gx + p[0]);
    board[idx] = 1;
    cells[idx].classList.add("filled");
  });

  score += dragShape.length * 10;
  return true;
}

/* ======================
   CLEAR SYSTEM
   ====================== */
function afterPlace() {
  clearGhost();
  const lines = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    if ([...Array(GRID_SIZE)].every((_, x) => board[y * GRID_SIZE + x])) {
      lines.push([...Array(GRID_SIZE)].map((_, x) => y * GRID_SIZE + x));
    }
  }

  for (let x = 0; x < GRID_SIZE; x++) {
    if ([...Array(GRID_SIZE)].every((_, y) => board[y * GRID_SIZE + x])) {
      lines.push([...Array(GRID_SIZE)].map((_, y) => y * GRID_SIZE + x));
    }
  }

  if (lines.length) {
    combo++;
    lines.flat().forEach(i => {
      board[i] = 0;
      cells[i].classList.remove("filled");
    });
    score += lines.length * 100 * combo;
  } else {
    combo = 1;
  }

  updateScore();
  checkGameOver();

  if (trayEl.children.length === 0) {
    spawnTray();
  }
}

/* ======================
   SCORE & GAME OVER
   ====================== */
function updateScore() {
  scoreEl.textContent = score;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("nexolast_highscore", highScore);
    bestEl.textContent = highScore;
  }
}

function checkGameOver() {
  const blocks = document.querySelectorAll(".block");
  let canPlay = false;

  blocks.forEach(block => {
    const shape = JSON.parse(block.dataset.shape);
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (canPlace(shape, x, y)) canPlay = true;
      }
    }
  });

  if (!canPlay) {
    alert("Game Over");
  }
}

function canPlace(shape, x, y) {
  for (let p of shape) {
    const nx = x + p[0];
    const ny = y + p[1];
    if (nx < 0 || ny < 0 || nx >= GRID_SIZE || ny >= GRID_SIZE) return false;
    if (board[ny * GRID_SIZE + nx]) return false;
  }
  return true;
    }
