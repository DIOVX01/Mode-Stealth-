// Small DOM helpers. Nothing here runs at import time (tests import modules in Node).

export function h(tag, props = {}, ...children) {
  if (props === null || typeof props !== 'object' || Array.isArray(props) || props instanceof Node) {
    children.unshift(props);
    props = {};
  }
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  return el;
}

export const clear = el => el.replaceChildren();
export const wait = ms => new Promise(r => setTimeout(r, ms));
let uid = 0;

export function askText(el, prompt, { inputmode, multiline = false, submitLabel = 'Submit' } = {}) {
  return new Promise(resolve => {
    const id = `ask-${++uid}`;
    const input = multiline
      ? h('textarea', { id, rows: 8 })
      : h('input', { id, inputmode, autocomplete: 'off', spellcheck: 'false' });
    const form = h('form', { onsubmit: e => { e.preventDefault(); resolve(input.value); } },
      h('label', { for: id }, prompt), input,
      h('div', { class: 'row' }, h('button', { class: 'primary' }, submitLabel)));
    if (multiline) input.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) form.requestSubmit(); });
    el.replaceChildren(form);
    input.focus();
  });
}

export function askChoice(el, prompt, labels) {
  return new Promise(resolve => {
    const done = i => { removeEventListener('keydown', onKey); resolve(i); };
    const onKey = e => {
      if (!el.isConnected) return removeEventListener('keydown', onKey);
      const n = Number(e.key);
      if (n >= 1 && n <= labels.length) done(n - 1);
    };
    addEventListener('keydown', onKey);
    el.replaceChildren(h('p', prompt),
      h('div', { class: 'row' }, labels.map((l, i) => h('button', { type: 'button', onclick: () => done(i) }, l))));
    el.querySelector('button')?.focus();
  });
}

// Display-only grid (scenes to study). cells: glyph strings or empty strings.
export function showGrid(el, cells, { cols = 4, labels = [] } = {}) {
  const grid = h('div', { class: 'grid', style: `--cols:${cols}`, role: 'list' },
    cells.map((c, i) => h('div', { class: 'cell', role: 'listitem', 'aria-label': labels[i] || c || 'empty' }, c)));
  el.replaceChildren(grid);
  return grid;
}

// Interactive grid. Single pick resolves on click; multi toggles and resolves on the submit button.
export function gridPick(el, cells, { cols = 4, multi = false, labels = [], prompt, submitLabel = 'Done' } = {}) {
  return new Promise(resolve => {
    const picked = new Set();
    const buttons = cells.map((c, i) => h('button', {
      type: 'button', class: 'cell',
      'aria-label': labels[i] || c || `empty cell ${i + 1}`,
      'aria-pressed': multi ? 'false' : null,
      onclick: () => {
        if (!multi) return resolve([i]);
        picked.has(i) ? picked.delete(i) : picked.add(i);
        buttons[i].setAttribute('aria-pressed', String(picked.has(i)));
      },
    }, c));
    el.replaceChildren(
      ...(prompt ? [h('p', prompt)] : []),
      h('div', { class: 'grid', style: `--cols:${cols}` }, buttons),
      ...(multi ? [h('div', { class: 'row' }, h('button', { type: 'button', class: 'primary', onclick: () => resolve([...picked].sort((a, b) => a - b)) }, submitLabel))] : []));
    buttons[0]?.focus();
  });
}

export async function countdown(el, seconds, label = '') {
  for (let s = seconds; s > 0; s--) {
    el.replaceChildren(...(label ? [h('p', { class: 'muted' }, label)] : []), h('div', { class: 'big' }, s));
    await wait(1000);
  }
}

let toastTimer;
export function toast(msg, { error = false } = {}) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `show${error ? ' error' : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = ''; }, error ? 8000 : 3500);
}

// Brief right/wrong flash after a trial. Text, not colour alone, carries the result.
export async function feedback(el, ok, detail = '', ms = 700) {
  el.replaceChildren(h('div', { class: `big ${ok ? 'good' : 'bad'}` }, ok ? 'Correct' : 'Wrong'),
    ...(detail ? [h('p', detail)] : []));
  await wait(ok ? ms : ms * 2);
}
