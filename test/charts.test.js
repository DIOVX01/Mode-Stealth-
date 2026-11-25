import test from 'node:test';
import assert from 'node:assert/strict';
import { sparkPoints } from '../js/charts.js';
test('empty series gives no points', () => assert.equal(sparkPoints([], 80, 20), ''));
test('flat series sits on the middle line', () =>
  assert.ok(sparkPoints([5, 5, 5], 80, 20).split(' ').every(p => p.split(',')[1] === '10')));
test('one point per value; rising values go up', () => {
  const pts = sparkPoints([1, 2, 3], 80, 20).split(' ').map(p => p.split(',').map(Number));
  assert.equal(pts.length, 3); assert.ok(pts[0][1] > pts[2][1]);
});
