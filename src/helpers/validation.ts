export const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9-_]+$/.test(slug);
};

export const isValidDomain = (domain: string): boolean => {
  return /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i.test(domain);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

