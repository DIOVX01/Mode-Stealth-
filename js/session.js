// Pure session bookkeeping: which steps today, resume, streak, what's due.
import { addDays, daysBetween } from './day.js';

export const DRILLS = ['math', 'kim', 'changed', 'where', 'span', 'cups', 'palace'];

export function benchmarkDue(state, today) {
  const last = state.benchmarks.at(-1);
  return !last || daysBetween(last.day, today) >= 7;
}

const todayRecord = (state, today) => state.sessions.find(s => s.day === today);
// A benchmark saved today counts as done even if the app closed before the step was marked.
const doneIds = (state, done, today) => new Set([...done, ...(state.benchmarks.at(-1)?.day === today ? ['benchmark'] : [])]);

export function buildSteps(state, today) {
  const rec = todayRecord(state, today);
  if (rec) { const done = doneIds(state, rec.done, today); return rec.completed ? [] : rec.plan.filter(id => !done.has(id)); }
  return [...(benchmarkDue(state, today) ? ['benchmark'] : []), 'cue', 'reviews', ...DRILLS];
}

// Fix today's plan when the session starts: the benchmark saves its scores before it is marked done,
// and a plan computed after that would no longer include it.
export function startDay(state, today) {
  if (todayRecord(state, today)) return state;
  return { ...state, sessions: [...state.sessions, { day: today, plan: buildSteps(state, today), done: [], completed: false }] };
}

export function markDone(state, stepId, today) {
  const rec = todayRecord(startDay(state, today), today);
  const done = rec.done.includes(stepId) ? rec.done : [...rec.done, stepId];
  const all = doneIds(state, done, today);
  const next = { ...rec, done, completed: rec.plan.every(id => all.has(id)) };
  return { ...state, sessions: [...state.sessions.filter(s => s.day !== today), next] };
}

export function recordDrill(state, id, { correct, total, ms, level, wpm }, today) {
  const entry = { day: today, accuracy: total ? correct / total : 0, ms, level, ...(wpm !== undefined && { wpm }) };
  const prev = state.drills[id] ?? { level: 1, history: [] };
  return { ...state, drills: { ...state.drills, [id]: { level, history: [...prev.history, entry] } } };
}

export function streak(state, today) {
  const completed = new Set(state.sessions.filter(s => s.completed).map(s => s.day));
  let day = completed.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (completed.has(day)) { n++; day = addDays(day, -1); }
  return n;
}

export const backupDue = (state, today) => daysBetween(state.lastBackupAt ?? state.createdAt, today) >= 7;

// The remember-to-do cue fires inside a drill at least two steps after it was set.
export function cueTarget(plan, r) {
  const later = plan.slice(plan.indexOf('cue') + 2).filter(id => DRILLS.includes(id));
  return later.length ? later[Math.floor(r() * later.length)] : null;
}
