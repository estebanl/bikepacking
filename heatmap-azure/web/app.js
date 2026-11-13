// Ride Heatmap — Static Web App front end.
// Sign-in is Static Web Apps' built-in Microsoft (Entra) login; the API only
// answers riders who were invited. The Garmin key is write-only from here.
'use strict';

// ---------------------------------------------------------------- map
const map = L.map('map', { renderer: L.canvas(), zoomControl: true });
const osmAttr = '&copy; OpenStreetMap contributors';
const osmUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const muted = L.tileLayer(osmUrl, { maxZoom: 19, attribution: osmAttr, className: 'tiles-muted' }).addTo(map);
const mutedDark = L.tileLayer(osmUrl, { maxZoom: 19, attribution: osmAttr, className: 'tiles-muted-dark' });
const street = L.tileLayer(osmUrl, { maxZoom: 19, attribution: osmAttr });
const cycling = L.tileLayer('https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
  { maxZoom: 19, attribution: osmAttr + ' &copy; CyclOSM' });
const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  { maxZoom: 15, attribution: osmAttr + ' &copy; OpenTopoMap (CC-BY-SA)' });
const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  { maxZoom: 18, attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics' });
const light = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  { maxZoom: 19, attribution: osmAttr + ' &copy; CARTO' });
const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  { maxZoom: 19, attribution: osmAttr + ' &copy; CARTO' });
L.control.layers({
  'Muted': muted, 'Muted dark': mutedDark,
  'Street': street, 'Cycling': cycling, 'Topo': topo,
  'Satellite': satellite, 'Light': light, 'Dark': dark,
}).addTo(map);
map.setView([43.71, -79.39], 11);

const $ = (id) => document.getElementById(id);

$('toggle').addEventListener('click', (e) => {
  const parts = [$('mapui'), $('account'), $('updated')];
  const hidden = $('account').style.display === 'none';
  parts.forEach((el) => { el.style.display = hidden ? '' : 'none'; });
  e.target.textContent = hidden ? 'Hide panel' : 'Show panel';
});

// Heat coloring: each line carries the number of rides that covered it.
const BINS = [[1, 1, '1'], [2, 2, '2'], [3, 5, '3–5'], [6, 10, '6–10'], [11, 20, '11–20'], [21, Infinity, '21+']];
// Hot = dark on light basemaps, bright on dark ones. Light ramp starts
// saturated: pale orange vanishes into OSM's road fills.
const PALETTE_LIGHT = ['#f26b1d', '#e03a12', '#c0122c', '#93004f', '#640066', '#33005c'];
const PALETTE_DARK = ['#8c2200', '#c23400', '#ee5500', '#ff8a1f', '#ffc04d', '#fff1a8'];
const FLAT = '#d92b00';
const DARK_BASES = new Set([dark, satellite, mutedDark]);
let darkBase = false;
let mode = 'heat';
let hasCounts = true;
let bucketLayers = [];
let usedBins = [];
let routeGroup = null;

const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};
if (store.get('heat-color-mode') === 'flat') mode = 'flat';
const weightInput = $('weight');
const savedWeight = parseFloat(store.get('heat-line-weight'));
if (!isNaN(savedWeight)) { weightInput.value = savedWeight; $('weight-val').textContent = savedWeight + ' px'; }

const palette = () => (darkBase ? PALETTE_DARK : PALETTE_LIGHT);
function styleFor(i) {
  const w = parseFloat(weightInput.value);
  if (mode === 'flat' || !hasCounts) return { color: FLAT, weight: w, opacity: 0.9 };
  return { color: palette()[i], weight: Math.min(w + 0.4 * i, w * 2), opacity: 0.9 };
}
function renderLegend() {
  const el = $('legend');
  el.replaceChildren();
  if (mode === 'flat' || !hasCounts || !usedBins.length) { el.style.display = 'none'; return; }
  el.style.display = '';
  const pal = palette();
  const bar = document.createElement('div'); bar.className = 'bar';
  const lbl = document.createElement('div'); lbl.className = 'lbl';
  usedBins.forEach((i) => {
    const sw = document.createElement('i'); sw.style.background = pal[i]; bar.append(sw);
    const t = document.createElement('span'); t.textContent = BINS[i][2]; lbl.append(t);
  });
  el.append('Rides per road', bar, lbl);
}
function restyle() {
  bucketLayers.forEach(({ layer, i }) => layer.setStyle(styleFor(i)));
  renderLegend();
}
function setMode(m) {
  mode = m;
  store.set('heat-color-mode', m);
  $('mode-heat').classList.toggle('on', m === 'heat');
  $('mode-flat').classList.toggle('on', m === 'flat');
  restyle();
}
$('mode-heat').addEventListener('click', () => setMode('heat'));
$('mode-flat').addEventListener('click', () => setMode('flat'));
map.on('baselayerchange', (e) => { darkBase = DARK_BASES.has(e.layer); restyle(); });
weightInput.addEventListener('input', () => {
  const w = parseFloat(weightInput.value);
  $('weight-val').textContent = w + ' px';
  store.set('heat-line-weight', w);
  restyle();
});
const binIndex = (c) => { for (let i = 0; i < BINS.length; i++) if (c <= BINS[i][1]) return i; return BINS.length - 1; };

function drawHeatmap(data) {
  if (routeGroup) map.removeLayer(routeGroup);
  bucketLayers = []; usedBins = [];
  const groups = BINS.map(() => []);
  for (const l of data.lines) {
    const pts = [];
    for (let j = 1; j + 1 < l.length; j += 2) pts.push([l[j + 1], l[j]]);
    groups[binIndex(l[0] > 0 ? l[0] : 1)].push(pts);
  }
  hasCounts = data.lines.some((l) => l[0] > 1);
  $('card').classList.toggle('nocounts', !hasCounts);
  routeGroup = L.featureGroup().addTo(map);
  groups.forEach((g, i) => {
    if (!g.length) return;
    usedBins.push(i);
    const layer = L.polyline(g, styleFor(i));
    bucketLayers.push({ layer, i });
    routeGroup.addLayer(layer);   // low → high, so hot roads draw on top
  });
  setMode(mode);
  if (bucketLayers.length) map.fitBounds(routeGroup.getBounds().pad(0.03));
  const st = data.stats;
  $('s-rides').textContent = st.rides;
  $('s-total').textContent = Math.round(st.total_km).toLocaleString();
  $('s-unique').textContent = Math.round(st.unique_km).toLocaleString();
  $('updated').textContent = `${data.year} · each road drawn once, colored by rides · updated ${new Date(data.updated_at).toLocaleString()}`;
  const rides = $('rides');
  rides.replaceChildren(...data.recent_rides.map((r) => {
    const row = document.createElement('div');
    const n = document.createElement('span'); n.textContent = r.name;
    const d = document.createElement('span'); d.className = 'd'; d.textContent = r.date;
    const k = document.createElement('span'); k.className = 'k'; k.textContent = `${r.km} km`;
    row.append(n, d, k);
    return row;
  }));
  $('mapui').classList.remove('hidden');
}

// ---------------------------------------------------------------- account
const STATUS_TEXT = {
  'no-key': 'No Garmin key yet.',
  pending: 'Working on it…',
  syncing: 'Downloading your rides from Garmin… (the first sync takes a few minutes)',
  ok: 'Garmin connected. Updates every morning.',
  'invalid-key': 'Garmin rejected your key.',
  error: 'The last update failed.',
  deleting: 'Deleting…',
};
const BUSY = new Set(['pending', 'syncing', 'deleting']);
let pollTimer = null;

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  Object.assign(e, props);
  e.append(...kids);
  return e;
}

async function api(path, opts = {}) {
  let r;
  try {
    r = await fetch(`/api/${path}`, { cache: 'no-store', ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  } catch {
    return { status: 0, body: null };   // network error
  }
  let body = null;
  try { body = await r.json(); } catch { /* not JSON (platform error page) */ }
  return { status: r.status, body };
}

function signedOut() {
  $('updated').textContent = 'Your rides as a heatmap, from Garmin Connect.';
  $('account').replaceChildren(
    el('p', { textContent: 'Sign in to see your heatmap. Access is by invitation.' }),
    el('a', { className: 'btn', href: '/.auth/login/aad?post_login_redirect_uri=/', textContent: 'Sign in with Microsoft' }),
  );
}

function notInvited(me) {
  $('updated').textContent = 'Your rides as a heatmap, from Garmin Connect.';
  $('account').replaceChildren(
    el('p', { className: 'who', textContent: `Signed in as ${me.userDetails}` }),
    el('p', { textContent: 'This app is invite-only. Ask the owner for an invitation, then open the invitation link.' }),
    el('div', { className: 'links' }, el('a', { href: '/.auth/logout?post_logout_redirect_uri=/', textContent: 'Sign out' })),
  );
}

function keyForm() {
  const input = el('input', { type: 'password', placeholder: 'Garmin Personal API key', autocomplete: 'off', required: true });
  const form = el('form', {}, input, el('button', { type: 'submit', textContent: 'Save' }));
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const r = await api('key', { method: 'PUT', body: JSON.stringify({ apiKey: input.value }) });
    input.value = '';
    if (r.status === 202) loadProfile();
    else alert((r.body && r.body.error) || 'Could not save the key.');
  });
  return el('div', {},
    form,
    el('small', {},
      'Create a key at ',
      el('a', { href: 'https://connect.garmin.com/app/settings/personalApiToken', target: '_blank', rel: 'noopener', textContent: 'Garmin Connect → Personal API' }),
      '. It is sent over HTTPS, encrypted by the API with a Key Vault key, stored in Azure Key Vault, and never shown again. Remove it anytime.'),
  );
}

function renderProfile(p, me) {
  const status = el('p', { className: 'status' + (['invalid-key', 'error'].includes(p.status) ? ' bad' : '') },
    STATUS_TEXT[p.status] || p.status, p.message ? ` ${p.message}` : '');
  const links = el('div', { className: 'links' });
  if (p.hasKey && !BUSY.has(p.status)) {
    const refresh = el('button', { textContent: 'Refresh now' });
    refresh.onclick = async () => {
      const r = await api('refresh', { method: 'POST' });
      if (r.status === 202) loadProfile(); else alert((r.body && r.body.error) || 'Could not refresh.');
    };
    const remove = el('button', { textContent: 'Remove Garmin key' });
    remove.onclick = async () => {
      if (!confirm('Remove your Garmin key? Your map stays until you delete your data.')) return;
      await api('key', { method: 'DELETE' }); loadProfile();
    };
    links.append(refresh, remove);
  }
  const wipe = el('button', { className: 'danger', textContent: 'Delete my data' });
  wipe.onclick = async () => {
    if (!confirm('Delete your Garmin key, downloaded rides and heatmap? This cannot be undone.')) return;
    const r = await api('profile', { method: 'DELETE' });
    if (r.status !== 202) {
      alert((r.body && r.body.error) || 'Could not delete your data.');
      return;
    }
    clearTimeout(pollTimer);
    shownRun = null;
    if (routeGroup) map.removeLayer(routeGroup);
    $('mapui').classList.add('hidden');
    $('updated').textContent = 'Your data is being deleted.';
    $('account').replaceChildren(
      el('p', { className: 'who', textContent: `Signed in as ${me.userDetails}` }),
      el('p', { className: 'status', textContent: 'Your Garmin key, rides and heatmap are being deleted.' }),
      el('div', { className: 'links' },
        el('button', { textContent: 'Start over', onclick: () => loadProfile() }),
        el('a', { href: '/.auth/logout?post_logout_redirect_uri=/', textContent: 'Sign out' }),
      ),
    );
  };
  links.append(wipe, el('a', { href: '/.auth/logout?post_logout_redirect_uri=/', textContent: 'Sign out' }));
  const parts = [el('p', { className: 'who', textContent: `Signed in as ${me.userDetails}` }), status];
  if (!p.hasKey && !BUSY.has(p.status)) parts.push(keyForm());
  parts.push(links);
  $('account').replaceChildren(...parts);
}

let me = null;
let shownRun = null;
let failures = 0;
async function loadProfile() {
  clearTimeout(pollTimer);
  const r = await api('profile');
  if (r.status === 401) return signedOut();          // session expired
  if (r.status === 403 && r.body && r.body.error) {  // not (or no longer) invited
    $('account').replaceChildren(el('p', { className: 'status bad', textContent: r.body.error }));
    return;
  }
  if (r.status !== 200) {
    // Transient (cold start, platform 5xx, network): keep retrying with backoff.
    failures += 1;
    const wait = Math.min(5000 * 2 ** (failures - 1), 60000);
    const why = r.status ? `HTTP ${r.status}` : 'network error';
    $('account').replaceChildren(el('p', { className: 'status bad',
      textContent: `Couldn’t reach the server (${why}). Retrying in ${Math.round(wait / 1000)} s…` }));
    pollTimer = setTimeout(loadProfile, wait);
    return;
  }
  failures = 0;
  const p = r.body;
  renderProfile(p, me);
  if (p.lastRun && p.lastRun !== shownRun) {
    const h = await api('heatmap');
    if (h.status === 200) { drawHeatmap(h.body); shownRun = p.lastRun; }
  } else if (!p.lastRun) {
    $('updated').textContent = p.hasKey ? 'Your first heatmap is on its way.' : 'Add your Garmin key to build your heatmap.';
  }
  if (BUSY.has(p.status)) pollTimer = setTimeout(loadProfile, 5000);
}

(async function start() {
  try {
    const r = await fetch('/.auth/me', { cache: 'no-store' });
    me = (await r.json()).clientPrincipal;
  } catch { me = null; }
  if (!me) return signedOut();
  if (!(me.userRoles || []).includes('rider')) return notInvited(me);
  loadProfile();
}());
