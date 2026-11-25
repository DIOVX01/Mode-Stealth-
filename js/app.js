import { KEY, load, save } from './store.js';
import { dayKey } from './day.js';

const root = document.getElementById('app');
const banner = document.getElementById('banner');
const showBanner = text => { banner.hidden = false; banner.textContent = text; };

const { state, error, raw, readOnly } = load(localStorage);
let lastRaw = raw; // what this tab last read or wrote; a mismatch means another tab saved newer data
if (error) {
  showBanner(readOnly
    ? 'Saved data couldn’t be read, and browser storage is too full to keep a safety copy. Saving is turned off so it is not overwritten. Open Backup and download it.'
    : 'Saved data couldn’t be read. It was kept as a backup copy in browser storage; download it from Backup before doing anything else.');
}

const ctx = {
  state,
  params: {},
  today: () => dayKey(),
  commit(next) {
    if (readOnly) { showBanner('Saving is turned off to protect unreadable data. Open Backup and download it.'); return false; }
    const r = save(next, localStorage, lastRaw);
    if (r.stale) { location.reload(); return false; }
    if (!r.ok) { showBanner('Not saved: ' + r.error + ' Everything saved before this is safe.'); return false; }
    lastRaw = r.raw;
    ctx.state = next;
    return true;
  },
  go(hash) { location.hash = hash; },
};

// Another HiveMind tab saved: reload so this tab never works from (and overwrites with) old data.
addEventListener('storage', e => { if (e.key === KEY) location.reload(); });

const SCREENS = ['dashboard', 'session', 'library', 'palace', 'backup', 'welcome', 'drill'];

async function route() {
  const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const [name, arg] = path.split('/');
  const screen = SCREENS.includes(name) ? name : 'dashboard';
  // First run: nothing set up yet. Backup stays reachable so a fresh install can import.
  const firstRun = ctx.state.palace.length === 0 && ctx.state.benchmarks.length === 0;
  if (firstRun && !['welcome', 'palace', 'backup'].includes(screen)) { location.hash = '#/welcome'; return; }
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
