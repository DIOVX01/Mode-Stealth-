// All user data is one JSON document in localStorage. Storage is always passed in.
// State = {version: 1, createdAt, palace: string[], cards: Card[],
//          drills: {[id]: {level, history: {day, accuracy, ms, level, wpm?}[]}},
//          sessions: {day, plan: string[], done: string[], completed: boolean}[],
//          benchmarks: {day, scores: {[testId]: number}}[], lastBackupAt: string|null}
import { CARD_TYPES } from './srs.js';
import { dayKey } from './day.js';

export const KEY = 'hivemind:v1';

export const defaultState = today => ({
  version: 1, createdAt: today, palace: [], cards: [], drills: {},
  sessions: [], benchmarks: [], lastBackupAt: null,
});

const isObj = v => v !== null && typeof v === 'object' && !Array.isArray(v);

export function validate(obj) {
  if (!isObj(obj)) return 'Not a HiveMind data object.';
  if (obj.version !== 1) return `Unsupported data version: ${obj.version}.`;
  for (const k of ['cards', 'sessions', 'benchmarks', 'palace'])
    if (!Array.isArray(obj[k])) return `Missing or invalid "${k}" list.`;
  if (!isObj(obj.drills)) return 'Missing or invalid "drills" section.';
  for (const c of obj.cards) {
    if (!isObj(c) || typeof c.id !== 'string' || !CARD_TYPES.includes(c.type)
      || typeof c.ef !== 'number' || typeof c.interval !== 'number' || typeof c.reps !== 'number'
      || typeof c.due !== 'string') return 'A card in the data is malformed.';
  }
  return null;
}

export function load(storage) {
  const raw = storage.getItem(KEY);
  const fresh = () => defaultState(dayKey());
  if (raw === null) return { state: fresh(), error: null };
  let parsed, error;
  try { parsed = JSON.parse(raw); error = validate(parsed); }
  catch { error = 'Saved data is not valid JSON.'; }
  if (!error) return { state: parsed, error: null };
  // Never overwrite unreadable data: keep the raw text under a separate key.
  storage.setItem(`${KEY}:corrupt-${Date.now()}`, raw);
  return { state: fresh(), error };
}

export function save(state, storage) {
  try { storage.setItem(KEY, JSON.stringify(state)); return { ok: true }; }
  catch (e) {
    return { ok: false, error: e?.name === 'QuotaExceededError'
      ? 'Browser storage is full — nothing was saved. Remove some photos or export a backup.'
      : `Could not save: ${e?.message ?? e}` };
  }
}

export const exportJson = state => JSON.stringify(state, null, 1);

export function parseImport(text) {
  let obj;
  try { obj = JSON.parse(text); } catch { return { ok: false, error: 'That file is not a HiveMind backup (not JSON).' }; }
  const error = validate(obj);
  return error ? { ok: false, error } : { ok: true, state: obj };
}
