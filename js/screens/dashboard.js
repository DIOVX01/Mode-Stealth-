import { h } from '../ui.js';

export function render(el) {
  el.append(h('h1', 'HiveMind'), h('p', { class: 'muted' }, 'Dashboard coming in a later task.'));
}
