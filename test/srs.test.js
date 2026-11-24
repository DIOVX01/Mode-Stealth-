import test from 'node:test';
import assert from 'node:assert/strict';
import { newCard, review, dueCards } from '../js/srs.js';
const T = '2026-11-25';
const fact = () => newCard({ type: 'fact', front: 'Q', back: 'A' }, T);

test('new card has SM-2 defaults and is due today', () => {
  const c = fact(); assert.deepEqual([c.ef, c.interval, c.reps, c.due], [2.5, 0, 0, T]); assert.ok(c.id);
});
test('good, good, good → 1, 6, 15 days', () => {
  let c = review(fact(), 'good', T); assert.equal(c.interval, 1); assert.equal(c.due, '2026-11-26');
  c = review(c, 'good', c.due); assert.equal(c.interval, 6);
  c = review(c, 'good', c.due); assert.equal(c.interval, 15);
});
test('again resets to 1 day and lowers ease by 0.32', () => {
  let c = review(review(fact(), 'good', T), 'good', T);
  c = review(c, 'again', T); assert.deepEqual([c.reps, c.interval, c.ef], [0, 1, 2.18]);
});
test('ease never drops below 1.3', () => {
  let c = fact(); for (let i = 0; i < 10; i++) c = review(c, 'again', T); assert.equal(c.ef, 1.3);
});
test('easy raises ease by 0.1', () => assert.equal(review(fact(), 'easy', T).ef, 2.6));
test('review does not mutate its input', () => { const c = fact(); review(c, 'good', T); assert.equal(c.reps, 0); });
test('dueCards: due or overdue, oldest first, capped at 100', () => {
  const cards = [...Array(150)].map(() => ({ ...fact(), due: '2026-11-20' }));
  cards.push({ ...fact(), due: '2026-11-01' }, { ...fact(), due: '2026-12-01' });
  const d = dueCards(cards, T); assert.equal(d.length, 100); assert.equal(d[0].due, '2026-11-01');
});
