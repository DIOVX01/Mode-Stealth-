// What changed? A scene, a blank, the scene again with one change: click where it changed.
import { h, showGrid, gridPick, feedback, wait } from '../ui.js';
import { step, tier } from '../staircase.js';
import { pick } from '../rng.js';
import { OBJECTS } from '../data/objects.js';

export const id = 'changed';
export const name = 'What changed?';
export const maxLevel = 10;
const COLS = 6, CELLS = 36;

export const params = t => ({
  objects: Math.min(30, 4 + 2 * t),
  kinds: t < 5 ? ['add', 'remove', 'move'] : ['add', 'remove', 'move', 'swap'],
});

const cellsWhere = (scene, filled) => scene.map((o, i) => (!!o === filled ? i : -1)).filter(i => i >= 0);
const any = (r, arr) => arr[Math.floor(r() * arr.length)];

export function makeScene(r, n) {
  const scene = Array(CELLS).fill(null);
  const objs = pick(r, OBJECTS, n);
  pick(r, [...Array(CELLS).keys()], n).forEach((c, i) => { scene[c] = objs[i]; });
  return scene;
}

export function makeChange(scene, kind, r) {
  const scene2 = [...scene];
  const present = new Set(scene.filter(Boolean).map(o => o.glyph));
  const fresh = () => any(r, OBJECTS.filter(o => !present.has(o.glyph)));
  const filled = cellsWhere(scene, true), empty = cellsWhere(scene, false);
  if (kind === 'add') { const c = any(r, empty); scene2[c] = fresh(); return { scene2, cell: c }; }
  if (kind === 'remove') { const c = any(r, filled); scene2[c] = null; return { scene2, cell: c }; }
  if (kind === 'move') {
    const from = any(r, filled), to = any(r, empty);
    scene2[to] = scene[from]; scene2[from] = null;
    return { scene2, cell: to };
  }
  const c = any(r, filled); scene2[c] = fresh(); // swap: replace with a different object
  return { scene2, cell: c };
}

const rowCol = i => 'row ' + (Math.floor(i / COLS) + 1) + ', column ' + ((i % COLS) + 1);
const glyphs = s => s.map(o => (o ? o.glyph : ''));
const labels = s => s.map((o, i) => (o ? o.name : 'empty, ' + rowCol(i)));

async function round(el, r, t) {
  const { objects, kinds } = params(t);
  const scene = makeScene(r, objects);
  const { scene2, cell } = makeChange(scene, any(r, kinds), r);
  const box = h('div');
  el.replaceChildren(h('p', 'Study the scene'), box);
  showGrid(box, glyphs(scene), { cols: COLS, labels: labels(scene) });
  await wait(3000);
  el.replaceChildren(h('div', { class: 'big', 'aria-hidden': 'true' }, ' '));
  await wait(800);
  const t0 = Date.now();
  const [picked] = await gridPick(el, glyphs(scene2), { cols: COLS, labels: labels(scene2), prompt: 'Click where something changed' });
  const ok = picked === cell;
  await feedback(el, ok, ok ? '' : 'It was ' + rowCol(cell) + '.');
  return { ok, ms: Date.now() - t0 };
}

export async function run(el, { level, r }) {
  let lv = level, correct = 0, ms = 0;
  const total = 6;
  for (let i = 0; i < total; i++) {
    const res = await round(el, r, tier(lv));
    if (res.ok) correct++;
    ms += res.ms;
    lv = step(lv, res.ok, maxLevel);
  }
  return { correct, total, ms: Math.round(ms / total), level: lv };
}

// Benchmark: tier 4 fixed, 10 rounds; score = accuracy %.
export async function bench(el, r) {
  let correct = 0;
  for (let i = 0; i < 10; i++) if ((await round(el, r, 4)).ok) correct++;
  return correct * 10;
}
