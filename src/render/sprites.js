// Builds cached offscreen canvases from the character-grid sprites.
import { PAL } from './palette.js';
import { TEMPLATES, ICONS } from './spriteData.js';

const cache = new Map();

function build(grid, map) {
  const h = grid.length;
  const w = grid[0].length;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  for (let r = 0; r < h; r++) {
    for (let col = 0; col < w; col++) {
      let ch = grid[r][col];
      if (map && map[ch]) ch = map[ch];
      if (ch === '.' || !PAL[ch]) continue;
      x.fillStyle = PAL[ch];
      x.fillRect(col, r, 1, 1);
    }
  }
  return c;
}

/** Solid-color silhouette of a sprite, for outlines and glows. */
function silhouette(src, color) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const x = c.getContext('2d');
  x.drawImage(src, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color;
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

export function itemSprite(item) {
  const key = `item:${item.id}`;
  if (!cache.has(key)) cache.set(key, build(TEMPLATES[item.tpl], item.colors));
  return cache.get(key);
}

export function itemOutline(item, color) {
  const key = `outline:${item.id}:${color}`;
  if (!cache.has(key)) cache.set(key, silhouette(itemSprite(item), color));
  return cache.get(key);
}

export function iconSprite(name, colors) {
  const key = `icon:${name}:${colors ? Object.values(colors).join('') : ''}`;
  if (!cache.has(key)) cache.set(key, build(ICONS[name], colors));
  return cache.get(key);
}

/** Draw an item with a 1px glow outline (used for hover/hint highlights). */
export function drawItemOutlined(ctx, item, x, y, color) {
  const o = itemOutline(item, color);
  ctx.drawImage(o, x - 1, y);
  ctx.drawImage(o, x + 1, y);
  ctx.drawImage(o, x, y - 1);
  ctx.drawImage(o, x, y + 1);
  ctx.drawImage(itemSprite(item), x, y);
}
