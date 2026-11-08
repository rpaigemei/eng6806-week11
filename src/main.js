// Boot: pixel-perfect scaling, input, scene switching and the game loop.
import { loadSave } from './save.js';
import { Audio } from './audio.js';
import { THEMES } from './themes/index.js';
import { PAL } from './render/palette.js';
import { titleScene } from './scenes/title.js';
import { levelSelectScene } from './scenes/levelSelect.js';
import { puzzleScene } from './scenes/puzzle.js';
import { decorateScene } from './scenes/decorate.js';

const W = 320;
const H = 180;
const SCENES = { title: titleScene, levels: levelSelectScene, puzzle: puzzleScene, decorate: decorateScene };

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// The canvas backing store is k device pixels per game pixel; scenes draw in
// 320x180 logical units through a scale transform. Pixel art stays crisp
// (nearest-neighbor) and text is rendered smooth at full resolution.
let k = 1;

const save = loadSave();
const game = {
  W,
  H,
  save,
  audio: new Audio(save),
  themes: THEMES,
  scene: null,
  sceneName: '',
  fade: 0,
  go(name, params = {}) {
    this.scene = SCENES[name](this, params);
    this.sceneName = name;
    this.fade = 1;
  },
};
window.cozyGame = game; // handy for debugging and automated checks

function resize() {
  // Scale by a whole number of *device* pixels so art stays crisp on phones
  // (e.g. 1.9x CSS on a 3x screen becomes 5 device px per game pixel).
  const dpr = window.devicePixelRatio || 1;
  const fit = Math.min(window.innerWidth / W, window.innerHeight / H);
  const device = Math.floor(fit * dpr);
  const scale = device >= 1 ? device / dpr : fit;
  canvas.style.width = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
  k = Math.max(1, device);
  if (canvas.width !== W * k) {
    canvas.width = W * k;
    canvas.height = H * k;
  }
}
window.addEventListener('resize', resize);
resize();

// ---------- input ----------
function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}
canvas.addEventListener('pointerdown', (e) => {
  if (!e.isPrimary) return;
  e.preventDefault();
  game.audio.unlock();
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {
    /* ignore */
  }
  const p = toLogical(e);
  game.scene.move?.(p);
  game.scene.down?.(p);
});
canvas.addEventListener('pointermove', (e) => {
  if (!e.isPrimary) return;
  game.scene.move?.(toLogical(e));
});
canvas.addEventListener('pointerup', (e) => {
  if (!e.isPrimary) return;
  const p = toLogical(e);
  game.scene.up?.(p);
  if (e.pointerType !== 'mouse') game.scene.move?.({ x: -99, y: -99 }); // clear touch hover
});
canvas.addEventListener('pointercancel', () => game.scene.cancel?.());
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') game.scene.back?.();
});

// ---------- loop ----------
let last = performance.now();
let t = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  t += dt;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.imageSmoothingEnabled = false;
  game.scene.update?.(dt);
  game.scene.draw(ctx, t, dt);
  if (game.fade > 0) {
    ctx.globalAlpha = game.fade;
    ctx.fillStyle = PAL.k;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    game.fade = Math.max(0, game.fade - dt * 4);
  }
  requestAnimationFrame(frame);
}

// Wait (briefly) for the reading font so the first frame isn't in a fallback face.
Promise.race([
  document.fonts.load('400 16px "VT323"'),
  new Promise((r) => setTimeout(r, 1500)),
])
  .catch(() => {})
  .then(() => {
    game.go('title');
    requestAnimationFrame(frame);
  });

// Portrait phones: suggest rotating, but let people play anyway.
const rotate = document.getElementById('rotate');
function checkOrientation() {
  const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 700;
  rotate.hidden = !portrait || rotate.dataset.dismissed === '1';
}
rotate.addEventListener('click', () => {
  rotate.dataset.dismissed = '1';
  rotate.hidden = true;
});
window.addEventListener('resize', checkOrientation);
checkOrientation();
