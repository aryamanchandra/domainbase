import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export const getStatusIcon = (status: string, size: number = 18) => {
  switch (status) {
    case 'found':
    case 'resolved':
      return <CheckCircle size={size} color="#06ffa5" />;
    case 'not_found':
    case 'failed':
      return <XCircle size={size} color="#ff0080" />;
    case 'timeout':
      return <Clock size={size} color="#f5a623" />;
    default:
      return <AlertCircle size={size} color="#f5a623" />;
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'found':
      return 'Found';
    case 'not_found':
      return 'Not Found';
    case 'resolved':
      return 'Resolved';
    case 'failed':
      return 'Failed';
    case 'timeout':
      return 'Timeout';
    default:
      return 'Error';
  }
};

export const getMarkerColor = (status: string): string => {
  switch (status) {
    case 'resolved':
      return '#06ffa5';
    case 'failed':
      return '#ff0080';
    case 'timeout':
      return '#f5a623';
    default:
      return '#666';
  }
};

export const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'] as const;

