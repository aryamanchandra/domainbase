import crypto from 'crypto';
import https from 'https';

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

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function callApi<T = any>(endpoint: string, params: Record<string, string | number | undefined>): Promise<T> {
  if (!NAMESILO_API_KEY) {
    throw new Error('NAMESILO_API_KEY not configured');
  }

  const url = `${NAMESILO_API_BASE}/${endpoint}?${buildQuery(params)}`;
  console.log('[NameSilo] Calling:', url.replace(NAMESILO_API_KEY, 'xxx'));
  
  const text = await httpsGet(url);
  console.log('[NameSilo] Response preview:', text.substring(0, 200));

  if (text.includes('<!DOCTYPE html>') && text.includes('Cloudflare')) {
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
    const seenIp = request?.ip ? ` - Server IP: ${request.ip}` : '';
    const err = new Error(`NameSilo error ${code}: ${reason}${seenIp}`);
    (err as any).serverIp = request?.ip;
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


