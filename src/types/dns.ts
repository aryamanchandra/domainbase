export interface DNSRecord {
  type: string;
  value: string | string[];
  status: 'found' | 'not_found' | 'error';
}

export interface PropagationServer {
  name: string;
  location: string;
  coordinates: [number, number];
  ip: string;
  provider: string;
}

export interface PropagationResult {
  server: PropagationServer;
  status: 'resolved' | 'failed' | 'timeout';
  records: string[];
  responseTime: number;
  error?: string;
}

export interface PropagationData {
  domain: string;
  timestamp: string;
  statistics: {
    totalServers: number;
    resolved: number;
    failed: number;
    timeout: number;
    propagationPercentage: number;
    avgResponseTime: number;
  };
  results: PropagationResult[];
}

export interface RecordItem {
  record_id: string;
  type: string;
  host: string;
  value: string;
  ttl: string;
  distance?: number;
}

export interface EditingRecord {
  record_id: string;
  type: string;
  host: string;
  value: string;
  ttl: number;
  distance?: number;
}

export interface DomainInfo {
  domain?: string;
  created?: string;
  expires?: string;
  status?: string;
  locked?: string;
  private?: string;
  nameservers?: string[];
}

export interface VerificationRecord {
  _id?: string;
  service: string;
  recordType: string;
  name: string;
  value: string;
  status: string;
  createdAt: Date;
}

