import test from 'node:test';
import assert from 'node:assert/strict';
import { starterCards } from '../js/data/psych.js';
test('30 psych cards with non-empty, unique answers', () => {
  const c = starterCards('2026-11-25');
  assert.equal(c.length, 30); assert.ok(c.every(x => x.type === 'psych' && x.front && x.back));
  assert.equal(new Set(c.map(x => x.back)).size, 30);
});
