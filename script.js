/* Project 1 — Proverb Orbits (p5 + JSON)
   yØx (o3™), Connections Lab
   — Data: data.json (local)
   — Library: p5.js
   — Interactions: filter, search, slider, hover/click reveal
*/

let rawData = [];
let nodes = [];
let themeSelect, searchInput, energyRange, resetBtn;
let tooltip;

let energy = 1.0; // global multiplier controlled by slider

function rand(min, max){ return Math.random() * (max - min) + min; }

class Node {
  constructor(item, idx){
    this.item = item;
    this.idx = idx;
    this.radius = rand(80, 220);
    this.angle = rand(0, Math.PI * 2);
    this.baseSpeed = rand(0.003, 0.01);
    this.size = 10 + (item.theme === 'wisdom' ? 6 : 0) + (item.theme === 'destiny' ? 4 : 0);
    this.c = this.colorByTheme(item.theme);
  }
  colorByTheme(theme){
    switch(theme){
      case 'wisdom':    return [103, 247, 201];
      case 'community': return [255, 209, 102];
      case 'resilience':return [179, 157, 219];
      case 'destiny':   return [255, 120, 150];
      default:          return [180, 200, 230];
    }
  }
  pos(){
    const cx = width/2, cy = height/2;
    const x = cx + Math.cos(this.angle) * this.radius;
    const y = cy + Math.sin(this.angle) * this.radius * 0.72;
    return {x, y};
  }
  update(){ this.angle += this.baseSpeed * energy; }
  draw(isHighlighted=false){
    const {x, y} = this.pos();
    push(); noFill(); stroke(30, 40, 70); strokeWeight(1);
    ellipse(width/2, height/2, this.radius*2, this.radius*2*0.72); pop();

    push(); noStroke(); const [r,g,b] = this.c;
    fill(r, g, b, isHighlighted ? 180 : 60);
    circle(x, y, this.size + (isHighlighted ? 16 : 8)); pop();

    push(); noStroke(); fill(230); circle(x, y, this.size); pop();
  }
  hit(mx, my){
    const {x, y} = this.pos();
    const dx = mx - x, dy = my - y;
    return dx*dx + dy*dy < (this.size + 10) * (this.size + 10);
  }
}

async function loadData(){
  const res = await fetch('data.json');
  if(!res.ok) throw new Error('Failed to load data.json');
  rawData = await res.json();
}

function currentTheme(){ return themeSelect.value || 'all'; }
function currentQuery(){ return (searchInput.value || '').trim().toLowerCase(); }

function filterData(){
  const theme = currentTheme();
  const q = currentQuery();
  return rawData.filter(d => {
    const themeOk = (theme === 'all') || (d.theme === theme);
    const qOk = !q || d.text.toLowerCase().includes(q)
      || (d.language||'').toLowerCase().includes(q)
      || (d.country||'').toLowerCase().includes(q);
    return themeOk && qOk;
  });
}

function rebuildNodes(){
  const filtered = filterData();
  nodes = filtered.map((item, idx) => new Node(item, idx));
}

function setup(){
  const canvas = createCanvas(windowWidth - 32, 480);
  canvas.parent('p5-holder');
  pixelDensity(1.5);

  themeSelect = document.getElementById('themeSelect');
  searchInput = document.getElementById('searchInput');
  energyRange = document.getElementById('energyRange');
  resetBtn    = document.getElementById('resetBtn');
  tooltip     = document.getElementById('tooltip');

  themeSelect.addEventListener('change', rebuildNodes);
  searchInput.addEventListener('input', rebuildNodes);
  energyRange.addEventListener('input', e => energy = parseFloat(e.target.value));
  resetBtn.addEventListener('click', () => {
    themeSelect.value = 'all';
    searchInput.value = '';
    energyRange.value = '1.0';
    energy = 1.0;
    rebuildNodes();
  });

  loadData().then(() => { rebuildNodes(); loop(); })
            .catch(err => { console.error(err); noLoop(); });

  noCursor();
}

function draw(){
  background(10, 10, 20);
  drawStars();

  push(); noStroke(); fill(20, 20, 40); circle(width/2, height/2, 80); pop();

  let hoveredIndex = -1;
  for(let i=0; i<nodes.length; i++){
    if(nodes[i].hit(mouseX, mouseY)) hoveredIndex = i;
  }

  for(let i=0; i<nodes.length; i++){
    nodes[i].draw(i === hoveredIndex);
    nodes[i].update();
  }

  if(hoveredIndex >= 0){
    showTooltip(nodes[hoveredIndex].item, mouseX, mouseY);
  } else {
    hideTooltip();
  }

  push(); noFill(); stroke(240, 240, 255, 140); circle(mouseX, mouseY, 14); pop();
}

function drawStars(){
  randomSeed(42);
  for(let i=0; i<120; i++){
    const x = random(width), y = random(height);
    const a = 140 + 80 * sin((frameCount + i*7) * 0.01);
    stroke(255, 255, 255, a); point(x, y);
  }
}

function showTooltip(item, x, y){
  tooltip.style.display = 'block';
  tooltip.setAttribute('aria-hidden', 'false');
  tooltip.innerHTML = `
    <strong>${item.language} · ${item.country}</strong><br/>
    <em>${item.theme}</em><br/>
    ${item.text}
  `;
  const pad = 12;
  tooltip.style.left = `${Math.min(x + pad, window.innerWidth - 340)}px`;
  tooltip.style.top  = `${Math.max(y - 10, 10)}px`;
}
function hideTooltip(){
  tooltip.style.display = 'none';
  tooltip.setAttribute('aria-hidden', 'true');
}

function windowResized(){ resizeCanvas(windowWidth - 32, 480); }
