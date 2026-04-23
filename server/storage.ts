/**
 * Storage helpers — Cloudflare R2 via S3-compatible API (AWS SDK v3).
 *
 * Required environment variables:
 *   R2_ACCOUNT_ID        — Cloudflare account ID
 *   R2_ACCESS_KEY_ID     — R2 API token Access Key ID
 *   R2_SECRET_ACCESS_KEY — R2 API token Secret Access Key
 *   R2_BUCKET_NAME       — R2 bucket name (default: amped-agent-storage)
 *   R2_PUBLIC_URL        — Optional custom public URL for the bucket (if public access enabled)
 *
 * Files are uploaded to R2 and served via presigned GET URLs (1-hour expiry).
 * Falls back to Manus forge proxy if R2 env vars are not set (for local dev).
 */

import { ENV } from './_core/env';

// ─── R2 config ───────────────────────────────────────────────────────────────

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME || 'amped-agent-storage';
  const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null; // fall back to forge proxy
  }

  const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  return { accountId, accessKeyId, secretAccessKey, bucket, endpoint, publicUrl };
}

// ─── Shared S3Client factory ──────────────────────────────────────────────────

async function getS3Client() {
  const cfg = getR2Config();
  if (!cfg) throw new Error('R2 not configured');
  const { S3Client } = await import('@aws-sdk/client-s3');
  return {
    client: new S3Client({
      region: 'auto',
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    }),
    cfg,
  };
}

// ─── R2 upload ────────────────────────────────────────────────────────────────

async function r2Put(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const { client, cfg } = await getS3Client();
  const { PutObjectCommand } = await import('@aws-sdk/client-s3');

  const body = typeof data === 'string' ? Buffer.from(data) : data;

  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  // If a custom public URL is configured, use it directly (fast, no expiry)
  if (cfg.publicUrl) {
    return { key, url: `${cfg.publicUrl}/${key}` };
  }

  // Otherwise generate a presigned GET URL (1 hour expiry)
  const url = await r2PresignedGet(key, 3600);
  return { key, url };
}

// ─── R2 presigned GET URL ─────────────────────────────────────────────────────

async function r2PresignedGet(key: string, expiresInSeconds = 3600): Promise<string> {
  const { client, cfg } = await getS3Client();
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const command = new GetObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

// ─── Forge proxy fallback (Manus local dev) ───────────────────────────────────

type StorageConfig = { baseUrl: string; apiKey: string };

function getForgeConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;
  if (!baseUrl || !apiKey) {
    throw new Error(
      'Storage not configured: set R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY or BUILT_IN_FORGE_API_URL/BUILT_IN_FORGE_API_KEY'
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey };
}

function buildUploadUrl(baseUrl: string, relKey: string): URL {
  const url = new URL('v1/storage/upload', ensureTrailingSlash(baseUrl));
  url.searchParams.set('path', normalizeKey(relKey));
  return url;
}

async function buildDownloadUrl(baseUrl: string, relKey: string, apiKey: string): Promise<string> {
  const downloadApiUrl = new URL('v1/storage/downloadUrl', ensureTrailingSlash(baseUrl));
  downloadApiUrl.searchParams.set('path', normalizeKey(relKey));
  const response = await fetch(downloadApiUrl, { method: 'GET', headers: { Authorization: `Bearer ${apiKey}` } });
  return (await response.json()).url;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, '');
}

function toFormData(data: Buffer | Uint8Array | string, contentType: string, fileName: string): FormData {
  const blob = typeof data === 'string' ? new Blob([data], { type: contentType }) : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append('file', blob, fileName || 'file');
  return form;
}

async function forgePut(relKey: string, data: Buffer | Uint8Array | string, contentType: string): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getForgeConfig();
  const key = normalizeKey(relKey);
  const uploadUrl = buildUploadUrl(baseUrl, key);
  const formData = toFormData(data, contentType, key.split('/').pop() ?? key);
  const response = await fetch(uploadUrl, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body: formData });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Storage upload failed (${response.status} ${response.statusText}): ${message}`);
  }
  const url = (await response.json()).url;
  return { key, url };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Upload a file to storage and return its accessible URL.
 * For R2: returns a presigned GET URL (1-hour expiry) unless a public URL is configured.
 * For Forge: returns the forge download URL.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);

  // Prefer R2 if configured
  if (getR2Config()) {
    return r2Put(key, data, contentType);
  }

  // Fall back to Manus forge proxy
  return forgePut(key, data, contentType);
}

/**
 * Get a readable URL for an existing storage object.
 * For R2: generates a fresh presigned GET URL (1-hour expiry) unless a public URL is configured.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const cfg = getR2Config();

  if (cfg) {
    if (cfg.publicUrl) {
      return { key, url: `${cfg.publicUrl}/${key}` };
    }
    // Generate a presigned GET URL
    const url = await r2PresignedGet(key, 3600);
    return { key, url };
  }

  // Fall back to forge proxy
  const { baseUrl, apiKey } = getForgeConfig();
  return { key, url: await buildDownloadUrl(baseUrl, key, apiKey) };
}
