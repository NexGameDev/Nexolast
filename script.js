/* =========================
   NEXOLAST – FINAL SCRIPT
   TAP BASED (NO DRAG)
========================= */

const SIZE = 8;
const TOTAL = SIZE * SIZE;

/* ===== DOM ===== */
const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const fxLayer = document.getElementById("fx-layer");
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
  [[0,0],[3,0]],
  [[0,0],[0,1]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[0,1],[0,2]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[0,0],[1,0],[2,0]],
  [[0,0],[0,1],[1,1]],
];

/* ===== INIT ===== */
initBoard();
loadBest();
spawnBlocks();

/* ===== BOARD ===== */
function initBoard(){
  boardEl.innerHTML = "";
  for(let i=0;i<TOTAL;i++){
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;

    cell.addEventListener("click", () => tryPlace(i));
    cell.addEventListener("mouseenter", () => preview(i));

    boardEl.appendChild(cell);
  }
}

/* ===== SCORE ===== */
function addScore(val, text=null){
  score += val;
  scoreEl.textContent = score;

  if(score > bestEl.textContent){
    bestEl.textContent = score;
    localStorage.setItem("nexolast-best", score);
  }

  if(text){
    const fx = document.createElement("div");
    fx.className = "floating-text";
    fx.textContent = text;
    fxLayer.appendChild(fx);
    setTimeout(()=>fx.remove(),600);
  }
}

function loadBest(){
  bestEl.textContent = localStorage.getItem("nexolast-best") || 0;
}

/* ===== SPAWN 3 BLOCKS ===== */
function spawnBlocks(){
  blockListEl.innerHTML = "";

  for(let i=0;i<3;i++){
    const shape = getFittableShape();
    blockListEl.appendChild(createBlock(shape));
  }

  if(!anyBlockFits()) endGame();
}

function getFittableShape(){
  for(const s of SHAPES){
    if(canFitAnywhere(s)) return s;
  }
  return SHAPES[0];
}

/* ===== CREATE BLOCK ===== */
function createBlock(shape){
  const block = document.createElement("div");
  block.className = "block pop";
  block.shape = shape;

  const w = Math.max(...shape.map(p=>p[0])) + 1;
  block.style.gridTemplateColumns = `repeat(${w}, auto)`;

  shape.forEach(()=>{
    block.appendChild(document.createElement("div"));
  });

  block.addEventListener("click", () => selectBlock(block));

  return block;
}

/* ===== SELECT BLOCK ===== */
function selectBlock(block){
  document.querySelectorAll(".block.selected")
    .forEach(b => b.classList.remove("selected"));

  selectedBlock = block;
  selectedShape = block.shape;
  block.classList.add("selected");
}

/* ===== PREVIEW ===== */
function preview(index){
  clearPreview();
  if(!selectedShape) return;

  const row = Math.floor(index / SIZE);
  let valid = true;

  selectedShape.forEach(([x,y])=>{
    const r = row + y;
    const c = (index % SIZE) + x;
    if(r>=SIZE || c>=SIZE || board[r*SIZE+c]) valid = false;
  });

  selectedShape.forEach(([x,y])=>{
    const r = row + y;
    const c = (index % SIZE) + x;
    if(r<SIZE && c<SIZE){
      boardEl.children[r*SIZE+c]
        .classList.add(valid ? "preview-valid" : "preview-invalid");
    }
  });
}

function clearPreview(){
  document.querySelectorAll(".preview-valid,.preview-invalid")
    .forEach(c => c.classList.remove("preview-valid","preview-invalid"));
}

/* ===== PLACE ===== */
function tryPlace(index){
  if(!selectedShape) return;
  if(!canPlace(index, selectedShape)) return;

  place(index, selectedShape);

  selectedBlock.remove();
  selectedBlock = null;
  selectedShape = null;
  clearPreview();

  handleClear();

  if(blockListEl.children.length === 0){
    spawnBlocks();
  }
}

function canPlace(index, shape){
  const row = Math.floor(index / SIZE);
  return shape.every(([x,y])=>{
    const r = row + y;
    const c = (index % SIZE) + x;
    return r<SIZE && c<SIZE && !board[r*SIZE+c];
  });
}

function place(index, shape){
  const row = Math.floor(index / SIZE);
  shape.forEach(([x,y])=>{
    const r = row + y;
    const c = (index % SIZE) + x;
    const i = r*SIZE + c;
    board[i] = 1;
    boardEl.children[i].classList.add("filled","pop");
  });
  addScore(shape.length * 10);
}

/* ===== CLEAR LINE ===== */
function handleClear(){
  let lines = [];

  for(let r=0;r<SIZE;r++){
    if([...Array(SIZE)].every((_,c)=>board[r*SIZE+c])){
      lines.push([...Array(SIZE)].map((_,c)=>r*SIZE+c));
    }
  }

  for(let c=0;c<SIZE;c++){
    if([...Array(SIZE)].every((_,r)=>board[r*SIZE+c])){
      lines.push([...Array(SIZE)].map((_,r)=>r*SIZE+c));
    }
  }

  if(lines.length){
    combo++;
    lines.flat().forEach(i=>{
      board[i]=0;
      boardEl.children[i].classList.add("clear");
      setTimeout(()=>{
        boardEl.children[i].classList.remove("filled","clear");
      },200);
    });
    addScore(lines.length * 100 * combo, `COMBO x${combo}`);
  }else{
    combo = 0;
  }
}

/* ===== GAME OVER ===== */
function canFitAnywhere(shape){
  for(let i=0;i<TOTAL;i++){
    if(canPlace(i, shape)) return true;
  }
  return false;
}

function anyBlockFits(){
  return [...blockListEl.children].some(b=>canFitAnywhere(b.shape));
}

function endGame(){
  gameOverEl.classList.remove("hidden");
}

restartBtn.onclick = ()=>location.reload();
