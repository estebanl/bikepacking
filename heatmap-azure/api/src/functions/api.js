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

function view(p) {
  return {
    hasKey: !!p.hasKey,
    status: p.status || 'no-key',
    message: p.message || '',
    lastRun: p.lastRun || null,
    stats: p.stats ? JSON.parse(p.stats) : null,
  };
}

// GET: profile summary (created on first visit). DELETE: remove key, tracks, map, profile.
app.http('profile', {
  methods: ['GET', 'DELETE'],
  authLevel: 'anonymous',
  route: 'profile',
  handler: guard(async (request, user) => {
    if (request.method === 'DELETE') {
      await mergeProfile(user.uid, { status: 'deleting' });
      await enqueue({ op: 'purge-user', uid: user.uid });
      return json(202, { status: 'deleting' });
    }
    let p = await getProfile(user.uid);
    if (!p) {
      p = { hasKey: false, status: 'no-key', createdAt: new Date().toISOString() };
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
    if (request.method === 'DELETE') {
      await mergeProfile(user.uid, { status: 'deleting' });
      await enqueue({ op: 'delete-key', uid: user.uid });
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
    await mergeProfile(user.uid, { status: 'pending', message: '' });
    await enqueue({ op: 'set-key', uid: user.uid, enc });
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
    if (!p || !p.hasKey) return json(409, { error: 'Add your Garmin API key first.' });
    if (BUSY.has(p.status)) return json(202, { status: p.status });
    const last = p.lastRequested ? Date.parse(p.lastRequested) : 0;
    if (Date.now() - last < REFRESH_COOLDOWN_MS) {
      return json(429, { error: 'Refreshed recently. Try again in a few minutes.' });
    }
    await mergeProfile(user.uid, { status: 'pending', lastRequested: new Date().toISOString() });
    await enqueue({ op: 'refresh', uid: user.uid });
    return json(202, { status: 'pending' });
  }),
});

// GET: the signed-in rider's heatmap data.
app.http('heatmap', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'heatmap',
  handler: guard(async (request, user) => {
    try {
      const buf = await blobs().getContainerClient('heatmaps').getBlobClient(`${user.uid}.json`).downloadToBuffer();
      return {
        status: 200,
        body: buf,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-cache' },
      };
    } catch (e) {
      if (e.statusCode === 404) return json(404, { error: 'No heatmap yet.' });
      throw e;
    }
  }),
});
