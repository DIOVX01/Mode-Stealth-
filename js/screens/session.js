// Route #/session: today's fixed sequence. Pause between steps; no skipping or reordering.
import { h, wait } from '../ui.js';
import { rng } from '../rng.js';
import { buildSteps, startDay, markDone, recordDrill, cueTarget, DRILLS } from '../session.js';
import { armCue } from '../cue.js';
import { runReviews } from './reviews.js';
import { runBenchmark } from './benchmark.js';

const FIXED = { benchmark: 'Weekly benchmark', cue: 'Remember to do it', reviews: 'Reviews' };
const drill = id => import('../drills/' + id + '.js');
const label = async id => FIXED[id] ?? (await drill(id)).name;

function between(el, ctx, nextName) {
  return new Promise(resolve => {
    const go = h('button', { type: 'button', class: 'primary', onclick: resolve }, 'Continue');
    el.replaceChildren(
      h('p', 'Next: ' + nextName),
      h('div', { class: 'row' }, go, h('button', { type: 'button', onclick: () => ctx.go('#/') }, 'Quit for today')),
      h('p', { class: 'muted small' }, 'Take a breath. The session waits here until you continue.'));
    go.focus();
  });
}

async function summary(el, ctx, today) {
  const rows = [];
  for (const id of DRILLS) {
    const e = ctx.state.drills[id]?.history.filter(x => x.day === today).at(-1);
    if (e) rows.push([await label(id), e]);
  }
  el.replaceChildren(
    h('div', { class: 'big good' }, 'Session complete'),
    h('dl', { class: 'scores' }, rows.map(([id, e]) => [h('dt', id), h('dd', Math.round(e.accuracy * 100) + '% correct, level ' + e.level.toFixed(1))])),
    h('a', { class: 'button primary', href: '#/' }, 'Dashboard'));
}

export async function render(el, ctx) {
  const today = ctx.today();
  const steps = buildSteps(ctx.state, today);
  const title = h('h1', 'Today’s session');
  const progress = h('p', { class: 'muted' });
  const stage = h('div', { class: 'stage' });
  el.append(h('div', { class: 'session-head' }, title, progress), stage);
  if (!steps.length) {
    stage.append(h('p', 'Today’s session is already complete.'), h('a', { class: 'button primary', href: '#/' }, 'Dashboard'));
    return;
  }
  ctx.commit(startDay(ctx.state, today));
  const plan = ctx.state.sessions.find(s => s.day === today)?.plan ?? steps;
  const r = rng(Date.now() >>> 0);
  let cue = null;
  let armed = null;
  addEventListener('hashchange', () => armed?.disarm(), { once: true });

  for (let k = 0; k < steps.length; k++) {
    const id = steps[k];
    const name = await label(id);
    if (k > 0) await between(stage, ctx, name);
    if (!el.isConnected) return;
    title.textContent = name;
    progress.textContent = 'Step ' + (plan.indexOf(id) + 1) + ' of ' + plan.length;

    if (id === 'benchmark') await runBenchmark(stage, ctx);
    else if (id === 'reviews') await runReviews(stage, ctx);
    else if (id === 'cue') {
      cue = { target: cueTarget(plan, r), delayMs: 5000 + Math.floor(r() * 55000) };
      await new Promise(resolve => {
        const ok = h('button', { type: 'button', class: 'primary', onclick: resolve }, 'Got it');
        stage.replaceChildren(h('div', { class: 'big' }, '🟣'),
          h('p', 'When you see a purple circle at any point in today’s session, click it. There will be no reminder.'), ok);
        ok.focus();
      });
    } else {
      const mod = await drill(id);
      armed = cue?.target === id ? armCue(document.body, { delayMs: cue.delayMs }) : null;
      let res;
      try {
        res = await mod.run(stage, { level: ctx.state.drills[id]?.level ?? 1, r, palace: ctx.state.palace });
      } catch (e) {
        armed?.disarm();
        if (e.message === 'NO_PALACE') return ctx.go('#/palace?return=' + encodeURIComponent('#/session'));
        throw e;
      }
      if (!el.isConnected) return;
      let next = recordDrill(ctx.state, id, res, today);
      if (armed) {
        armed.disarm();
        const hit = await armed.result;
        if (hit !== null) next = recordDrill(next, 'cue', { correct: hit ? 1 : 0, total: 1, ms: 0, level: 0 }, today);
        armed = null;
      }
      ctx.commit(next);
    }
    if (!el.isConnected) return;
    ctx.commit(markDone(ctx.state, id, today));
  }
  title.textContent = 'Today’s session';
  progress.textContent = '';
  await summary(stage, ctx, today);
}
