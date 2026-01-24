/* =========================
   NEXOLAST — OBSTACLE MODE
========================= */

const BOARD_SIZE = 8;
const TOTAL_OBSTACLE = 5;

const boardEl = document.getElementById("board");
const blockListEl = document.getElementById("block-list");
const fxLayer = document.getElementById("fx-layer");

let board = [];
let obstacles = new Set();
let obstacleCleared = 0;

let draggingBlock = null;
let ghostEl = null;
let ghostOffset = { x: 0, y: 0 };

let score = 0;
let best = localStorage.getItem("nexolast-best") || 0;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");

scoreEl.textContent = `OBSTACLE 0/${TOTAL_OBSTACLE}`;
bestEl.textContent = best;

/* =========================
   SOUND SYSTEM (NORMAL MODE + WIN)
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

function playSfx(name){
  const s = SFX[name];
  if(!s) return;
  s.currentTime = 0;
  s.play().catch(()=>{});
}

// unlock audio (mobile)
document.body.addEventListener("pointerdown", () => {
  Object.values(SFX).forEach(a=>{
    a.play().then(()=>a.pause()).catch(()=>{});
  });
},{ once:true });

/* =========================
   BLOCK SHAPES (UNCHANGED)
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
   INIT BOARD + OBSTACLE
========================= */
function initBoard(){
  board = [];
  obstacles.clear();
  obstacleCleared = 0;

  boardEl.innerHTML = "";

  for(let i=0;i<BOARD_SIZE*BOARD_SIZE;i++){
    board.push(0);
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    boardEl.appendChild(cell);
  }

  placeObstacles();
}

function placeObstacles(){
  let tries = 0;

  while(obstacles.size < TOTAL_OBSTACLE && tries < 200){
    const idx = Math.floor(Math.random() * board.length);

    if(board[idx] !== 0) { tries++; continue; }

    // hindari obstacle berdempetan
    const x = idx % BOARD_SIZE;
    const y = Math.floor(idx / BOARD_SIZE);

    let near = false;
    obstacles.forEach(o=>{
      const ox = o % BOARD_SIZE;
      const oy = Math.floor(o / BOARD_SIZE);
      if(Math.abs(ox-x)<=1 && Math.abs(oy-y)<=1) near = true;
    });

    if(!near){
      obstacles.add(idx);
      board[idx] = 2;
      boardEl.children[idx].classList.add("obstacle");
    }

    tries++;
  }
}

/* =========================
   BLOCK GENERATOR (UNCHANGED)
========================= */
function generateBlocks(){
  blockListEl.innerHTML="";
  let guaranteed=false;

  for(let i=0;i<3;i++){
    let shape;
    if(!guaranteed){
      const p = SHAPES.filter(s=>canPlaceAnywhere(s));
      if(p.length){
        shape = p[Math.floor(Math.random()*p.length)];
        guaranteed=true;
      }
    }
    if(!shape) shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
    createBlock(shape);
  }
}

function createBlock(shape){
  const block = document.createElement("div");
  block.className="block";
  block.shape=shape;
  block.style.gridTemplateColumns=`repeat(${shape[0].length},1fr)`;

  shape.forEach(row=>{
    row.forEach(cell=>{
      const d=document.createElement("div");
      if(!cell) d.style.visibility="hidden";
      block.appendChild(d);
    });
  });

  block.addEventListener("pointerdown",e=>startDrag(e,block));
  blockListEl.appendChild(block);
}

/* =========================
   DRAG SYSTEM (UNCHANGED)
========================= */
function startDrag(e, block){
  draggingBlock = block;

  ghostEl = block.cloneNode(true);
  ghostEl.style.position="fixed";
  ghostEl.style.pointerEvents="none";
  ghostEl.style.opacity="0.85";
  ghostEl.style.zIndex="999";
  document.body.appendChild(ghostEl);

  const r = block.getBoundingClientRect();
  ghostOffset.x = e.clientX - r.left;
  ghostOffset.y = e.clientY - r.top;

  moveGhost(e);
  document.addEventListener("pointermove",moveGhost);
  document.addEventListener("pointerup",endDrag);
}

function moveGhost(e){
  if(!ghostEl) return;

  ghostEl.style.left = e.clientX - ghostOffset.x + "px";
  ghostEl.style.top  = e.clientY - ghostOffset.y + "px";

  clearPreview();

  const cell = getCellFromPoint(e.clientX,e.clientY);
  if(!cell) return;

  const i = +cell.dataset.index;
  previewPlacement(
    draggingBlock.shape,
    i % BOARD_SIZE,
    Math.floor(i / BOARD_SIZE),
    canPlace(draggingBlock.shape, i % BOARD_SIZE, Math.floor(i / BOARD_SIZE))
  );
}

function endDrag(e){
  document.removeEventListener("pointermove",moveGhost);
  document.removeEventListener("pointerup",endDrag);

  clearPreview();

  const cell = getCellFromPoint(e.clientX,e.clientY);
  if(cell){
    const i = +cell.dataset.index;
    const x = i % BOARD_SIZE;
    const y = Math.floor(i / BOARD_SIZE);

    if(canPlace(draggingBlock.shape,x,y)){
      placeBlock(draggingBlock.shape,x,y);
      playSfx("place");

      draggingBlock.remove();
      checkClear();

      if(!blockListEl.children.length) generateBlocks();
      if(isGameOver()) showGameOver();
    }
  }

  ghostEl?.remove();
  ghostEl=null;
  draggingBlock=null;
}

/* =========================
   BOARD LOGIC (OBSTACLE AWARE)
========================= */
function canPlace(shape,x,y){
  for(let r=0;r<shape.length;r++)
    for(let c=0;c<shape[r].length;c++){
      if(!shape[r][c]) continue;
      const nx=x+c, ny=y+r;
      if(nx<0||ny<0||nx>=BOARD_SIZE||ny>=BOARD_SIZE) return false;
      if(board[ny*BOARD_SIZE+nx]) return false;
    }
  return true;
}

function canPlaceAnywhere(shape){
  for(let y=0;y<BOARD_SIZE;y++)
    for(let x=0;x<BOARD_SIZE;x++)
      if(canPlace(shape,x,y)) return true;
  return false;
}

function placeBlock(shape,x,y){
  shape.forEach((row,r)=>{
    row.forEach((cell,c)=>{
      if(!cell) return;
      const i = (y+r)*BOARD_SIZE + (x+c);
      board[i] = 1;
      boardEl.children[i].classList.add("filled","pop");
    });
  });
}

/* =========================
   CLEAR + OBSTACLE MECHANIC
========================= */
function checkClear(){
  let rows=[], cols=[];

  for(let y=0;y<BOARD_SIZE;y++){
    if(board.slice(y*BOARD_SIZE,y*BOARD_SIZE+BOARD_SIZE)
      .every(v=>v===1||v===2)) rows.push(y);
  }

  for(let x=0;x<BOARD_SIZE;x++){
    let full=true;
    for(let y=0;y<BOARD_SIZE;y++){
      const v = board[y*BOARD_SIZE+x];
      if(v!==1 && v!==2){ full=false; break; }
    }
    if(full) cols.push(x);
  }

  if(!rows.length && !cols.length) return;

  const affected = new Set();

  rows.forEach(y=>{
    for(let x=0;x<BOARD_SIZE;x++) affected.add(y*BOARD_SIZE+x);
  });
  cols.forEach(x=>{
    for(let y=0;y<BOARD_SIZE;y++) affected.add(y*BOARD_SIZE+x);
  });

  affected.forEach(i=>{
    if(obstacles.has(i)){
      obstacles.delete(i);
      obstacleCleared++;
      scoreEl.textContent = `OBSTACLE ${obstacleCleared}/${TOTAL_OBSTACLE}`;
    }
    board[i]=0;
    boardEl.children[i].classList.remove("filled","obstacle");
  });

  playSfx(affected.size > BOARD_SIZE ? "combo" : "clear");

  showCombo(rows.length + cols.length);

  if(obstacleCleared >= TOTAL_OBSTACLE) showWin();
}

/* =========================
   FX (UNCHANGED)
========================= */
function showCombo(count){
  const t=document.createElement("div");
  t.className="floating-text";
  t.textContent = count>1 ? `COMBO x${count}` : "+CLEAR";
  t.style.left="50%";
  t.style.top="140px";
  fxLayer.appendChild(t);
  setTimeout(()=>t.remove(),600);
}

/* =========================
   END STATES
========================= */
function isGameOver(){
  return [...blockListEl.children].every(b=>!canPlaceAnywhere(b.shape));
}

function showGameOver(){
  playSfx("gameover");
  document.getElementById("game-over").classList.remove("hidden");
}

function showWin(){
  playSfx("win");
  document.getElementById("you-win")?.classList.remove("hidden");
}

/* =========================
   UTIL
========================= */
function getCellFromPoint(x,y){
  const el=document.elementFromPoint(x,y);
  return el && el.classList.contains("cell") ? el : null;
}

function previewPlacement(shape,x,y,valid){
  shape.forEach((row,r)=>{
    row.forEach((cell,c)=>{
      if(!cell) return;
      const nx=x+c, ny=y+r;
      if(nx<0||ny<0||nx>=BOARD_SIZE||ny>=BOARD_SIZE) return;
      boardEl.children[ny*BOARD_SIZE+nx]
        .classList.add(valid?"preview-valid":"preview-invalid");
    });
  });
}

function clearPreview(){
  document.querySelectorAll(".preview-valid,.preview-invalid")
    .forEach(c=>c.classList.remove("preview-valid","preview-invalid"));
}

/* =========================
   START
========================= */
initBoard();
generateBlocks();
