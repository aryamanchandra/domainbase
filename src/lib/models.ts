export interface Subdomain {
  _id?: string;
  subdomain: string; // e.g., "blog", "shop", "docs"
  title: string;
  description: string;
  content: string; // HTML content or page data
  customCss?: string;
  userId: string; // User who owns this subdomain
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
  email?: string;
  name?: string;
  picture?: string;
  googleId?: string;
  password: string; // hashed (optional for OAuth users)
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface ShortLink {
  _id?: string;
  slug: string; // e.g., "test", "promo"
  targetUrl: string; // Full URL to redirect to
  userId: string; // User who owns this link
  clicks: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
}
