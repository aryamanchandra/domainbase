import crypto from 'crypto';
import https from 'https';

const NAMESILO_API_KEY = process.env.NAMESILO_API_KEY!;
const NAMESILO_API_BASE = process.env.NAMESILO_API_BASE || 'https://www.namesilo.com/api';
const NAMESILO_DOMAIN = process.env.NAMESILO_DOMAIN!;

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

  // Ensure no double slashes in URL
  const baseUrl = NAMESILO_API_BASE.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const url = `${baseUrl}/${cleanEndpoint}?${buildQuery(params)}`;
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

// Server-side cache for domain info and DNS records
let domainInfoCache: { data: any; timestamp: number } | null = null;
const DOMAIN_INFO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours (domain info changes rarely)

let dnsRecordsCache: { data: NameSiloDnsRecord[]; timestamp: number } | null = null;
const DNS_RECORDS_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours (DNS records are manual changes)

export async function listDnsRecords(skipCache = false): Promise<NameSiloDnsRecord[]> {
  if (!skipCache && dnsRecordsCache) {
    const age = Date.now() - dnsRecordsCache.timestamp;
    if (age < DNS_RECORDS_CACHE_TTL) {
      return dnsRecordsCache.data;
    }
  }
  const data = await callApi<any>('dnsListRecords', { domain: NAMESILO_DOMAIN });
  const reply = data?.namesilo?.reply ?? data?.reply;
  const rr = reply?.resource_record;
  if (!rr) return [];
  const arr: any[] = Array.isArray(rr) ? rr : [rr];
  const records = arr.map((r: any) => ({
    record_id: String(r.record_id),
    type: String(r.type),
    host: String(r.host),
    value: String(r.value),
    ttl: String(r.ttl),
  }));
  dnsRecordsCache = { data: records, timestamp: Date.now() };
  return records;
}

export async function addDnsRecord(
  type: string,
  host: string,
  value: string,
  ttl: number = 3600,
  distance?: number
) {
  const params: Record<string, string | number | undefined> = {
    domain: NAMESILO_DOMAIN,
    rrtype: type,
    rrhost: host,
    rrvalue: value,
    rrttl: ttl,
  };
  
  // MX records require distance (priority)
  if (type === 'MX' && distance !== undefined) {
    params.rrdistance = distance;
  }
  const res = await callApi('dnsAddRecord', params);
  // Invalidate cache after mutation
  dnsRecordsCache = null;
  return res;
}

export async function updateDnsRecord(
  recordId: string,
  host: string,
  value: string,
  ttl: number = 3600,
  distance?: number
) {
  const params: Record<string, string | number | undefined> = {
    domain: NAMESILO_DOMAIN,
    rrid: recordId,
    rrhost: host,
    rrvalue: value,
    rrttl: ttl,
  };
  
  if (distance !== undefined) {
    params.rrdistance = distance;
  }
  const res = await callApi('dnsUpdateRecord', params);
  dnsRecordsCache = null;
  return res;
}

export async function deleteRecord(recordId: string) {
  const res = await callApi('dnsDeleteRecord', {
    domain: NAMESILO_DOMAIN,
    rrid: recordId,
  });
  dnsRecordsCache = null;
  return res;
}

// Fetch domain information (creation, expiry, status, nameservers, contacts) with caching
export async function getDomainInfo(domain?: string, skipCache = false): Promise<any> {
  const targetDomain = domain || NAMESILO_DOMAIN;
  if (!domain && !skipCache && domainInfoCache) {
    const age = Date.now() - domainInfoCache.timestamp;
    if (age < DOMAIN_INFO_CACHE_TTL) {
      return domainInfoCache.data;
    }
  }
  const data = await callApi<any>('getDomainInfo', { domain: targetDomain });
  const reply = (data as any)?.namesilo?.reply ?? (data as any)?.reply ?? {};

  // Normalize nameservers to a simple string array
  const rawNs = reply?.nameservers;
  let nameservers: string[] = [];
  if (Array.isArray(rawNs)) {
    // Could be array of strings or array of objects { nameserver, position }
    nameservers = rawNs.map((ns: any) => (typeof ns === 'string' ? ns : ns?.nameserver)).filter(Boolean);
  } else if (rawNs && typeof rawNs === 'object') {
    // Some responses return an object with array under nameservers
    const arr = (rawNs as any);
    if (Array.isArray(arr)) {
      nameservers = arr.map((ns: any) => (typeof ns === 'string' ? ns : ns?.nameserver)).filter(Boolean);
    } else if (Array.isArray(arr?.nameserver)) {
      nameservers = arr.nameserver.map((ns: any) => (typeof ns === 'string' ? ns : ns?.nameserver)).filter(Boolean);
    }
  }

  const normalized = {
    domain: targetDomain,
    code: Number(reply?.code ?? 0),
    detail: String(reply?.detail ?? ''),
    created: reply?.created,
    expires: reply?.expires,
    status: reply?.status,
    locked: reply?.locked,
    private: reply?.private,
    auto_renew: reply?.auto_renew,
    traffic_type: reply?.traffic_type,
    email_verification_required: reply?.email_verification_required,
    portfolio: reply?.portfolio,
    forward_url: reply?.forward_url,
    forward_type: reply?.forward_type,
    nameservers,
    contact_ids: reply?.contact_ids,
  };
  if (!domain) {
    domainInfoCache = { data: normalized, timestamp: Date.now() };
  }
  return normalized;
}

// For compatibility with existing code that expects a WHOIS function
export async function getWhoisInfo(domain?: string): Promise<any> {
  return getDomainInfo(domain);
}

// Change nameservers
export async function changeNameServers(nameservers: string[], domain?: string) {
  const targetDomain = domain || NAMESILO_DOMAIN;
  const params: Record<string, string | number | undefined> = { domain: targetDomain };
  nameservers.forEach((ns, idx) => {
    const key = `ns${idx + 1}` as const;
    (params as any)[key] = ns;
  });
  const res = await callApi('changeNameServers', params);
  // Invalidate caches after change
  dnsRecordsCache = null;
  domainInfoCache = null;
  return res;
}

// Expose manual cache clear if needed
export function clearDnsCache() {
  dnsRecordsCache = null;
}
