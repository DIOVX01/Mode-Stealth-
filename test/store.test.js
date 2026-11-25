import test from 'node:test';
import assert from 'node:assert/strict';
import { KEY, defaultState, load, save, exportJson, parseImport } from '../js/store.js';
import { newCard } from '../js/srs.js';
const T = '2026-11-25';
const fake = (init = {}) => { const m = new Map(Object.entries(init));
  return { getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k),
    key: i => [...m.keys()][i] ?? null, get length() { return m.size; }, m }; };

test('load on empty storage returns default state', () => {
  const { state, error } = load(fake()); assert.equal(error, null); assert.equal(state.version, 1); assert.deepEqual(state.cards, []);
});
test('save then load round-trips', () => {
  const s = fake(); const st = defaultState(T); st.palace = ['door', 'sofa'];
  assert.equal(save(st, s).ok, true); assert.deepEqual(load(s).state, st);
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

test('save refuses when another tab changed the data since this tab read it', () => {
  const s = fake({ [KEY]: 'NEWER' });
  const r = save(defaultState(T), s, 'OLDER');
  assert.equal(r.ok, false); assert.equal(r.stale, true); assert.equal(s.m.get(KEY), 'NEWER');
});
test('save returns the raw text it wrote', () => {
  const s = fake(); const r = save(defaultState(T), s, null);
  assert.equal(r.ok, true); assert.equal(r.raw, s.m.get(KEY));
});
test('reloading unreadable data keeps one copy, not one per load', () => {
  const s = fake({ [KEY]: '{bad' }); const now = Date.now; let tick = 1000;
  Date.now = () => tick++;
  try { load(s); load(s); } finally { Date.now = now; }
  assert.equal([...s.m.keys()].filter(k => k.startsWith(KEY + ':corrupt-')).length, 1);
});
test('if the safety copy cannot be written, load reports read-only instead of throwing', () => {
  const s = fake({ [KEY]: '{bad' });
  s.setItem = () => { throw Object.assign(new Error('q'), { name: 'QuotaExceededError' }); };
  const r = load(s); assert.ok(r.error); assert.equal(r.readOnly, true);
});
for (const [name, patch] of [
  ['a session without a plan', st => { st.sessions = [{ day: T }]; }],
  ['a drill without history', st => { st.drills = { math: {} }; }],
  ['a benchmark without scores', st => { st.benchmarks = [{ day: T }]; }],
  ['a missing createdAt', st => { delete st.createdAt; }],
  ['a card whose front is not text', st => { st.cards = [{ ...newCard({ type: 'fact', front: 'q', back: 'a' }, T), front: 5 }]; }],
  ['a photo that is a web address', st => { st.cards = [newCard({ type: 'person', front: 'q', back: 'a', photo: 'http://example.com/x.jpg' }, T)]; }],
  ['a palace spot that is not text', st => { st.palace = [1]; }],
]) test('parseImport rejects ' + name, () => { const st = defaultState(T); patch(st); assert.equal(parseImport(JSON.stringify(st)).ok, false); });
test('parseImport accepts a lived-in state', () => {
  const st = defaultState(T);
  st.palace = ['door']; st.lastBackupAt = T;
  st.cards = [newCard({ type: 'person', front: 'gym', back: 'Priya', photo: 'data:image/jpeg;base64,AAAA' }, T)];
  st.sessions = [{ day: T, plan: ['cue'], done: [], completed: false }];
  st.drills = { math: { level: 2.15, history: [{ day: T, accuracy: 0.8, ms: 900, level: 2.15 }] }, reading: { level: 0, history: [{ day: T, accuracy: 1, ms: 0, level: 0, wpm: 240 }] } };
  st.benchmarks = [{ day: T, scores: { span: 6, math: 12 } }];
  assert.equal(parseImport(JSON.stringify(st)).ok, true);
});
