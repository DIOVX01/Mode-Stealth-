import test from 'node:test';
import assert from 'node:assert/strict';
import { KEY, defaultState, load, save, exportJson, parseImport } from '../js/store.js';
import { newCard } from '../js/srs.js';
const T = '2026-11-25';
const fake = (init = {}) => { const m = new Map(Object.entries(init));
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), m }; };

test('load on empty storage returns default state', () => {
  const { state, error } = load(fake()); assert.equal(error, null); assert.equal(state.version, 1); assert.deepEqual(state.cards, []);
});
test('save then load round-trips', () => {
  const s = fake(); const st = defaultState(T); st.palace = ['door', 'sofa'];
  assert.deepEqual(save(st, s), { ok: true }); assert.deepEqual(load(s).state, st);
});
test('corrupt saved data is preserved under a backup key and reported', () => {
  const s = fake({ [KEY]: '{not json' }); const { state, error } = load(s);
  assert.ok(error); assert.deepEqual(state.cards, []);
  const keys = [...s.m.keys()].filter(k => k.startsWith(`${KEY}:corrupt-`));
  assert.equal(keys.length, 1); assert.equal(s.m.get(keys[0]), '{not json');
});
test('valid JSON with wrong shape is treated as corrupt', () => assert.ok(load(fake({ [KEY]: '{"version":1}' })).error));
test('save reports quota failure and keeps previous saved value', () => {
  const s = fake({ [KEY]: 'OLD' });
  s.setItem = () => { throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' }); };
  const r = save(defaultState(T), s); assert.equal(r.ok, false); assert.match(r.error, /full/i); assert.equal(s.m.get(KEY), 'OLD');
});
test('parseImport rejects non-JSON', () => assert.equal(parseImport('hello').ok, false));
test('parseImport rejects other versions', () => {
  const r = parseImport(JSON.stringify({ ...defaultState(T), version: 2 })); assert.equal(r.ok, false); assert.match(r.error, /version/i);
});
test('parseImport rejects missing cards array', () => {
  const { cards, ...rest } = defaultState(T); assert.equal(parseImport(JSON.stringify(rest)).ok, false);
});
test('parseImport rejects a card with a bad type', () => {
  const st = defaultState(T); st.cards.push({ ...newCard({ type: 'fact', front: 'q', back: 'a' }, T), type: 'nope' });
  assert.equal(parseImport(JSON.stringify(st)).ok, false);
});
test('parseImport accepts an exported state', () => {
  const st = defaultState(T); st.cards.push(newCard({ type: 'fact', front: 'q', back: 'a' }, T));
  const r = parseImport(exportJson(st)); assert.equal(r.ok, true); assert.deepEqual(r.state, st);
});
