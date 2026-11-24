import test from 'node:test';
import assert from 'node:assert/strict';
import * as math from '../js/drills/math.js';
import * as span from '../js/drills/span.js';
import { rng } from '../js/rng.js';
const calc = t => { const [a, op, b] = t.split(' '); return { '+': +a + +b, '-': a - b, '×': a * b, '÷': a / b }[op]; };

test('math answers are correct non-negative integers at every tier', () => {
  const r = rng(3);
  for (let t = 1; t <= math.maxLevel; t++) for (let i = 0; i < 200; i++) {
    const p = math.problem(t, r); assert.equal(calc(p.text), p.answer); assert.ok(Number.isInteger(p.answer) && p.answer >= 0);
  }
});
test('math tier 1 uses only + and -', () => assert.deepEqual(math.params(1).ops, ['+', '-']));
test('span digits = tier + 3', () => assert.equal(span.params(1).digits, 4));
test('span forward answer ignores spaces and commas', () => assert.equal(span.checkAnswer([3, 8, 1], '3, 8 1', false), true));
test('span backward expects reversed order', () => {
  assert.equal(span.checkAnswer([3, 8, 1], '183', true), true); assert.equal(span.checkAnswer([3, 8, 1], '381', true), false);
});
