export interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  topPages: Array<{ path: string; views: number }>;
  topReferers: Array<{ referer: string; views: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  viewsByDate: Array<{ date: string; views: number }>;
}

