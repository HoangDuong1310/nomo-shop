import { executeQuery } from './db';

export interface QrRedirect {
  id: number;
  slug: string;
  target_url: string;
  is_active: number; // 1 or 0
  hit_count: number;
  last_hit_at?: string;
  updated_at?: string;
  updated_by?: string;
  created_at?: string;
}

// Simple in-memory cache
const cache: Record<string, { data: QrRedirect; ts: number }> = {};
const TTL = 60 * 1000; // 60s

export async function getRedirectBySlug(slug: string, useCache = true): Promise<QrRedirect | null> {
  const key = slug.toLowerCase();
  if (useCache && cache[key] && Date.now() - cache[key].ts < TTL) {
    return cache[key].data;
  }
  const rows = await executeQuery({
    query: 'SELECT * FROM qr_redirects WHERE slug = ? LIMIT 1',
    values: [key]
  }) as any[];
  if (!rows.length) return null;
  cache[key] = { data: rows[0], ts: Date.now() };
  return rows[0];
}

export async function listRedirects(): Promise<QrRedirect[]> {
  const rows = await executeQuery({ query: 'SELECT * FROM qr_redirects ORDER BY slug ASC' }) as any[];
  return rows as QrRedirect[];
}

export async function createOrUpdateRedirect(slug: string, targetUrl: string, isActive = true, updatedBy?: string) {
  const lower = slug.toLowerCase();
  // Basic validation
  if (!/^[-a-z0-9_]+$/.test(lower)) throw new Error('Slug không hợp lệ (chỉ a-z, 0-9, -, _)');
  let url: URL;
  try { url = new URL(targetUrl); } catch { throw new Error('URL đích không hợp lệ'); }
  if (url.hostname === 'localhost') throw new Error('Không dùng localhost trong target_url');

  await executeQuery({
    query: `INSERT INTO qr_redirects (slug, target_url, is_active, updated_by) VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE target_url=VALUES(target_url), is_active=VALUES(is_active), updated_by=VALUES(updated_by), updated_at=NOW()` ,
    values: [lower, targetUrl, isActive ? 1 : 0, updatedBy || null]
  });
  // Invalidate cache
  delete cache[lower];
  return getRedirectBySlug(lower, false);
}

export async function incrementHit(id: number) {
  await executeQuery({
    query: 'UPDATE qr_redirects SET hit_count = hit_count + 1, last_hit_at = NOW() WHERE id = ?',
    values: [id]
  });
}

export async function deactivateRedirect(slug: string) {
  await executeQuery({
    query: 'UPDATE qr_redirects SET is_active = 0 WHERE slug = ?',
    values: [slug]
  });
  delete cache[slug.toLowerCase()];
}
