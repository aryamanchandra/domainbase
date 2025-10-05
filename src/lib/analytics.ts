import { getDb } from './mongodb';

export interface PageView {
  _id?: string;
  subdomain: string;
  path: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  referer?: string;
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export interface AnalyticsSummary {
  totalViews: number;
  uniqueVisitors: number;
  topPages: Array<{ path: string; views: number }>;
  topReferers: Array<{ referer: string; views: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  viewsByDate: Array<{ date: string; views: number }>;
}

export async function trackPageView(data: {
  subdomain: string;
  path: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
}): Promise<void> {
  const db = await getDb();
  
  // Parse user agent for device and browser info
  let device = 'Unknown';
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (data.userAgent) {
    const ua = data.userAgent.toLowerCase();
    
    // Device detection
    if (ua.includes('mobile')) device = 'Mobile';
    else if (ua.includes('tablet')) device = 'Tablet';
    else device = 'Desktop';
    
    // Browser detection
    if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
    else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('edg')) browser = 'Edge';
    
    // OS detection
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  }
  
  const pageView = {
    subdomain: data.subdomain,
    path: data.path,
    timestamp: new Date(),
    ip: data.ip,
    userAgent: data.userAgent,
    referer: data.referer,
    device,
    browser,
    os,
  };
  
  await db.collection('pageviews').insertOne(pageView as any);
}

export async function getAnalytics(
  subdomain: string,
  days: number = 30
): Promise<AnalyticsSummary> {
  const db = await getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const views = await db.collection<PageView>('pageviews')
    .find({
      subdomain,
      timestamp: { $gte: startDate }
    })
    .toArray();
  
  // Total views
  const totalViews = views.length;
  
  // Unique visitors (by IP)
  const uniqueVisitors = new Set(views.map(v => v.ip).filter(Boolean)).size;
  
  // Top pages
  const pageMap = new Map<string, number>();
  views.forEach(v => {
    pageMap.set(v.path, (pageMap.get(v.path) || 0) + 1);
  });
  const topPages = Array.from(pageMap.entries())
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  
  // Top referers
  const refererMap = new Map<string, number>();
  views.forEach(v => {
    if (v.referer && v.referer !== '') {
      refererMap.set(v.referer, (refererMap.get(v.referer) || 0) + 1);
    }
  });
  const topReferers = Array.from(refererMap.entries())
    .map(([referer, views]) => ({ referer, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
  
  // Device breakdown
  const deviceMap = new Map<string, number>();
  views.forEach(v => {
    deviceMap.set(v.device || 'Unknown', (deviceMap.get(v.device || 'Unknown') || 0) + 1);
  });
  const deviceBreakdown = Array.from(deviceMap.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);
  
  // Browser breakdown
  const browserMap = new Map<string, number>();
  views.forEach(v => {
    browserMap.set(v.browser || 'Unknown', (browserMap.get(v.browser || 'Unknown') || 0) + 1);
  });
  const browserBreakdown = Array.from(browserMap.entries())
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count);
  
  // Views by date
  const dateMap = new Map<string, number>();
  views.forEach(v => {
    const date = v.timestamp.toISOString().split('T')[0];
    dateMap.set(date, (dateMap.get(date) || 0) + 1);
  });
  const viewsByDate = Array.from(dateMap.entries())
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalViews,
    uniqueVisitors,
    topPages,
    topReferers,
    deviceBreakdown,
    browserBreakdown,
    viewsByDate,
  };
}

export async function getAllSubdomainsAnalytics(days: number = 30): Promise<Map<string, AnalyticsSummary>> {
  const db = await getDb();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const views = await db.collection<PageView>('pageviews')
    .find({ timestamp: { $gte: startDate } })
    .toArray();
  
  const subdomainMap = new Map<string, PageView[]>();
  views.forEach(v => {
    if (!subdomainMap.has(v.subdomain)) {
      subdomainMap.set(v.subdomain, []);
    }
    subdomainMap.get(v.subdomain)!.push(v);
  });
  
  const analyticsMap = new Map<string, AnalyticsSummary>();
  
  for (const [subdomain] of subdomainMap) {
    const analytics = await getAnalytics(subdomain, days);
    analyticsMap.set(subdomain, analytics);
  }
  
  return analyticsMap;
}

