// Weekly benchmark: the same fixed-difficulty tests every time, so Day 1 vs now is a fair comparison.
import { h, wait, countdown } from '../ui.js';
import { rng } from '../rng.js';
import * as span from '../drills/span.js';
import * as math from '../drills/math.js';
import * as kim from '../drills/kim.js';
import * as changed from '../drills/changed.js';
import * as cups from '../drills/cups.js';
import * as palace from '../drills/palace.js';

export const BENCH_TESTS = [
  { id: 'span', label: 'Digit span', unit: 'digits' },
  { id: 'math', label: 'Mental math', unit: 'per minute' },
  { id: 'kim', label: 'Kim’s game', unit: 'of 12' },
  { id: 'words', label: 'Word recall', unit: 'of 20' },
  { id: 'changed', label: 'What changed?', unit: '%' },
  { id: 'cups', label: 'Cups tracking', unit: '%' },
];

export async function runBenchmark(el, ctx) {
  const r = rng(Date.now() >>> 0);
  await new Promise(resolve => {
    const btn = h('button', { type: 'button', class: 'primary', onclick: resolve }, 'Start benchmark');
    el.replaceChildren(
      h('h2', 'Weekly benchmark'),
      h('p', 'Six short tests at fixed difficulty, the same every week. About 10 minutes. This is how you see real progress, so give it full effort.'),
      btn);
    btn.focus();
  });
  const part = async (title, fn) => {
    el.replaceChildren(h('h2', title));
    await wait(1500);
    return fn(el);
  };
  const scores = {};
  const { words, shownAt } = await part('Word list: remember these', b => palace.benchShow(b, r));
  scores.span = await part('Digit span', b => span.bench(b, r));
  scores.math = await part('Mental math, 60 seconds', b => math.bench(b, r));
  scores.kim = await part('Kim’s game', b => kim.bench(b, r));
  const left = Math.ceil(120 - (Date.now() - shownAt) / 1000);
  if (left > 0) await countdown(el, left, 'Word list recall starts in');
  scores.words = await part('Word list recall', b => palace.benchRecall(b, words));
  scores.changed = await part('What changed?', b => changed.bench(b, r));
  scores.cups = await part('Cups tracking', b => cups.bench(b, r));
  if (!el.isConnected) return;
  ctx.commit({ ...ctx.state, benchmarks: [...ctx.state.benchmarks, { day: ctx.today(), scores }] });
  await new Promise(resolve => {
    const btn = h('button', { type: 'button', class: 'primary', onclick: resolve }, 'Continue');
    el.replaceChildren(h('h2', 'Benchmark saved'),
      h('dl', { class: 'scores' }, BENCH_TESTS.map(t => [h('dt', t.label), h('dd', scores[t.id] + ' ' + t.unit)])),
      btn);
    btn.focus();
  });
}
