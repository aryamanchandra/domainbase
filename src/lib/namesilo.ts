import crypto from 'crypto';

const NAMESILO_API_KEY = process.env.NAMESILO_API_KEY || '';
const NAMESILO_API_BASE = process.env.NAMESILO_API_BASE || 'https://www.namesilo.com/api';
const NAMESILO_DOMAIN = process.env.NAMESILO_DOMAIN || 'aryamanchandra.com';

export interface NameSiloDnsRecord {
  record_id: string;
  type: string;
  host: string;
  value: string;
  ttl: string;
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  query.set('version', '1');
  query.set('type', 'json');
  query.set('key', NAMESILO_API_KEY);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined) query.set(k, String(v));
  });
  return query.toString();
}

async function callApi<T = any>(endpoint: string, params: Record<string, string | number | undefined>): Promise<T> {
  if (!NAMESILO_API_KEY) {
    throw new Error('NAMESILO_API_KEY not configured');
  }

  const url = `${NAMESILO_API_BASE}/${endpoint}?${buildQuery(params)}`;
  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/xml, text/xml;q=0.9, */*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  const text = await res.text();

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/html') && text.includes('Cloudflare')) {
    const err = new Error('Blocked by Cloudflare (HTML challenge page returned). Consider allowlisting server IP or try again later.');
    (err as any).responseBody = text;
    throw err;
  }

  // Parse minimal fields from XML response
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {}

  // JSON responses are typically { request: {...}, reply: {...} }
  const reply = parsed?.namesilo?.reply ?? parsed?.reply ?? null;
  const request = parsed?.namesilo?.request ?? parsed?.request ?? null;
  const code = Number(reply?.code || 0);
  const detail = String(reply?.detail || '').trim();

  // Success codes: 200 OK (general) / 300 success / 301 success with warnings
  if (![200, 300, 301].includes(code)) {
    const reason = detail || 'Unknown error';
    const seenIp = request?.ip ? ` (request.ip: ${request.ip})` : '';
    const err = new Error(`NameSilo error ${code}: ${reason}${seenIp}`);
    (err as any).responseBody = text;
    throw err;
  }

  return parsed as T;
}

export async function listDnsRecords(): Promise<NameSiloDnsRecord[]> {
  const data = await callApi<any>('dnsListRecords', { domain: NAMESILO_DOMAIN });
  const reply = data?.namesilo?.reply ?? data?.reply;
  const rr = reply?.resource_record;
  if (!rr) return [];
  const arr: any[] = Array.isArray(rr) ? rr : [rr];
  return arr.map((r: any) => ({
    record_id: String(r.record_id),
    type: String(r.type),
    host: String(r.host),
    value: String(r.value),
    ttl: String(r.ttl),
  }));
}

export async function addTxtRecord(host: string, value: string, ttl: number = 3600) {
  return callApi('dnsAddRecord', {
    domain: NAMESILO_DOMAIN,
    rrtype: 'TXT',
    rrhost: host,
    rrvalue: value,
    rrttl: ttl,
  });
}

export async function deleteRecord(recordId: string) {
  return callApi('dnsDeleteRecord', {
    domain: NAMESILO_DOMAIN,
    rrid: recordId,
  });
}


