// Route #/: today, streak, honest progress (benchmark Day 1 vs latest), drill levels, backup status.
import { h } from '../ui.js';
import { sparkline } from '../charts.js';
import { streak, backupDue, benchmarkDue, DRILLS } from '../session.js';
import { dueCards } from '../srs.js';
import { daysBetween } from '../day.js';
import { BENCH_TESTS } from './benchmark.js';

const fmt = (v, unit) => (unit === '%' ? v + '%' : v + ' ' + unit);
const NAMES = { math: 'Mental math', kim: 'Kim’s game', changed: 'What changed?', where: 'Where was it?', span: 'Digit span', cups: 'Cups tracking', palace: 'Memory palace' };

function startArea(ctx, today) {
  const rec = ctx.state.sessions.find(s => s.day === today);
  if (rec?.completed) return [h('p', { class: 'good big-line' }, 'Today’s session is done.'), h('p', { class: 'muted' }, 'Extra rounds are below, next to each drill.')];
  const label = rec?.done.length ? 'Resume today’s session' : 'Start today’s session';
  return [h('a', { class: 'button primary cta', href: '#/session' }, label)];
}

function benchTable(ctx, today) {
  const b = ctx.state.benchmarks;
  if (!b.length) return h('p', { class: 'muted' }, 'No benchmark yet. Your next session starts with one.');
  const first = b[0], last = b.at(-1);
  const next = benchmarkDue(ctx.state, today) ? 'Due in today’s session.' : 'Next one in ' + (7 - daysBetween(last.day, today)) + ' days.';
  return h('div',
    h('table', { class: 'data' },
      h('thead', h('tr', h('th', { scope: 'col' }, 'Test'), h('th', { scope: 'col' }, 'Day 1'), h('th', { scope: 'col' }, 'Latest'), h('th', { scope: 'col' }, 'Trend'))),
      h('tbody', BENCH_TESTS.map(t => h('tr',
        h('th', { scope: 'row' }, t.label),
        h('td', fmt(first.scores[t.id], t.unit)),
        h('td', fmt(last.scores[t.id], t.unit)),
        h('td', sparkline(b.map(x => x.scores[t.id]), { label: t.label + ' over ' + b.length + ' benchmarks' })))))),
    h('p', { class: 'muted small' }, b.length + ' benchmark' + (b.length === 1 ? '' : 's') + ' taken. ' + next));
}

function drillTable(ctx) {
  return h('table', { class: 'data' },
    h('thead', h('tr', h('th', { scope: 'col' }, 'Drill'), h('th', { scope: 'col' }, 'Level'), h('th', { scope: 'col' }, 'Last 7 sessions'), h('td'))),
    h('tbody', DRILLS.map(id => {
      const d = ctx.state.drills[id];
      const levels = (d?.history ?? []).slice(-7).map(e => +e.level.toFixed(2));
      return h('tr',
        h('th', { scope: 'row' }, NAMES[id]),
        h('td', d ? d.level.toFixed(1) : 'not started'),
        h('td', sparkline(levels, { label: NAMES[id] + ' level, last ' + levels.length + ' sessions' })),
        h('td', h('a', { href: '#/drill/' + id, 'aria-label': 'Extra round of ' + NAMES[id] }, 'Extra round')));
    })));
}

function extras(ctx) {
  const out = [];
  const reading = (ctx.state.drills.reading?.history ?? []).filter(e => e.wpm);
  if (reading.length) out.push(h('p', 'Reading speed: ' + reading.at(-1).wpm + ' words per minute ', sparkline(reading.slice(-10).map(e => e.wpm), { label: 'reading speed trend' })));
  const cue = ctx.state.drills.cue?.history ?? [];
  if (cue.length) out.push(h('p', 'Remember-to-do cue caught on ' + cue.filter(e => e.accuracy === 1).length + ' of ' + cue.length + ' days.'));
  return out;
}

export function render(el, ctx) {
  const today = ctx.today();
  const days = streak(ctx.state, today);
  const due = dueCards(ctx.state.cards, today).length;
  el.append(
    h('div', { class: 'hero' },
      h('div', h('div', { class: 'big' }, days), h('p', { class: 'muted' }, 'day streak')),
      h('div', h('div', { class: 'big' }, due === 100 ? '100+' : due), h('p', { class: 'muted' }, 'cards due')),
      h('div', { class: 'hero-action' }, startArea(ctx, today))),
    ...(backupDue(ctx.state, today) ? [h('p', { class: 'nag', role: 'status' }, 'No backup in 7 days or more. ', h('a', { href: '#/backup' }, 'Export a backup'))] : []),
    h('h2', 'Weekly benchmark'), benchTable(ctx, today),
    h('h2', 'Drill levels'), drillTable(ctx),
    ...extras(ctx),
    h('p', { class: 'muted small' }, 'Sleep and exercise improve memory more than any app.'));
}
