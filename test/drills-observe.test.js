import test from 'node:test';
import assert from 'node:assert/strict';
import * as kim from '../js/drills/kim.js';
import * as changed from '../js/drills/changed.js';
import * as where from '../js/drills/where.js';
import { rng } from '../js/rng.js';

test('kim tier 1 shows 4 items for 10 s, never under 4 s', () => {
  assert.deepEqual(kim.params(1), { items: 4, showMs: 10000 }); assert.equal(kim.params(kim.maxLevel).showMs, 4000);
});
test('kim score counts hits and false picks', () =>
  assert.deepEqual(kim.score(new Set([1, 2, 3]), new Set([1, 2, 9])), { hits: 2, falsePicks: 1, correct: false }));
for (const kind of ['add', 'remove', 'move', 'swap']) test(`changed: ${kind} alters the named cell`, () => {
  const scene = Array(36).fill(null); for (let i = 0; i < 10; i++) scene[i * 3] = { glyph: String(i) };
  const { scene2, cell } = changed.makeChange(scene, kind, rng(5));
  assert.ok(cell >= 0 && cell < 36); assert.notDeepEqual(scene2[cell], scene[cell]);
});
test('where scorePlacement counts exact cells', () => {
  const truth = new Map([['🔑', 3], ['📱', 7]]);
  assert.deepEqual(where.scorePlacement(truth, new Map([['🔑', 3], ['📱', 8]])), { right: 1, total: 2 });
});
