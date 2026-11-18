const crypto = require('node:crypto');
const { app } = require('@azure/functions');
const { principal, json, enqueue, getProfile, mergeProfile, blobs, encryptForVault } = require('../lib');

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
const BUSY = new Set(['pending', 'syncing', 'deleting']);

function guard(handler) {
  return async (request, context) => {
    const user = principal(request);
    if (!user) return json(403, { error: 'An invitation is required to use the heatmap.' });
    try {
      return await handler(request, user, context);
    } catch (e) {
      context.error(e);
      return json(500, { error: 'Something went wrong. Try again in a minute.' });
    }
  };
}

// What a profile field goes back to when there was nothing there before.
const BLANK = { status: 'no-key', message: '', lastRequested: '', purge: false };
const deleting = () => json(409, { error: 'Your data is being deleted. Try again in a minute.' });

// Mark the profile busy, then queue the job that will clear it. If the queue
// send fails, no job will ever run, so put the profile back before failing:
// otherwise the page would hide its forms and poll forever.
// Every job carries the profile's gen, so a job that is delayed or retried
// until after "Delete my data" and a fresh start is refused by the worker.
async function submit(uid, before, busy, job) {
  const gen = (before && before.gen) || crypto.randomUUID();
  await mergeProfile(uid, { ...busy, gen });
  try {
    await enqueue({ ...job, uid, gen });
  } catch (e) {
    const undo = {};
    for (const k of Object.keys(busy)) undo[k] = before && before[k] !== undefined ? before[k] : BLANK[k];
    await mergeProfile(uid, undo);
    throw e;
  }
}

function view(p) {
  return {
    hasKey: !!p.hasKey,
    keyRejected: !!p.keyRejected || p.status === 'invalid-key',
    status: p.status || 'no-key',
    message: p.message || '',
    lastRun: p.lastRun || null,
    stats: p.stats ? JSON.parse(p.stats) : null,
    years: p.years ? JSON.parse(p.years) : [],
    backfilling: !!p.backfilling,
  };
}

// GET: profile summary (created on first visit). DELETE: remove key, tracks, map, profile.
app.http('profile', {
  methods: ['GET', 'DELETE'],
  authLevel: 'anonymous',
  route: 'profile',
  handler: guard(async (request, user) => {
    let p = await getProfile(user.uid);
    if (request.method === 'DELETE') {
      // The purge mark stops worker jobs already running for this rider from
      // writing anything more; the purge job then removes the profile itself.
      await submit(user.uid, p, { status: 'deleting', message: '', purge: true }, { op: 'purge-user' });
      return json(202, { status: 'deleting' });
    }
    if (!p) {
      // gen tells the worker which "life" of the profile a job belongs to, so a
      // job that outlives "Delete my data" can't write into a fresh profile.
      p = { hasKey: false, status: 'no-key', createdAt: new Date().toISOString(), gen: crypto.randomUUID() };
      await mergeProfile(user.uid, { ...p, displayName: user.name });
    }
    return json(200, { name: user.name, ...view(p) });
  }),
});

// PUT: submit a Garmin Personal API key (write-only; never returned).
// DELETE: remove the stored key.
app.http('key', {
  methods: ['PUT', 'DELETE'],
  authLevel: 'anonymous',
  route: 'key',
  handler: guard(async (request, user) => {
    const p = await getProfile(user.uid);
    if (p && p.purge) return deleting();
    if (request.method === 'DELETE') {
      await submit(user.uid, p, { status: 'deleting', message: '' }, { op: 'delete-key' });
      return json(202, { status: 'deleting' });
    }
    let body;
    try { body = await request.json(); } catch { body = {}; }
    const key = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
    if (key.length < 20 || key.length > 400 || !/^[\x21-\x7e]+$/.test(key)) {
      return json(400, { error: 'That does not look like a Garmin Personal API key.' });
    }
    let enc;
    try {
      enc = await encryptForVault(key);
    } catch {
      return json(503, { error: 'The app is still starting up. Try again in a minute.' });
    }
    await submit(user.uid, p, { status: 'pending', message: '' }, { op: 'set-key', enc });
    return json(202, { status: 'pending' });
  }),
});

// POST: rebuild now (rate limited).
app.http('refresh', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'refresh',
  handler: guard(async (request, user) => {
    const p = await getProfile(user.uid);
    if (p && p.purge) return deleting();
    if (!p || !p.hasKey) return json(409, { error: 'Add your Garmin API key first.' });
    if (BUSY.has(p.status)) return json(202, { status: p.status });
    const last = p.lastRequested ? Date.parse(p.lastRequested) : 0;
    if (Date.now() - last < REFRESH_COOLDOWN_MS) {
      return json(429, { error: 'Refreshed recently. Try again in a few minutes.' });
    }
    await submit(user.uid, p, { status: 'pending', message: '', lastRequested: new Date().toISOString() },
      { op: 'refresh', full: true });
    return json(202, { status: 'pending' });
  }),
});

// GET: the signed-in rider's heatmap data (optional ?year=YYYY|all).
app.http('heatmap', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'heatmap',
  handler: guard(async (request, user) => {
    const rawYear = request.query.get('year');
    if (rawYear !== null && rawYear !== 'all' && !/^\d{4}$/.test(rawYear)) {
      return json(400, { error: 'Invalid year.' });
    }
    const year = rawYear || String(new Date().getUTCFullYear());
    const container = blobs().getContainerClient('heatmaps');
    try {
      const buf = await container.getBlobClient(`${user.uid}/${year}.json`).downloadToBuffer();
      return {
        status: 200,
        body: buf,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-cache' },
      };
    } catch (e) {
      if (e.statusCode !== 404) throw e;
    }
    // Fallback to legacy single-file heatmap before the rider's next refresh/backfill.
    if (year !== 'all') {
      try {
        const buf = await container.getBlobClient(`${user.uid}.json`).downloadToBuffer();
        const parsed = JSON.parse(buf.toString('utf8'));
        if (!rawYear || String(parsed.year) === year) {
          return {
            status: 200,
            body: buf,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-cache' },
          };
        }
      } catch (e) {
        if (e.statusCode !== 404) throw e;
      }
    }
    return json(404, { error: 'No heatmap yet.' });
  }),
});
