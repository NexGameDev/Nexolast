/* ===== VIEWPORT FIX ===== */
function setVH() {
  document.documentElement.style.setProperty(
    '--vh',
    `${window.innerHeight * 0.01}px`
  );
}
setVH();
window.addEventListener('resize', setVH);

/* ===== ELEMENTS ===== */
const boardEl = document.querySelector('.board');
const piecesEl = document.querySelector('.pieces');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

let score = 0;
let best = localStorage.getItem('nexolast-best') || 0;
bestEl.textContent = best;

/* ===== BOARD DATA ===== */
const SIZE = 8;
let board = Array(SIZE * SIZE).fill(0);
const cells = [];

for (let i = 0; i < SIZE * SIZE; i++) {
  const c = document.createElement('div');
  c.className = 'cell';
  boardEl.appendChild(c);
  cells.push(c);
}

/* ===== SHAPES ===== */
const SHAPES = [
  [[0,0]],
  [[0,0],[1,0]],
  [[0,0],[2,0],[1,0]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[0,0],[1,0],[2,0],[1,1]],
  [[0,0],[0,1],[0,2]],
];

/* ===== CREATE PIECE ===== */
function spawnPieces() {
  piecesEl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    createPiece(SHAPES[Math.floor(Math.random() * SHAPES.length)]);
  }
}

function createPiece(shape) {
  const p = document.createElement('div');
  p.className = 'piece';
  p.dataset.shape = JSON.stringify(shape);

  shape.forEach(([x,y]) => {
    const b = document.createElement('div');
    b.className = 'block';
    b.style.left = `${x * 30}px`;
    b.style.top  = `${y * 30}px`;
    p.appendChild(b);
  });

  piecesEl.appendChild(p);
  center(p);
  drag(p);
}

function center(p) {
  const r = p.getBoundingClientRect();
  p.style.left = `${piecesEl.offsetWidth/2 - r.width/2}px`;
  p.style.top  = `${piecesEl.offsetHeight/2 - r.height/2}px`;
}

/* ===== DRAG ===== */
let dragPiece = null, ox=0, oy=0, sx=0, sy=0;

function drag(p) {
  p.addEventListener('pointerdown', e => {
    dragPiece = p;
    p.setPointerCapture(e.pointerId);
    const r = p.getBoundingClientRect();
    ox = e.clientX - r.left;
    oy = e.clientY - r.top;
    sx = p.offsetLeft;
    sy = p.offsetTop;
    p.classList.add('dragging');
  });

  p.addEventListener('pointermove', e => {
    if (!dragPiece) return;
    p.style.left = `${e.clientX - ox}px`;
    p.style.top  = `${e.clientY - oy}px`;
    preview(p);
  });

  p.addEventListener('pointerup', e => {
    if (!dragPiece) return;
    p.classList.remove('dragging');
    p.releasePointerCapture(e.pointerId);

    if (!place(p)) {
      p.style.left = sx + 'px';
      p.style.top  = sy + 'px';
    } else {
      p.remove();
      if (!piecesEl.children.length) spawnPieces();
    }
    clearGhost();
    dragPiece = null;
  });
}

/* ===== PLACEMENT ===== */
function preview(p) {
  clearGhost();
  const shape = JSON.parse(p.dataset.shape);
  const rect = boardEl.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / (rect.width / SIZE));
  const y = Math.floor((event.clientY - rect.top) / (rect.height / SIZE));

  let ok = true;
  shape.forEach(([dx,dy]) => {
    const nx = x + dx, ny = y + dy;
    if (nx<0||ny<0||nx>=SIZE||ny>=SIZE||board[ny*SIZE+nx]) ok=false;
  });

  shape.forEach(([dx,dy]) => {
    const nx = x + dx, ny = y + dy;
    if (nx>=0&&ny>=0&&nx<SIZE&&ny<SIZE)
      cells[ny*SIZE+nx].classList.add(ok?'ghost-valid':'ghost-invalid');
  });
}

function clearGhost() {
  cells.forEach(c => c.classList.remove('ghost-valid','ghost-invalid'));
}

function place(p) {
  const shape = JSON.parse(p.dataset.shape);
  const rect = boardEl.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / (rect.width / SIZE));
  const y = Math.floor((event.clientY - rect.top) / (rect.height / SIZE));

  for (let [dx,dy] of shape) {
    const nx=x+dx, ny=y+dy;
    if (nx<0||ny<0||nx>=SIZE||ny>=SIZE||board[ny*SIZE+nx]) return false;
  }

  shape.forEach(([dx,dy])=>{
    const i=(y+dy)*SIZE+(x+dx);
    board[i]=1;
    cells[i].classList.add('filled');
    score+=10;
  });

  clearLines();
  updateScore();
  return true;
}

/* ===== CLEAR ===== */
function clearLines() {
  let cleared = 0;

  for (let y=0;y<SIZE;y++) {
    if ([...Array(SIZE)].every((_,x)=>board[y*SIZE+x])) {
      for (let x=0;x<SIZE;x++) board[y*SIZE+x]=0;
      cleared++;
    }
  }

  for (let x=0;x<SIZE;x++) {
    if ([...Array(SIZE)].every((_,y)=>board[y*SIZE+x])) {
      for (let y=0;y<SIZE;y++) board[y*SIZE+x]=0;
      cleared++;
    }
  }

  if (cleared) {
    score += cleared * 100;
    render();
    floatText(`+${cleared*100}`);
  }
}

function render() {
  board.forEach((v,i)=>{
    cells[i].classList.toggle('filled', v);
  });
}

/* ===== SCORE ===== */
function updateScore() {
  scoreEl.textContent = score;
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem('nexolast-best', best);
  }
}

function floatText(text) {
  const f = document.createElement('div');
  f.className='float';
  f.textContent=text;
  f.style.left='50%';
  f.style.top='50%';
  document.body.appendChild(f);
  setTimeout(()=>f.remove(),1000);
}

/* ===== START ===== */
spawnPieces();
