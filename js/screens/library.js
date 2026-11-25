// Route #/library: add, edit and delete your own cards.
import { h, toast } from '../ui.js';
import { newCard } from '../srs.js';

const TYPES = {
  person: { label: 'Person', front: 'One detail (where you met, what they do)', back: 'Name' },
  fact: { label: 'Fact', front: 'Question', back: 'Answer' },
  reading: { label: 'Reading', front: 'Title', back: 'Text to read and recall' },
  psych: { label: 'Thinking bias', front: 'Scenario', back: 'Name and definition' },
};

// Center-cropped square JPEG data URL, small enough to keep hundreds in browser storage.
export async function downscale(file, size = 96) {
  const bmp = await createImageBitmap(file);
  const s = Math.min(bmp.width, bmp.height);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.8);
}

const clip = s => (s.length > 80 ? s.slice(0, 79) + '…' : s);

export function render(el, ctx) {
  let editing = null;
  let filter = 'all';
  const err = h('p', { class: 'bad', role: 'alert' });
  const typeSel = h('select', { id: 'card-type' }, Object.entries(TYPES).map(([k, t]) => h('option', { value: k }, t.label)));
  const frontLabel = h('label', { for: 'card-front' });
  const front = h('textarea', { id: 'card-front', rows: 2 });
  const backLabel = h('label', { for: 'card-back' });
  const back = h('textarea', { id: 'card-back', rows: 2 });
  const photoInput = h('input', { id: 'card-photo', type: 'file', accept: 'image/*' });
  const photoWrap = h('div', h('label', { for: 'card-photo' }, 'Photo (optional)'), photoInput);
  const submit = h('button', { class: 'primary' }, 'Add card');
  const cancel = h('button', { type: 'button', hidden: true, onclick: () => resetForm() }, 'Cancel edit');
  const list = h('div', { class: 'cards' });

  function syncLabels() {
    const t = TYPES[typeSel.value];
    frontLabel.textContent = t.front;
    backLabel.textContent = t.back;
    back.rows = typeSel.value === 'reading' ? 10 : 2;
    photoWrap.hidden = typeSel.value !== 'person';
  }
  function resetForm() {
    editing = null;
    front.value = ''; back.value = ''; photoInput.value = '';
    submit.textContent = 'Add card'; cancel.hidden = true; typeSel.disabled = false; err.textContent = '';
    syncLabels();
  }
  function edit(card) {
    editing = card.id;
    typeSel.value = card.type; typeSel.disabled = true; syncLabels();
    front.value = card.front; back.value = card.back;
    submit.textContent = 'Save changes'; cancel.hidden = false;
    front.focus();
  }
  function remove(card) {
    if (!confirm('Delete this card? Its review history is lost.')) return;
    if (ctx.commit({ ...ctx.state, cards: ctx.state.cards.filter(c => c.id !== card.id) })) { toast('Card deleted.'); drawList(); }
  }
  function drawList() {
    const cards = ctx.state.cards.filter(c => filter === 'all' || c.type === filter);
    list.replaceChildren(...(cards.length ? cards.map(card => h('div', { class: 'card-row' },
      card.photo ? h('img', { src: card.photo, alt: '', width: 40, height: 40, class: 'face' }) : h('span', { class: 'muted small' }, TYPES[card.type].label),
      h('div', { class: 'card-text' }, h('div', clip(card.front)), h('div', { class: 'muted small' }, clip(card.back) + ' (due ' + card.due + ')')),
      h('button', { type: 'button', 'aria-label': 'Edit: ' + clip(card.front), onclick: () => edit(card) }, 'Edit'),
      h('button', { type: 'button', 'aria-label': 'Delete: ' + clip(card.front), onclick: () => remove(card) }, 'Delete')))
      : [h('p', { class: 'muted' }, 'No cards here yet.')]));
  }

  typeSel.addEventListener('change', syncLabels);
  const form = h('form', {
    class: 'panel',
    onsubmit: async e => {
      e.preventDefault();
      const f = front.value.trim(), b = back.value.trim();
      if (!f || !b) { err.textContent = 'Fill in both fields.'; return; }
      let photo;
      if (typeSel.value === 'person' && photoInput.files[0]) {
        try { photo = await downscale(photoInput.files[0]); } catch { err.textContent = 'That file could not be read as an image.'; return; }
      }
      const cards = editing
        ? ctx.state.cards.map(c => (c.id === editing ? { ...c, front: f, back: b, ...(photo && { photo }) } : c))
        : [...ctx.state.cards, newCard({ type: typeSel.value, front: f, back: b, photo: photo ?? null }, ctx.today())];
      if (!ctx.commit({ ...ctx.state, cards })) return;
      toast(editing ? 'Card updated.' : 'Card added.');
      resetForm();
      drawList();
    },
  }, h('h2', 'Add a card'), h('label', { for: 'card-type' }, 'Type'), typeSel, frontLabel, front, backLabel, back, photoWrap, err,
  h('div', { class: 'row' }, submit, cancel));

  const filterSel = h('select', { id: 'filter', onchange: e => { filter = e.target.value; drawList(); } },
    h('option', { value: 'all' }, 'All'), Object.entries(TYPES).map(([k, t]) => h('option', { value: k }, t.label)));

  el.append(
    h('h1', 'Library'),
    h('p', { class: 'muted' }, 'Add the people, facts and reading you want to remember. Each card comes back for review just before you would forget it.'),
    form,
    h('h2', 'Your cards'),
    h('label', { for: 'filter' }, 'Show'), filterSel,
    list);
  syncLabels();
  drawList();
}
