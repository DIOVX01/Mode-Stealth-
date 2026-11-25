// Route #/palace: set up the ordered spots (loci) along a route you know well.
import { h, toast } from '../ui.js';

export function validLoci(text) {
  const loci = text.split('\n').map(s => s.trim()).filter(Boolean);
  if (loci.length < 10) return { error: 'Add at least 10 spots (you have ' + loci.length + ').' };
  if (loci.length > 30) return { error: 'Use at most 30 spots (you have ' + loci.length + ').' };
  const seen = new Set();
  for (const l of loci) {
    if (seen.has(l.toLowerCase())) return { error: 'Each spot must be different: “' + l + '” appears twice.' };
    seen.add(l.toLowerCase());
  }
  return { loci };
}

export function render(el, ctx) {
  const area = h('textarea', { id: 'loci', rows: 14, 'aria-describedby': 'loci-help loci-error' }, ctx.state.palace.join('\n'));
  const err = h('p', { id: 'loci-error', class: 'bad', role: 'alert' });
  const form = h('form', {
    onsubmit: e => {
      e.preventDefault();
      const res = validLoci(area.value);
      if (res.error) { err.textContent = res.error; area.focus(); return; }
      if (!ctx.commit({ ...ctx.state, palace: res.loci })) return;
      toast('Memory palace saved: ' + res.loci.length + ' spots.');
      ctx.go(ctx.params.query.get('return') || '#/');
    },
  },
    h('label', { for: 'loci' }, 'Spots along your route, one per line, in walking order'),
    area, err,
    h('div', { class: 'row' }, h('button', { class: 'primary' }, 'Save palace')));
  el.append(
    h('h1', 'Memory palace'),
    h('p', { id: 'loci-help' }, 'Pick a route through a place you know well, like your home. Name 10 to 30 spots along it, in order: front door, shoe rack, sofa, and so on.'),
    h('p', { class: 'muted' }, 'In the drill, picture each word sitting at its spot. To recall, walk the route in your head.'),
    form);
}
