// Route #/welcome: first run. Intro, starter deck, palace setup, then the Day 1 baseline benchmark.
import { h } from '../ui.js';
import { starterCards } from '../data/psych.js';
import { runBenchmark } from './benchmark.js';

export async function render(el, ctx) {
  if (ctx.params.query.get('step') === 'benchmark') {
    const stage = h('div', { class: 'stage' });
    el.append(h('h1', 'Day 1 baseline'), h('p', 'Every later benchmark is compared with these scores.'), stage);
    if (await runBenchmark(stage, ctx) && el.isConnected) ctx.go('#/');
    return;
  }
  const start = h('button', {
    type: 'button', class: 'primary cta',
    onclick: () => {
      const s = ctx.state;
      const cards = s.cards.some(c => c.type === 'psych') ? s.cards : [...s.cards, ...starterCards(ctx.today())];
      if (!ctx.commit({ ...s, cards })) return;
      navigator.storage?.persist?.();
      ctx.go('#/palace?return=' + encodeURIComponent('#/welcome?step=benchmark'));
    },
  }, 'Set up');
  el.append(
    h('h1', 'Train your memory, every day'),
    h('p', 'A fixed daily session for memory, observation and mental speed. About 45 minutes. No skipping.'),
    h('p', { class: 'muted' }, 'Honest note: you get better at what you practise. The weekly benchmark measures it, so the progress you see is real.'),
    h('div', { class: 'row start' }, start),
    h('p', { class: 'muted small' }, 'Moving from another browser? ', h('a', { href: '#/backup' }, 'Import a backup')));
  start.focus();
}
