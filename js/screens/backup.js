// Route #/backup: export everything to a file, import a backup, recover unreadable data.
import { h, toast } from '../ui.js';
import { KEY, exportJson, parseImport } from '../store.js';

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function render(el, ctx) {
  const today = ctx.today();
  const msg = h('p', { role: 'status' });
  const sizeKb = Math.round(exportJson(ctx.state).length / 1024);
  const file = h('input', { id: 'import-file', type: 'file', accept: 'application/json,.json' });

  const exportBtn = h('button', {
    type: 'button', class: 'primary',
    onclick: () => {
      const next = { ...ctx.state, lastBackupAt: today };
      download('hivemind-backup-' + today + '.json', exportJson(next)); // download first: it must happen even if saving fails
      ctx.commit(next);
      msg.textContent = 'Backup downloaded. Keep it somewhere safe, outside the browser.';
    },
  }, 'Export backup');

  file.addEventListener('change', async () => {
    const f = file.files[0];
    if (!f) return;
    const res = parseImport(await f.text());
    file.value = '';
    if (!res.ok) { msg.textContent = 'Not imported: ' + res.error; return; }
    if (!confirm('Replace all current data with this backup? Your current data will be downloaded first.')) return;
    download('hivemind-before-import-' + today + '.json', exportJson(ctx.state));
    if (ctx.commit(res.state)) { toast('Backup imported.'); ctx.go('#/'); }
  });

  const corrupt = Object.keys(localStorage).filter(k => k.startsWith(KEY + ':corrupt-'));

  el.append(
    h('h1', 'Backup'),
    h('p', 'Your training history lives only in this browser. Clearing browser data erases it, so export a backup every week.'),
    h('p', { class: 'muted' }, 'Last backup: ' + (ctx.state.lastBackupAt ?? 'never') + '. Data size: about ' + sizeKb + ' KB.'),
    h('div', { class: 'row start' }, exportBtn),
    h('h2', 'Import a backup'),
    h('label', { for: 'import-file' }, 'Choose a HiveMind backup file (.json)'),
    file,
    msg,
    ...(corrupt.length ? [h('div',
      h('h2', 'Unreadable data'),
      h('p', 'This data could not be read when HiveMind started. It was kept, untouched. Download it before doing anything else.'),
      corrupt.map(k => h('button', { type: 'button', onclick: () => download('hivemind-unreadable-' + k.split('-').pop() + '.json', localStorage.getItem(k)) },
        'Download copy saved ' + new Date(+k.split('-').pop()).toLocaleString())))] : []));
}
