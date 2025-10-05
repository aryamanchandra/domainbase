export const calculateDaysUntil = (dateString: string): number => {
  const targetDate = new Date(dateString);
  const now = new Date();
  return Math.floor((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString();
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

