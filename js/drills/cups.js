// Cups tracking (multiple-object tracking): follow the marked cups while all of them move.
import { h, feedback, wait } from '../ui.js';
import { step, tier } from '../staircase.js';
import { pick } from '../rng.js';

export const id = 'cups';
export const name = 'Cups tracking';
export const maxLevel = 10;
const R = 24; // cup radius in px

export const params = t => ({ cups: 4 + t, targets: Math.min(5, 1 + Math.ceil(t / 2)), speed: 80 + 20 * t, trackMs: 6000 });

export function moveBall({ x, y, vx, vy }, dt, w, hgt, radius) {
  x += vx * dt; y += vy * dt;
  if (x < radius) { x = radius; vx = Math.abs(vx); }
  if (x > w - radius) { x = w - radius; vx = -Math.abs(vx); }
  if (y < radius) { y = radius; vy = Math.abs(vy); }
  if (y > hgt - radius) { y = hgt - radius; vy = -Math.abs(vy); }
  return { x, y, vx, vy };
}

export const scoreTracking = (targets, picked) => targets.size === picked.size && [...targets].every(t => picked.has(t));

async function round(el, r, { cups, targets, speed, trackMs }) {
  const arena = h('div', { class: 'arena' });
  const prompt = h('p', 'Track the highlighted cups');
  el.replaceChildren(prompt, arena);
  const w = arena.clientWidth, hgt = arena.clientHeight;
  let balls = Array.from({ length: cups }, () => {
    const a = r() * Math.PI * 2;
    return { x: R + r() * (w - 2 * R), y: R + r() * (hgt - 2 * R), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed };
  });
  const tset = new Set(pick(r, [...balls.keys()], targets));
  const picked = new Set();
  const btns = balls.map((b, i) => h('button', {
    type: 'button', class: 'ball' + (tset.has(i) ? ' target' : ''), disabled: true,
    'aria-label': 'cup ' + (i + 1) + (tset.has(i) ? ', target' : ''),
    onclick: () => { picked.has(i) ? picked.delete(i) : picked.add(i); btns[i].setAttribute('aria-pressed', String(picked.has(i))); },
  }));
  const place = () => btns.forEach((b, i) => { b.style.transform = 'translate(' + (balls[i].x - R) + 'px,' + (balls[i].y - R) + 'px)'; });
  arena.append(...btns);
  place();
  await wait(2000);
  btns.forEach((b, i) => { b.classList.remove('target'); b.setAttribute('aria-label', 'cup ' + (i + 1)); });
  prompt.textContent = 'Keep tracking';
  await new Promise(done => {
    const start = performance.now();
    let last = start;
    const frame = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      balls = balls.map(b => moveBall(b, dt, w, hgt, R));
      place();
      if (now - start < trackMs) requestAnimationFrame(frame); else done();
    };
    requestAnimationFrame(frame);
  });
  prompt.textContent = 'Pick the ' + targets + ' cups you tracked';
  btns.forEach(b => { b.disabled = false; b.setAttribute('aria-pressed', 'false'); });
  btns[0].focus();
  const t0 = Date.now();
  await new Promise(done => el.append(h('div', { class: 'row' }, h('button', { type: 'button', class: 'primary', onclick: done }, 'Check'))));
  const ok = scoreTracking(tset, picked);
  await feedback(el, ok, ok ? '' : 'You had ' + [...picked].filter(i => tset.has(i)).length + ' of ' + targets + '.');
  return { ok, ms: Date.now() - t0 };
}

export async function run(el, { level, r }) {
  let lv = level, correct = 0, ms = 0;
  const total = 5;
  for (let i = 0; i < total; i++) {
    const res = await round(el, r, params(tier(lv)));
    if (res.ok) correct++;
    ms += res.ms;
    lv = step(lv, res.ok, maxLevel);
  }
  return { correct, total, ms: Math.round(ms / total), level: lv };
}

// Benchmark: 4 targets among 10 cups at tier-4 speed, 5 rounds; score = accuracy %.
export async function bench(el, r) {
  let correct = 0;
  for (let i = 0; i < 5; i++) if ((await round(el, r, { cups: 10, targets: 4, speed: 160, trackMs: 6000 })).ok) correct++;
  return correct * 20;
}
