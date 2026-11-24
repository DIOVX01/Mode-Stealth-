// Where was it? Study object positions, get distracted, then put each object back.
import { h, showGrid, gridPick, feedback, wait, countdown } from '../ui.js';
import { step, tier } from '../staircase.js';
import { pick, shuffle } from '../rng.js';
import { OBJECTS } from '../data/objects.js';

export const id = 'where';
export const name = 'Where was it?';
export const maxLevel = 10;

export const params = t => ({ objects: 2 + t, grid: t <= 6 ? 5 : 6, studyMs: 8000 });

export function scorePlacement(truth, placed) {
  let right = 0;
  for (const [obj, cell] of truth) if (placed.get(obj) === cell) right++;
  return { right, total: truth.size };
}

async function round(el, r, t) {
  const { objects, grid, studyMs } = params(t);
  const n = grid * grid;
  const objs = pick(r, OBJECTS, objects);
  const cells = pick(r, [...Array(n).keys()], objects);
  const truth = new Map(objs.map((o, i) => [o.glyph, cells[i]]));
  const scene = Array(n).fill('');
  const names = Array(n).fill('empty');
  objs.forEach((o, i) => { scene[cells[i]] = o.glyph; names[cells[i]] = o.name; });
  const box = h('div');
  el.replaceChildren(h('p', 'Remember where each object is'), box);
  showGrid(box, scene, { cols: grid, labels: names });
  await wait(studyMs);
  await countdown(el, 6, 'Count back by 7 from ' + (200 + Math.floor(r() * 700)) + ', out loud');
  const placed = new Map();
  const board = Array(n).fill('');
  const t0 = Date.now();
  for (const o of shuffle(r, objs)) {
    const [c] = await gridPick(el, board, { cols: grid, prompt: 'Where was the ' + o.name + ' (' + o.glyph + ')?' });
    placed.set(o.glyph, c);
    board[c] = o.glyph;
  }
  const s = scorePlacement(truth, placed);
  const ok = s.right === s.total;
  await feedback(el, ok, ok ? '' : s.right + ' of ' + s.total + ' in the right place.');
  return { ok, ms: Math.round((Date.now() - t0) / objects) };
}

export async function run(el, { level, r }) {
  let lv = level, correct = 0, ms = 0;
  const total = 4;
  for (let i = 0; i < total; i++) {
    const res = await round(el, r, tier(lv));
    if (res.ok) correct++;
    ms += res.ms;
    lv = step(lv, res.ok, maxLevel);
  }
  return { correct, total, ms: Math.round(ms / total), level: lv };
}
