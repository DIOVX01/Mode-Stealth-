// Route #/drill/<id>: one adaptive run of a single drill (also used for extra rounds).
import { h } from '../ui.js';
import { rng } from '../rng.js';
import { recordDrill, DRILLS } from '../session.js';

export async function render(el, ctx) {
  const id = ctx.params.arg;
  if (!DRILLS.includes(id)) { el.append(h('p', `No drill called “${id}”.`)); return; }
  const mod = await import(`../drills/${id}.js`);
  const stage = h('div', { class: 'stage' });
  el.append(h('h1', mod.name), stage);
  const level = ctx.state.drills[id]?.level ?? 1;
  let res;
  try {
    res = await mod.run(stage, { level, r: rng(Date.now() >>> 0), palace: ctx.state.palace });
  } catch (e) {
    if (e.message === 'NO_PALACE') return ctx.go(`#/palace?return=${encodeURIComponent(`#/drill/${id}`)}`);
    throw e;
  }
  if (!el.isConnected) return;
  if (!ctx.commit(recordDrill(ctx.state, id, res, ctx.today()))) return;
  stage.replaceChildren(
    h('div', { class: 'big' }, `${res.correct} / ${res.total}`),
    h('p', `Level ${level.toFixed(2)} to ${res.level.toFixed(2)}`),
    h('div', { class: 'row' },
      h('a', { class: 'button primary', href: `#/drill/${id}?again=${Date.now()}` }, 'Another round'),
      h('a', { class: 'button', href: '#/' }, 'Dashboard')));
}
