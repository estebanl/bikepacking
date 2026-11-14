// Shared helpers for the managed API.
//
// Identity comes only from the x-ms-client-principal header, which Static Web
// Apps injects after its own login; clients cannot forge it on managed APIs.
// staticwebapp.config.json already limits /api/* to the "rider" role; we check
// again here so a config mistake can't open the API.
const crypto = require('node:crypto');
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

function principal(request) {
  const raw = request.headers.get('x-ms-client-principal');
  if (!raw) return null;
  try {
    const p = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    if (!p.userId || !(p.userRoles || []).includes('rider')) return null;
    // Opaque, stable id for storage keys; the raw provider id is never stored.
    const uid = crypto.createHash('sha256').update(`${p.identityProvider}:${p.userId}`).digest('hex').slice(0, 32);
    return { uid, name: p.userDetails || '' };
  } catch {
    return null;
  }
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

async function encryptForVault(text) {
  const pem = await wrapPublicKey();
  return crypto.publicEncrypt(
    { key: pem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(text, 'utf8'),
  ).toString('base64');
}

module.exports = { principal, json, enqueue, getProfile, mergeProfile, blobs, encryptForVault };
