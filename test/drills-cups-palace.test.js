import test from 'node:test';
import assert from 'node:assert/strict';
import * as cups from '../js/drills/cups.js';
import * as palace from '../js/drills/palace.js';

test('moveBall stays inside the box', () => {
  let b = { x: 5, y: 5, vx: -300, vy: -300 };
  for (let i = 0; i < 100; i++) { b = cups.moveBall(b, 0.05, 200, 100, 10);
    assert.ok(b.x >= 10 && b.x <= 190 && b.y >= 10 && b.y <= 90); }
});
test('scoreTracking needs exactly the targets', () => {
  assert.equal(cups.scoreTracking(new Set([1, 2]), new Set([2, 1])), true);
  assert.equal(cups.scoreTracking(new Set([1, 2]), new Set([1, 3])), false);
});
test('palace words are capped by loci count', () => assert.equal(palace.params(10, 12).words, 12));
test('scoreRecall is position-wise, trimmed, case-insensitive', () =>
  assert.equal(palace.scoreRecall(['apple', 'lamp', 'rope'], [' Apple ', 'rope', 'ROPE']), 2));
test('scoreFreeRecall counts distinct correct words in any order', () =>
  assert.equal(palace.scoreFreeRecall(['apple', 'lamp', 'rope'], 'rope, APPLE apple banana'), 2));
