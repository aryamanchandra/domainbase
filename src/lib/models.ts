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

