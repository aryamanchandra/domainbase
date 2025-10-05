export interface ShortLink {
  _id: string;
  slug: string;
  targetUrl: string;
  clicks: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    title?: string;
    description?: string;
  };
}

export interface LinkFormData {
  slug: string;
  targetUrl: string;
  title: string;
  description: string;
}

