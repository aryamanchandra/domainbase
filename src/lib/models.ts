export interface Subdomain {
  _id?: string;
  subdomain: string; // e.g., "blog", "shop", "docs"
  title: string;
  description: string;
  content: string; // HTML content or page data
  customCss?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  metadata?: {
    author?: string;
    tags?: string[];
    [key: string]: any;
  };
}

export interface User {
  _id?: string;
  username: string;
  password: string; // hashed
  role: 'admin' | 'user';
  createdAt: Date;
}

