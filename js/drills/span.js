// Digit span: hold a growing string of digits, forwards and backwards.
import { h, askText, feedback, wait } from '../ui.js';
import { step, tier } from '../staircase.js';

export const id = 'span';
export const name = 'Digit span';
export const maxLevel = 12;

export const params = t => ({ digits: t + 3 });

export function checkAnswer(seq, typed, backward) {
  const want = (backward ? [...seq].reverse() : seq).join('');
  return typed.replace(/[\s,]/g, '') === want;
}

async function trial(el, r, digits, backward) {
  const seq = Array.from({ length: digits }, () => Math.floor(r() * 10));
  el.replaceChildren(h('p', `Remember ${digits} digits. You will type them ${backward ? 'backwards' : 'forwards'}.`));
  await wait(1500);
  for (const d of seq) {
    el.replaceChildren(h('div', { class: 'big', 'aria-live': 'assertive' }, d));
    await wait(800);
    el.replaceChildren(h('div', { class: 'big', 'aria-hidden': 'true' }, ' '));
    await wait(200);
  }
  const t0 = Date.now();
  const typed = await askText(el, `Type the digits ${backward ? 'backwards' : 'forwards'}`, { inputmode: 'numeric' });
  const ok = checkAnswer(seq, typed, backward);
  await feedback(el, ok, ok ? '' : `It was ${(backward ? [...seq].reverse() : seq).join(' ')}`);
  return { ok, ms: Date.now() - t0 };
}

export async function run(el, { level, r }) {
  let lv = level, correct = 0, ms = 0;
  const total = 8;
  for (let i = 0; i < total; i++) {
    const res = await trial(el, r, params(tier(lv)).digits, i % 2 === 1);
    if (res.ok) correct++;
    ms += res.ms;
    lv = step(lv, res.ok, maxLevel);
  }
  return { correct, total, ms: Math.round(ms / total), level: lv };
}

// Benchmark: forwards only, from 4 digits; two misses in a row at one length ends it.
export async function bench(el, r) {
  let len = 4, best = 0, misses = 0;
  while (len <= 15 && misses < 2) {
    const { ok } = await trial(el, r, len, false);
    if (ok) { best = len; len++; misses = 0; } else misses++;
  }
  return best;
}
