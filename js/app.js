import { load, save } from './store.js';
import { dayKey } from './day.js';
import { toast } from './ui.js';

const root = document.getElementById('app');
const { state, error } = load(localStorage);
if (error) {
  const b = document.getElementById('banner');
  b.hidden = false;
  b.textContent = 'Saved data couldn’t be read. It was kept as a backup copy in browser storage; export it from Backup before doing anything else.';
}

const ctx = {
  state,
  params: {},
  today: () => dayKey(),
  commit(next) {
    const r = save(next, localStorage);
    if (!r.ok) { toast(r.error, { error: true }); return false; }
    ctx.state = next;
    return true;
  },
  go(hash) { location.hash = hash; },
};

const SCREENS = ['dashboard', 'session', 'library', 'palace', 'backup', 'welcome', 'drill'];

async function route() {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [name, arg] = path.split('/');
  const screen = SCREENS.includes(name) ? name : 'dashboard';
  // Each render gets its own view, so a screen left mid-drill writes into a detached node, not the new screen.
  const view = document.createElement('div');
  root.replaceChildren(view);
  ctx.params = { arg, query: new URLSearchParams(query) };
  try {
    const mod = await import(`./screens/${screen}.js`);
    await mod.render(view, ctx);
  } catch (e) {
    console.error(e);
    if (view.isConnected) view.textContent = `Something went wrong: ${e.message}`;
  }
}

addEventListener('hashchange', () => { route(); root.focus(); });
route();
