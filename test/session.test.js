import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSteps, markDone, recordDrill, streak, benchmarkDue, backupDue, DRILLS } from '../js/session.js';
import { defaultState } from '../js/store.js';
const T = '2026-11-25';
const st = (patch = {}) => ({ ...defaultState('2026-11-01'), ...patch });
const done = days => days.map(day => ({ day, plan: [], done: [], completed: true }));

test('fresh state: benchmark, cue, reviews, then drills in fixed order', () =>
  assert.deepEqual(buildSteps(st(), T), ['benchmark', 'cue', 'reviews', ...DRILLS]));
test('no benchmark when last one was under 7 days ago', () =>
  assert.equal(buildSteps(st({ benchmarks: [{ day: '2026-11-20', scores: {} }] }), T)[0], 'cue'));
test('benchmark due again at 7 days', () =>
  assert.equal(benchmarkDue(st({ benchmarks: [{ day: '2026-11-18', scores: {} }] }), T), true));
test('resume skips steps already done today', () => {
  let s = st(); for (const id of ['benchmark', 'cue', 'reviews', 'math']) s = markDone(s, id, T);
  assert.deepEqual(buildSteps(s, T), ['kim', 'changed', 'where', 'span', 'cups', 'palace']);
});
test('day completes when the last planned step is done', () => {
  let s = st(); for (const id of buildSteps(st(), T)) s = markDone(s, id, T);
  assert.equal(s.sessions.at(-1).completed, true); assert.deepEqual(buildSteps(s, T), []);
});
test('streak counts consecutive completed days ending today', () =>
  assert.equal(streak(st({ sessions: done(['2026-11-23', '2026-11-24', '2026-11-25']) }), T), 3));
test('streak still counts through yesterday when today is not done', () =>
  assert.equal(streak(st({ sessions: done(['2026-11-23', '2026-11-24']) }), T), 2));
test('streak is 0 after a missed day', () =>
  assert.equal(streak(st({ sessions: done(['2026-11-22', '2026-11-23']) }), T), 0));
test('recordDrill stores level and a history entry', () => {
  const s = recordDrill(st(), 'kim', { correct: 8, total: 10, ms: 1200, level: 3.4 }, T);
  assert.equal(s.drills.kim.level, 3.4);
  assert.deepEqual(s.drills.kim.history, [{ day: T, accuracy: 0.8, ms: 1200, level: 3.4 }]);
});
test('recordDrill keeps wpm when given', () =>
  assert.equal(recordDrill(st(), 'reading', { correct: 1, total: 1, ms: 0, level: 0, wpm: 240 }, T).drills.reading.history[0].wpm, 240));
test('backup due 7 days after install when never backed up', () => {
  assert.equal(backupDue(st({ createdAt: '2026-11-18' }), T), true);
  assert.equal(backupDue(st({ createdAt: '2026-11-20' }), T), false);
});
