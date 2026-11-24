// Mental arithmetic: timed, adaptive. Each answer is one staircase trial.
import { h, askText, feedback, wait } from '../ui.js';
import { step, tier } from '../staircase.js';

export const id = 'math';
export const name = 'Mental math';
export const maxLevel = 12;

export function params(t) {
  return {
    ops: t < 3 ? ['+', '-'] : t < 5 ? ['+', '-', '×'] : ['+', '-', '×', '÷'],
    maxOperand: Math.round(9 * 1.5 ** (t - 1)),
  };
}

const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));

export function problem(t, r) {
  const { ops, maxOperand } = params(t);
  const op = ops[Math.floor(r() * ops.length)];
  const mulA = Math.min(maxOperand, 5 + 3 * t), mulB = Math.min(12, 3 + t);
  if (op === '+') { const a = int(r, 1, maxOperand), b = int(r, 1, maxOperand); return { text: `${a} + ${b}`, answer: a + b }; }
  if (op === '-') { let a = int(r, 1, maxOperand), b = int(r, 1, maxOperand); if (b > a) [a, b] = [b, a]; return { text: `${a} - ${b}`, answer: a - b }; }
  if (op === '×') { const a = int(r, 2, mulA), b = int(r, 2, mulB); return { text: `${a} × ${b}`, answer: a * b }; }
  const q = int(r, 2, mulA), d = int(r, 2, mulB);
  return { text: `${q * d} ÷ ${d}`, answer: q };
}

async function timed(el, r, seconds, levelFn, onTrial) {
  const end = Date.now() + seconds * 1000;
  let correct = 0, total = 0, ms = 0;
  while (Date.now() < end) {
    const p = problem(tier(levelFn()), r);
    const box = h('div');
    el.replaceChildren(h('p', { class: 'muted' }, `${Math.ceil((end - Date.now()) / 1000)} s left`), h('div', { class: 'big' }, p.text), box);
    const t0 = Date.now();
    const typed = await Promise.race([askText(box, 'Answer', { inputmode: 'numeric', submitLabel: 'Enter' }), wait(end - Date.now()).then(() => null)]);
    if (typed === null) break;
    const ok = Number(typed.trim()) === p.answer && typed.trim() !== '';
    total++; ms += Date.now() - t0; if (ok) correct++;
    onTrial(ok);
    await feedback(el, ok, ok ? '' : `${p.text} = ${p.answer}`, 350);
  }
  return { correct, total, ms: total ? Math.round(ms / total) : 0 };
}

export async function run(el, { level, r, seconds = 300 }) {
  let lv = level;
  const res = await timed(el, r, seconds, () => lv, ok => { lv = step(lv, ok, maxLevel); });
  return { ...res, level: lv };
}

// Benchmark: fixed tier 4 for 60 s; score = correct answers per minute.
export async function bench(el, r) {
  return (await timed(el, r, 60, () => 4, () => {})).correct;
}
