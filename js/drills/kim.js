// Kim's game: study a set of objects briefly, then pick them out from distractors.
import { h, showGrid, gridPick, feedback, wait } from '../ui.js';
import { step, tier } from '../staircase.js';
import { pick, shuffle } from '../rng.js';
import { OBJECTS } from '../data/objects.js';

export const id = 'kim';
export const name = 'Kim’s game';
export const maxLevel = 13;

export const params = t => ({ items: 3 + t, showMs: Math.max(4000, 10500 - 500 * t) });

export function score(shown, picked) {
  const hits = [...picked].filter(x => shown.has(x)).length;
  const falsePicks = picked.size - hits;
  return { hits, falsePicks, correct: hits === shown.size && falsePicks === 0 };
}

async function round(el, r, items, showMs) {
  const pool = pick(r, OBJECTS, items * 2);
  const shown = pool.slice(0, items);
  const study = h('div');
  el.replaceChildren(h('p', `Study these ${items} objects`), study);
  showGrid(study, shown.map(o => o.glyph), { cols: Math.ceil(Math.sqrt(items)), labels: shown.map(o => o.name) });
  await wait(showMs);
  const all = shuffle(r, pool);
  const t0 = Date.now();
  const picks = await gridPick(el, all.map(o => o.glyph), {
    multi: true, cols: Math.ceil(Math.sqrt(all.length)), labels: all.map(o => o.name),
    prompt: 'Pick every object you saw', submitLabel: 'Check',
  });
  const s = score(new Set(shown.map(o => o.glyph)), new Set(picks.map(i => all[i].glyph)));
  const missed = shown.filter(o => !picks.some(i => all[i] === o)).map(o => o.name);
  const detail = s.correct ? '' : `Found ${s.hits} of ${items}, ${s.falsePicks} wrong picks.` + (missed.length ? ` Missed: ${missed.join(', ')}.` : '');
  await feedback(el, s.correct, detail);
  return { ...s, ms: Date.now() - t0 };
}

export async function run(el, { level, r }) {
  let lv = level, correct = 0, ms = 0;
  const total = 5;
  for (let i = 0; i < total; i++) {
    const p = params(tier(lv));
    const res = await round(el, r, p.items, p.showMs);
    if (res.correct) correct++;
    ms += res.ms;
    lv = step(lv, res.correct, maxLevel);
  }
  return { correct, total, ms: Math.round(ms / total), level: lv };
}

// Benchmark: 12 objects for 10 s; score = hits minus false picks.
export async function bench(el, r) {
  const res = await round(el, r, 12, 10000);
  return res.hits - res.falsePicks;
}
