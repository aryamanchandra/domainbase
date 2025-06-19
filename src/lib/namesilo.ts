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
  query.set('type', 'xml');
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
  const res = await fetch(url, { cache: 'no-store' });
  const text = await res.text();

  // Very small XML parsing without an extra dep; sufficient for NameSilo basics
  // Extract <reply><code> and records under <resource_record>
  const codeMatch = text.match(/<code>(\d+)<\/code>/);
  const code = codeMatch ? parseInt(codeMatch[1], 10) : 0;
  if (code !== 300 && code !== 301 && code !== 200) {
    throw new Error(`NameSilo error code ${code}`);
  }

  // Return raw text to endpoint handlers which can pick what they need
  return text as unknown as T;
}

export async function listDnsRecords(): Promise<NameSiloDnsRecord[]> {
  const xml = await callApi<string>('dnsListRecords', { domain: NAMESILO_DOMAIN });
  const records: NameSiloDnsRecord[] = [];
  const rrRegex = /<resource_record>([\s\S]*?)<\/resource_record>/g;
  let m: RegExpExecArray | null;
  while ((m = rrRegex.exec(xml))) {
    const block = m[1];
    const get = (tag: string) => (block.match(new RegExp(`<${tag}>([\s\S]*?)<\/${tag}>`)) || [])[1] || '';
    records.push({
      record_id: get('record_id'),
      type: get('type'),
      host: get('host'),
      value: get('value'),
      ttl: get('ttl'),
    });
  }
  return records;
}

export async function addTxtRecord(host: string, value: string, ttl: number = 3600) {
  return callApi('dnsAddRecord', {
    domain: NAMESILO_DOMAIN,
    rrtype: 'TXT',
    rrhost: host,
    rrvalue: value,
    rrtll: ttl,
  });
}

export async function deleteRecord(recordId: string) {
  return callApi('dnsDeleteRecord', {
    domain: NAMESILO_DOMAIN,
    rrid: recordId,
  });
}


