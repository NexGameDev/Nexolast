/* =========================
   NEXOLAST — OBSTACLE MODE
========================= */

const BOARD_SIZE = 8;
const TOTAL_OBSTACLE = 5;

/* =========================
   ELEMENTS
========================= */
const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const fxLayer = document.getElementById("fx-layer");

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

/* =========================
   STATE
========================= */
let board = [];
let obstacles = new Set();
let obstacleCleared = 0;

let draggingBlock = null;
let ghostEl = null;
let ghostOffset = { x: 0, y: 0 };

let best = localStorage.getItem("nexolast-best") || 0;

scoreEl.textContent = `OBSTACLE 0/${TOTAL_OBSTACLE}`;
bestEl.textContent = best;

/* =========================
   SOUND SYSTEM
========================= */
const SFX = {
  place: new Audio("sound/place.mp3"),
  clear: new Audio("sound/clear.mp3"),
  combo: new Audio("sound/combo.mp3"),
  gameover: new Audio("sound/gameover.mp3"),
  win: new Audio("sound/win.mp3"),
};

Object.values(SFX).forEach(a => {
  a.volume = 0.7;
  a.preload = "auto";
});

function playSfx(name) {
  if (!SFX[name]) return;
  SFX[name].currentTime = 0;
  SFX[name].play().catch(() => {});
}

// unlock audio (HP fix)
document.body.addEventListener(
  "pointerdown",
  () => {
    Object.values(SFX).forEach(a => {
      a.play().then(() => a.pause()).catch(() => {});
    });
  },
  { once: true }
);

/* =========================
   SHAPES
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
  obstacles.clear();
  obstacleCleared = 0;
  boardEl.innerHTML = "";

  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
    board.push(0);
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    boardEl.appendChild(cell);
  }

  placeObstacles();
}

/* =========================
   OBSTACLES
========================= */
function placeObstacles() {
  let tries = 0;
  while (obstacles.size < TOTAL_OBSTACLE && tries < 200) {
    const idx = Math.floor(Math.random() * board.length);
    if (board[idx] !== 0) { tries++; continue; }

    obstacles.add(idx);
    board[idx] = 2;
    boardEl.children[idx].classList.add("obstacle");
    tries++;
  }
}

/* =========================
   BLOCK GENERATOR
========================= */
function generateBlocks() {
  blockListEl.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    createBlock(shape);
  }
}

function createBlock(shape) {
  const block = document.createElement("div");
  block.className = "block";
  block.shape = shape;
  block.style.gridTemplateColumns = `repeat(${shape[0].length},1fr)`;

  shape.forEach(r => {
    r.forEach(c => {
      const d = document.createElement("div");
      if (!c) d.style.visibility = "hidden";
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
  ghostEl = block.cloneNode(true);
  ghostEl.style.position = "fixed";
  ghostEl.style.pointerEvents = "none";
  ghostEl.style.opacity = "0.8";
  ghostEl.style.zIndex = "999";
  document.body.appendChild(ghostEl);

  const r = block.getBoundingClientRect();
  ghostOffset.x = e.clientX - r.left;
  ghostOffset.y = e.clientY - r.top;

  moveGhost(e);
  document.addEventListener("pointermove", moveGhost);
  document.addEventListener("pointerup", endDrag);
}

function moveGhost(e) {
  if (!ghostEl) return;
  ghostEl.style.left = e.clientX - ghostOffset.x + "px";
  ghostEl.style.top = e.clientY - ghostOffset.y + "px";
}

function endDrag(e) {
  document.removeEventListener("pointermove", moveGhost);
  document.removeEventListener("pointerup", endDrag);

  const cell = getCellFromPoint(e.clientX, e.clientY);
  if (cell) {
    const i = +cell.dataset.index;
    const x = i % BOARD_SIZE;
    const y = Math.floor(i / BOARD_SIZE);

    if (canPlace(draggingBlock.shape, x, y)) {
      placeBlock(draggingBlock.shape, x, y);
      playSfx("place");
      draggingBlock.remove();
      checkClear();
      if (!blockListEl.children.length) generateBlocks();
      if (isGameOver()) showGameOver();
    }
  }

  ghostEl?.remove();
  ghostEl = null;
  draggingBlock = null;
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

function placeBlock(shape, x, y) {
  shape.forEach((r, ry) => {
    r.forEach((c, rx) => {
      if (!c) return;
      const i = (y + ry) * BOARD_SIZE + (x + rx);
      board[i] = 1;
      boardEl.children[i].classList.add("filled");
    });
  });
}

/* =========================
   CLEAR + WIN
========================= */
function checkClear() {
  let cleared = false;

  for (let i of [...obstacles]) {
    if (board[i] === 0) {
      obstacles.delete(i);
      obstacleCleared++;
      cleared = true;
    }
  }

  scoreEl.textContent = `OBSTACLE ${obstacleCleared}/${TOTAL_OBSTACLE}`;

  if (cleared) playSfx("clear");

  if (obstacleCleared >= TOTAL_OBSTACLE) showWin();
}

/* =========================
   END STATES
========================= */
function isGameOver() {
  return [...blockListEl.children].every(b =>
    !canPlaceAnywhere(b.shape)
  );
}

function canPlaceAnywhere(shape) {
  for (let y = 0; y < BOARD_SIZE; y++)
    for (let x = 0; x < BOARD_SIZE; x++)
      if (canPlace(shape, x, y)) return true;
  return false;
}

function showGameOver() {
  playSfx("gameover");
  document.getElementById("game-over").classList.remove("hidden");
}

function showWin() {
  playSfx("win");
  alert("YOU WIN!");
}

/* =========================
   UTIL
========================= */
function getCellFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  return el && el.classList.contains("cell") ? el : null;
}

/* =========================
   START
========================= */
initBoard();
generateBlocks();
