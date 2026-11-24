// SM-2 spaced repetition (Wozniak 1990).
// shortcut: SM-2 rather than FSRS, upgrade if daily review load feels wrong.
import { addDays } from './day.js';

const QUALITY = { again: 2, hard: 3, good: 4, easy: 5 };
export const CARD_TYPES = ['person', 'fact', 'reading', 'psych'];

export function newCard({ type, front, back, photo = null }, today) {
  return { id: crypto.randomUUID(), type, front, back, photo, ef: 2.5, interval: 0, reps: 0, due: today };
}

export function review(card, grade, today) {
  const q = QUALITY[grade];
  const d = 5 - q;
  const ef = Math.max(1.3, Math.round((card.ef + 0.1 - d * (0.08 + d * 0.02)) * 100) / 100);
  let { reps, interval } = card;
  if (q < 3) { reps = 0; interval = 1; }
  else {
    interval = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * card.ef);
    reps += 1;
  }
  return { ...card, ef, reps, interval, due: addDays(today, interval) };
}

export const dueCards = (cards, today, cap = 100) =>
  cards.filter(c => c.due <= today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, cap);
