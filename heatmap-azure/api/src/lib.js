// Shared helpers for the managed API.
//
// Identity comes from an Auth0 JWT access token in the Authorization header,
// verified against the tenant's JWKS endpoint. An Auth0 Post-Login Action
// injects the user's roles into a custom claim; only users with the "rider"
// role are allowed.
const crypto = require('node:crypto');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const { TableClient } = require('@azure/data-tables');
const { BlobServiceClient } = require('@azure/storage-blob');
const { QueueClient } = require('@azure/storage-queue');

const conn = () => {
  const c = process.env.STORAGE_CONNECTION;
  if (!c) throw new Error('STORAGE_CONNECTION is not configured');
  return c;
};

const profiles = () => TableClient.fromConnectionString(conn(), 'profiles');
const blobs = () => BlobServiceClient.fromConnectionString(conn());
const jobs = () => new QueueClient(conn(), 'jobs');

function authConfig() {
  const rawDomain = (process.env.AUTH0_DOMAIN || '').trim();
  const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const clientId = (process.env.AUTH0_CLIENT_ID || '').trim();
  const audience = (process.env.AUTH0_AUDIENCE || '').trim();
  const rolesClaim = (process.env.AUTH0_ROLES_CLAIM || 'https://ride-heatmap/roles').trim();
  return { domain, clientId, audience, rolesClaim };
}

let jwksCache = { domain: '', fn: null };
function getJwks(domain) {
  if (jwksCache.domain !== domain || !jwksCache.fn) {
    jwksCache = {
      domain,
      fn: createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`)),
    };
  }
  return jwksCache.fn;
}

async function principal(request) {
  const { domain, audience, rolesClaim } = authConfig();
  if (!domain || !audience) {
    return { status: 503, error: 'Auth0 is not configured.' };
  }
  const auth = request.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return { status: 401, error: 'Sign in required.' };
  let payload;
  try {
    ({ payload } = await jwtVerify(m[1], getJwks(domain), {
      issuer: `https://${domain}/`,
      audience,
    }));
  } catch {
    return { status: 401, error: 'Invalid or expired session.' };
  }
  if (!payload.sub) return { status: 401, error: 'Invalid token.' };
  const roles = Array.isArray(payload[rolesClaim]) ? payload[rolesClaim] : [];
  if (!roles.includes('rider')) {
    return { status: 403, error: 'An invitation is required to use the heatmap.' };
  }
  // Opaque, stable id for storage keys; the raw provider id is never stored.
  const uid = crypto.createHash('sha256').update(`auth0:${payload.sub}`).digest('hex').slice(0, 32);
  const name = payload.email || payload.name || '';
  return { user: { uid, name } };
}

const json = (status, body) => ({
  status,
  jsonBody: body,
  headers: { 'Cache-Control': 'no-store' },
});

// Queue messages are base64 so the Functions queue trigger can read them.
async function enqueue(msg) {
  await jobs().sendMessage(Buffer.from(JSON.stringify(msg)).toString('base64'));
}

async function getProfile(uid) {
  try {
    return await profiles().getEntity('user', uid);
  } catch (e) {
    if (e.statusCode === 404) return null;
    throw e;
  }
}

async function mergeProfile(uid, fields) {
  await profiles().upsertEntity({ partitionKey: 'user', rowKey: uid, ...fields }, 'Merge');
}

// RSA public key published by the worker from Key Vault; cached per instance.
let wrapKey = null;
async function wrapPublicKey() {
  if (wrapKey) return wrapKey;
  const buf = await blobs().getContainerClient('config').getBlobClient('wrap-public.json').downloadToBuffer();
  wrapKey = JSON.parse(buf.toString('utf8')).pem;
  return wrapKey;
}

// Hybrid encryption: RSA-OAEP with a 2048-bit key can only hold 190 bytes, and
// a Garmin key may be longer. The key is sealed with a one-time AES-256-GCM key,
// and only that AES key is wrapped with the Key Vault public key.
// Format: v2.<wrapped AES key>.<iv>.<ciphertext>.<tag>, each part base64.
async function encryptForVault(text) {
  const pem = await wrapPublicKey();
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
  const sealed = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const wrapped = crypto.publicEncrypt(
    { key: pem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    aesKey,
  );
  return ['v2', ...[wrapped, iv, sealed, cipher.getAuthTag()].map((b) => b.toString('base64'))].join('.');
}

module.exports = { authConfig, principal, json, enqueue, getProfile, mergeProfile, blobs, encryptForVault };
