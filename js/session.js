// Pure session bookkeeping: which steps today, resume, streak, what's due.
import { addDays, daysBetween } from './day.js';

export const DRILLS = ['math', 'kim', 'changed', 'where', 'span', 'cups', 'palace'];

export function benchmarkDue(state, today) {
  const last = state.benchmarks.at(-1);
  return !last || daysBetween(last.day, today) >= 7;
}

const todayRecord = (state, today) => state.sessions.find(s => s.day === today);

export function buildSteps(state, today) {
  const rec = todayRecord(state, today);
  if (rec) return rec.completed ? [] : rec.plan.filter(id => !rec.done.includes(id));
  return [...(benchmarkDue(state, today) ? ['benchmark'] : []), 'cue', 'reviews', ...DRILLS];
}

export function markDone(state, stepId, today) {
  const rec = todayRecord(state, today) ?? { day: today, plan: buildSteps(state, today), done: [], completed: false };
  const done = rec.done.includes(stepId) ? rec.done : [...rec.done, stepId];
  const next = { ...rec, done, completed: rec.plan.every(id => done.includes(id)) };
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
