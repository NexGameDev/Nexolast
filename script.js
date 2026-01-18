const board = document.getElementById("board");
const blocksContainer = document.getElementById("blocks");
const scoreEl = document.getElementById("score");

let score = 0;
let grid = Array(64).fill(0);

// buat papan
for (let i = 0; i < 64; i++) {
  const cell = document.createElement("div");
  cell.className = "cell";
  cell.dataset.index = i;
  board.appendChild(cell);
}

// bentuk blok
const shapes = [
  [0,1,8,9],     // kotak
  [0,8,16],      // garis
  [0,1,2],       // garis kecil
  [0,8,9]        // L kecil
];

function spawnBlocks() {
  blocksContainer.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const shape = shapes[Math.floor(Math.random() * shapes.length)];
    const block = document.createElement("div");
    block.className = "block";
    block.draggable = true;
    block.dataset.shape = JSON.stringify(shape);

    shape.forEach(() => {
      block.appendChild(document.createElement("div"));
    });

    block.addEventListener("dragstart", dragStart);
    blocksContainer.appendChild(block);
  }
}

let currentShape = null;

function dragStart(e) {
  currentShape = JSON.parse(e.target.dataset.shape);
}

board.addEventListener("dragover", e => e.preventDefault());

board.addEventListener("drop", e => {
  const index = Number(e.target.dataset.index);
  if (placeBlock(index, currentShape)) {
    clearLines();
    score += currentShape.length;
    scoreEl.textContent = score;
    spawnBlocks();
  }
});

function placeBlock(start, shape) {
  for (let s of shape) {
    const pos = start + s;
    if (pos >= 64 || grid[pos]) return false;
  }

  shape.forEach(s => {
    const pos = start + s;
    grid[pos] = 1;
    board.children[pos].classList.add("filled");
  });
  return true;
}

function clearLines() {
  for (let r = 0; r < 8; r++) {
    const row = grid.slice(r*8, r*8+8);
    if (row.every(v => v)) {
      for (let i = r*8; i < r*8+8; i++) {
        grid[i] = 0;
        board.children[i].classList.remove("filled");
      }
      score += 10;
    }
  }
}

spawnBlocks();
