import test from 'node:test';
import assert from 'node:assert/strict';
import { step, tier } from '../js/staircase.js';
import { rng, pick, shuffle } from '../js/rng.js';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≉ ${b}`);

test('correct raises level by 0.15', () => near(step(2, true, 10), 2.15));
test('wrong lowers level by 0.85', () => near(step(3, false, 10), 2.15));
test('clamps to [1, maxLevel]', () => { near(step(1.2, false, 10), 1); near(step(9.9, true, 10), 10); });
test('85% accuracy is the equilibrium', () => {
  let l = 5;
  for (let i = 0; i < 17; i++) l = step(l, true, 20);
  for (let i = 0; i < 3; i++) l = step(l, false, 20);
  near(l, 5);
});
test('tier floors the level', () => assert.equal(tier(3.99), 3));
test('rng is deterministic per seed', () => assert.equal(rng(42)(), rng(42)()));
test('pick returns n distinct items', () => assert.equal(new Set(pick(rng(1), [1,2,3,4,5], 3)).size, 3));
test('shuffle keeps all items and does not mutate', () => {
  const a = [1,2,3,4]; const s = shuffle(rng(7), a);
  assert.deepEqual([...s].sort(), [1,2,3,4]); assert.deepEqual(a, [1,2,3,4]);
});
