// Spaced-retrieval review of the user's own cards. Commits after every card so nothing is lost mid-session.
import { h, askText, askChoice, wait } from '../ui.js';
import { review, dueCards } from '../srs.js';
import { recordDrill } from '../session.js';

const GRADES = ['again', 'hard', 'good', 'easy'];
const GRADE_LABELS = ['1 Again', '2 Hard', '3 Good', '4 Easy'];
const PROMPT = { person: 'Who is this?', fact: 'Recall the answer', psych: 'Which effect is this?' };

async function grade(box) {
  return GRADES[await askChoice(box, 'How well did you recall it?', GRADE_LABELS)];
}

async function flash(el, card, i, n) {
  const front = [
    h('p', { class: 'muted' }, 'Card ' + (i + 1) + ' of ' + n),
    card.photo ? h('img', { src: card.photo, alt: 'Photo of the person', width: 96, height: 96, class: 'face' }) : null,
    h('p', { class: 'card-front' }, card.front),
    h('p', { class: 'muted' }, PROMPT[card.type]),
  ];
  await new Promise(resolve => {
    const btn = h('button', { type: 'button', class: 'primary', onclick: resolve }, 'Show answer');
    el.replaceChildren(...front.filter(Boolean), btn);
    btn.focus();
  });
  const box = h('div');
  el.replaceChildren(...front.filter(Boolean), h('p', { class: 'card-back' }, card.back), box);
  return grade(box);
}

async function reading(el, card) {
  const words = card.back.split(/\s+/).filter(Boolean).length;
  const t0 = Date.now();
  await new Promise(resolve => {
    const btn = h('button', { type: 'button', class: 'primary', onclick: resolve }, 'Done reading');
    el.replaceChildren(h('h2', card.front), h('div', { class: 'reading' }, card.back), btn);
    btn.focus();
  });
  const ms = Date.now() - t0;
  const wpm = Math.round(words / (ms / 60000));
  const recall = await askText(el, 'Type everything you remember from “' + card.front + '”. Ctrl+Enter submits.', { multiline: true });
  const box = h('div');
  el.replaceChildren(
    h('p', { class: 'muted' }, 'Read at ' + wpm + ' words per minute. Compare your recall with the original.'),
    h('div', { class: 'compare' },
      h('div', h('h2', 'Your recall'), h('div', { class: 'reading' }, recall || '(nothing)')),
      h('div', h('h2', 'Original'), h('div', { class: 'reading' }, card.back))),
    box);
  return { grade: await grade(box), wpm, ms };
}

export async function runReviews(el, ctx) {
  const due = dueCards(ctx.state.cards, ctx.today());
  if (!due.length) { el.replaceChildren(h('p', 'No cards due today.')); await wait(1200); return; }
  for (let i = 0; i < due.length; i++) {
    const card = due[i];
    let next = ctx.state;
    let g;
    if (card.type === 'reading') {
      const res = await reading(el, card);
      g = res.grade;
      // Over 1000 wpm means the text was not really read (an accidental click); keep the grade, skip the speed.
      const wpm = res.wpm <= 1000 ? res.wpm : undefined;
      next = recordDrill(next, 'reading', { correct: g === 'again' ? 0 : 1, total: 1, ms: res.ms, level: 0, wpm }, ctx.today());
    } else {
      g = await flash(el, card, i, due.length);
    }
    if (!el.isConnected) return;
    const updated = review(card, g, ctx.today());
    ctx.commit({ ...next, cards: next.cards.map(c => (c.id === card.id ? updated : c)) });
  }
  el.replaceChildren(h('p', 'All ' + due.length + ' due cards reviewed.'));
  await wait(1200);
}
