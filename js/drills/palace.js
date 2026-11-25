// Memory palace (method of loci): place each word on a spot along your own route, then walk it back.
import { h, askText, feedback, wait } from '../ui.js';
import { step, tier } from '../staircase.js';
import { pick } from '../rng.js';
import { WORDS } from '../data/words.js';

export const id = 'palace';
export const name = 'Memory palace';
export const maxLevel = 10;

export const params = (t, lociCount) => ({ words: Math.min(5 + 2 * t, lociCount) });

const norm = s => s.trim().toLowerCase();
export const scoreRecall = (words, answers) => words.filter((w, i) => norm(answers[i] ?? '') === w).length;

export function scoreFreeRecall(words, typed) {
  const tokens = new Set(typed.toLowerCase().split(/[^a-z]+/).filter(Boolean));
  return words.filter(w => tokens.has(w)).length;
}

function recallForm(el, palace, n) {
  return new Promise(resolve => {
    const inputs = palace.slice(0, n).map((locus, i) => h('input', { id: 'locus-' + i, autocomplete: 'off', spellcheck: 'false' }));
    const form = h('form', { class: 'loci', onsubmit: e => { e.preventDefault(); resolve(inputs.map(x => x.value)); } },
      h('p', 'Walk your route. What was at each spot?'),
      palace.slice(0, n).map((locus, i) => h('div', { class: 'locus' }, h('label', { for: 'locus-' + i }, (i + 1) + '. ' + locus), inputs[i])),
      h('div', { class: 'row' }, h('button', { class: 'primary' }, 'Check')));
    el.replaceChildren(form);
    inputs[0].focus();
  });
}

export async function run(el, { level, r, palace }) {
  if (!palace || palace.length < 10) throw new Error('NO_PALACE');
  const n = params(tier(level), palace.length).words;
  const words = pick(r, WORDS, n);
  el.replaceChildren(h('p', 'Picture each word at its spot. Make the image big, odd and vivid.'));
  await wait(2500);
  for (let i = 0; i < n; i++) {
    el.replaceChildren(h('p', { class: 'muted' }, (i + 1) + ' of ' + n + ': ' + palace[i]), h('div', { class: 'big' }, words[i]));
    await wait(4000);
  }
  const t0 = Date.now();
  const answers = await recallForm(el, palace, n);
  let lv = level, correct = 0;
  words.forEach((w, i) => { const ok = norm(answers[i] ?? '') === w; if (ok) correct++; lv = step(lv, ok, maxLevel); });
  const misses = words.map((w, i) => (norm(answers[i] ?? '') === w ? null : palace[i] + ': ' + w)).filter(Boolean);
  await feedback(el, correct === n, correct + ' of ' + n + ' correct.' + (misses.length ? ' Missed ' + misses.join(', ') + '.' : ''), 1500);
  return { correct, total: n, ms: Math.round((Date.now() - t0) / n), level: lv };
}

// Benchmark part 1: show 20 words, 3 s each. Recall comes later (at least 2 minutes after).
export async function benchShow(el, r) {
  const words = pick(r, WORDS, 20);
  el.replaceChildren(h('p', 'Remember as many of these 20 words as you can. You will be asked for them later.'));
  await wait(3000);
  for (const w of words) { el.replaceChildren(h('div', { class: 'big' }, w)); await wait(3000); }
  return { words, shownAt: Date.now() };
}

export async function benchRecall(el, words) {
  const typed = await askText(el, 'Type every word you remember from the earlier list, in any order', { multiline: true });
  return scoreFreeRecall(words, typed);
}
