/* ===============================
   NEXOLAST — FINAL GAME LOGIC
   HTML & CSS TIDAK DIUBAH
=============================== */

const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const gameOverEl = document.getElementById("game-over");
const restartBtn = document.getElementById("restart");

const SIZE = 8;
let board = [];
let score = 0;
let combo = 0;
let dragging = null;
let ghostCells = [];

const BEST_KEY = "nexolast_best";

/* ===============================
   SHAPES
=============================== */
const SHAPES = [
  [[1]],
  [[1,1]],
  [[1],[1]],
  [[1,1,1]],
  [[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,0],[1,1]],
  [[0,1],[1,1]],
  [[1,1,1],[0,1,0]]
];

/* ===============================
   INIT
=============================== */
function init() {
  board = Array(SIZE * SIZE).fill(0);
  boardEl.innerHTML = "";
  for (let i = 0; i < SIZE * SIZE; i++) {
    const c = document.createElement("div");
    c.className = "cell";
    boardEl.appendChild(c);
  }

  score = 0;
  combo = 0;
  scoreEl.textContent = 0;

  bestEl.textContent = localStorage.getItem(BEST_KEY) || 0;

  gameOverEl.classList.add("hidden");

  generateBlocks();
  render();
}

init();

/* ===============================
   BLOCK GENERATION
=============================== */
function generateBlocks() {
  blockListEl.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const shape = smartRandomShape();
    const block = createBlock(shape);
    blockListEl.appendChild(block);
  }
}

function smartRandomShape() {
  const empty = board.filter(v => v === 0).length;
  if (empty < 15) {
    return SHAPES.filter(s => s.flat().length <= 2)[Math.floor(Math.random()*3)];
  }
  return SHAPES[Math.floor(Math.random() * SHAPES.length)];
}

/* ===============================
   BLOCK ELEMENT
=============================== */
function createBlock(shape) {
  const b = document.createElement("div");
  b.className = "block";
  b.dataset.shape = JSON.stringify(shape);

  shape.forEach(row => {
    const r = document.createElement("div");
    r.className = "block-row";
    row.forEach(v => {
      const c = document.createElement("div");
      c.className = "block-cell";
      if (!v) c.style.visibility = "hidden";
      r.appendChild(c);
    });
    b.appendChild(r);
  });

  enableDrag(b);
  return b;
}

/* ===============================
   DRAG & DROP (TOUCH + MOUSE)
=============================== */
function enableDrag(block) {
  const start = e => {
    dragging = block;
    block.classList.add("dragging");
  };

  const move = e => {
    if (!dragging) return;
    const touch = e.touches ? e.touches[0] : e;
    const rect = boardEl.getBoundingClientRect();
    const x = Math.floor((touch.clientX - rect.left) / (rect.width / SIZE));
    const y = Math.floor((touch.clientY - rect.top) / (rect.height / SIZE));
    updateGhost(x, y);
  };

  const end = () => {
    if (!dragging) return;
    if (ghostCells.every(c => c.valid)) {
      placeBlock(dragging, ghostCells);
      dragging.remove();
      afterPlace();
    }
    clearGhost();
    dragging.classList.remove("dragging");
    dragging = null;
  };

  block.addEventListener("mousedown", start);
  block.addEventListener("touchstart", start);

  window.addEventListener("mousemove", move);
  window.addEventListener("touchmove", move, { passive:false });

  window.addEventListener("mouseup", end);
  window.addEventListener("touchend", end);
}

/* ===============================
   GHOST PREVIEW
=============================== */
function updateGhost(x, y) {
  clearGhost();
  const shape = JSON.parse(dragging.dataset.shape);

  ghostCells = [];

  shape.forEach((row, dy) => {
    row.forEach((v, dx) => {
      if (!v) return;
      const bx = x + dx;
      const by = y + dy;
      const idx = by * SIZE + bx;
      const valid =
        bx >= 0 && bx < SIZE &&
        by >= 0 && by < SIZE &&
        board[idx] === 0;

      ghostCells.push({ idx, valid });
    });
  });

  ghostCells.forEach(c => {
    if (c.idx >= 0 && c.idx < SIZE*SIZE) {
      boardEl.children[c.idx].classList.add(
        c.valid ? "ghost-valid" : "ghost-invalid"
      );
    }
  });
}

function clearGhost() {
  [...boardEl.children].forEach(c => {
    c.classList.remove("ghost-valid", "ghost-invalid");
  });
  ghostCells = [];
}

/* ===============================
   PLACE BLOCK
=============================== */
function placeBlock(block, cells) {
  cells.forEach(c => board[c.idx] = 1);
  score += cells.length * 10;
}

/* ===============================
   CLEAR LOGIC
=============================== */
function afterPlace() {
  let cleared = 0;

  for (let y = 0; y < SIZE; y++) {
    const row = [...Array(SIZE).keys()].map(x => board[y*SIZE+x]);
    if (row.every(v => v === 1)) {
      for (let x = 0; x < SIZE; x++) board[y*SIZE+x] = 0;
      cleared++;
    }
  }

  for (let x = 0; x < SIZE; x++) {
    const col = [...Array(SIZE).keys()].map(y => board[y*SIZE+x]);
    if (col.every(v => v === 1)) {
      for (let y = 0; y < SIZE; y++) board[y*SIZE+x] = 0;
      cleared++;
    }
  }

  if (cleared) {
    combo++;
    score += cleared * 100 * combo;
  } else {
    combo = 0;
  }

  scoreEl.textContent = score;
  saveBest();

  if (blockListEl.children.length === 0) generateBlocks();
  render();
  checkGameOver();
}

/* ===============================
   GAME OVER
=============================== */
function checkGameOver() {
  const blocks = [...blockListEl.children];
  const canPlace = blocks.some(b => {
    const shape = JSON.parse(b.dataset.shape);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (canFit(shape, x, y)) return true;
      }
    }
    return false;
  });

  if (!canPlace) {
    gameOverEl.classList.remove("hidden");
  }
}

function canFit(shape, x, y) {
  return shape.every((row, dy) =>
    row.every((v, dx) => {
      if (!v) return true;
      const bx = x + dx;
      const by = y + dy;
      return (
        bx >= 0 && bx < SIZE &&
        by >= 0 && by < SIZE &&
        board[by*SIZE+bx] === 0
      );
    })
  );
}

/* ===============================
   RENDER
=============================== */
function render() {
  board.forEach((v, i) => {
    boardEl.children[i].classList.toggle("filled", v === 1);
  });
}

/* ===============================
   BEST SCORE
=============================== */
function saveBest() {
  const best = Math.max(score, localStorage.getItem(BEST_KEY) || 0);
  localStorage.setItem(BEST_KEY, best);
  bestEl.textContent = best;
}

/* ===============================
   RESTART
=============================== */
restartBtn.onclick = init;
