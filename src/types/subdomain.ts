export interface Subdomain {
  _id: string;
  subdomain: string;
  title: string;
  description: string;
  content: string;
  customCss?: string;
  isActive: boolean;
  metadata?: any;
}

export interface SubdomainData {
  subdomain: string;
  title: string;
  description: string;
  content: string;
  customCss?: string;
  isActive: boolean;
  metadata?: any;
}

