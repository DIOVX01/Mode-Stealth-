// Remember-to-do (prospective memory) cue: appears once, unannounced, over whatever drill is running.
import { h } from './ui.js';

// result resolves true (clicked), false (shown but missed) or null (never shown: drill ended first or user left).
export function armCue(root, { delayMs, showMs = 5000 }) {
  let settle, btn, hideTimer, shown = false, done = false;
  const result = new Promise(res => { settle = res; });
  const finish = hit => {
    if (done) return;
    done = true;
    clearTimeout(showTimer); clearTimeout(hideTimer);
    btn?.remove();
    settle(hit);
  };
  const showTimer = setTimeout(() => {
    shown = true;
    btn = h('button', { type: 'button', class: 'cue', 'aria-label': 'purple circle', onclick: () => finish(true) }, '🟣');
    root.append(btn);
    hideTimer = setTimeout(() => finish(false), showMs);
  }, delayMs);
  return { result, disarm: () => finish(shown ? false : null) };
}
