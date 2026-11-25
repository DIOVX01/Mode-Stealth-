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
const isStr = v => typeof v === 'string';
const isNum = v => typeof v === 'number' && Number.isFinite(v);
const isDay = v => isStr(v) && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isPhoto = v => v === null || (isStr(v) && v.startsWith('data:image/'));
const keys = storage => Array.from({ length: storage.length }, (_, i) => storage.key(i));

// Trust boundary: imported files and whatever is in storage. Check every entry the app reads.
export function validate(obj) {
  if (!isObj(obj)) return 'Not a HiveMind data object.';
  if (obj.version !== 1) return `Unsupported data version: ${obj.version}.`;
  for (const k of ['cards', 'sessions', 'benchmarks', 'palace'])
    if (!Array.isArray(obj[k])) return `Missing or invalid "${k}" list.`;
  if (!isObj(obj.drills)) return 'Missing or invalid "drills" section.';
  if (!isDay(obj.createdAt)) return 'Missing or invalid install date.';
  if (obj.lastBackupAt !== null && !isDay(obj.lastBackupAt)) return 'Invalid last-backup date.';
  if (!obj.palace.every(isStr)) return 'A memory-palace spot is not text.';
  for (const c of obj.cards) {
    if (!isObj(c) || !isStr(c.id) || !CARD_TYPES.includes(c.type) || !isStr(c.front) || !isStr(c.back)
      || !isNum(c.ef) || !isNum(c.interval) || !isNum(c.reps) || !isDay(c.due) || !isPhoto(c.photo)) return 'A card in the data is malformed.';
  }
  for (const x of obj.sessions)
    if (!isObj(x) || !isDay(x.day) || !Array.isArray(x.plan) || !Array.isArray(x.done) || typeof x.completed !== 'boolean') return 'A session record is malformed.';
  for (const d of Object.values(obj.drills))
    if (!isObj(d) || !isNum(d.level) || !Array.isArray(d.history)
      || !d.history.every(e => isObj(e) && isDay(e.day) && isNum(e.accuracy) && isNum(e.ms) && isNum(e.level))) return 'A drill record is malformed.';
  for (const b of obj.benchmarks)
    if (!isObj(b) || !isDay(b.day) || !isObj(b.scores) || !Object.values(b.scores).every(isNum)) return 'A benchmark record is malformed.';
  return null;
}

export function load(storage) {
  const raw = storage.getItem(KEY);
  const fresh = () => defaultState(dayKey());
  if (raw === null) return { state: fresh(), error: null, raw: null };
  let parsed, error;
  try { parsed = JSON.parse(raw); error = validate(parsed); }
  catch { error = 'Saved data is not valid JSON.'; }
  if (!error) return { state: parsed, error: null, raw };
  // Never overwrite unreadable data: keep one copy of the raw text under a separate key.
  const copied = keys(storage).some(k => k.startsWith(KEY + ':corrupt-') && storage.getItem(k) === raw);
  if (!copied) {
    try { storage.setItem(`${KEY}:corrupt-${Date.now()}`, raw); }
    catch { return { state: fresh(), error, raw, readOnly: true }; } // no copy possible: the original must not be overwritten
  }
  return { state: fresh(), error, raw };
}

// expectedRaw: what this tab last read or wrote. If storage now holds something else, another tab saved newer data.
export function save(state, storage, expectedRaw) {
  if (expectedRaw !== undefined && storage.getItem(KEY) !== expectedRaw)
    return { ok: false, stale: true, error: 'HiveMind was changed in another tab.' };
  const raw = JSON.stringify(state);
  try { storage.setItem(KEY, raw); return { ok: true, raw }; }
  catch (e) {
    return { ok: false, error: e?.name === 'QuotaExceededError'
      ? 'Browser storage is full, so nothing was saved. Remove some photos or export a backup.'
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
