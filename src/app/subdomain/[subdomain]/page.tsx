'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Globe } from 'lucide-react';

interface SubdomainData {
  subdomain: string;
  title: string;
  description: string;
  content: string;
  customCss?: string;
  isActive: boolean;
  metadata?: any;
}

export default function SubdomainPage() {
  const params = useParams();
  const subdomain = params.subdomain as string;
  const [data, setData] = useState<SubdomainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSubdomainData() {
      try {
        const response = await fetch(`/api/subdomains/${subdomain}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Subdomain not found');
          } else {
            setError('Failed to load subdomain');
          }
          return;
        }

        const result = await response.json();
        
        if (!result.subdomain.isActive) {
          setError('This subdomain is currently inactive');
          return;
        }
        
        setData(result.subdomain);
        
        // Track page view for analytics
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subdomain,
            path: window.location.pathname,
          }),
        }).catch(err => console.error('Analytics tracking failed:', err));
        
      } catch (err) {
        setError('Failed to load subdomain');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubdomainData();
  }, [subdomain]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#fafafa'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #eaeaea',
            borderTop: '3px solid #000',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          ` }} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        flexDirection: 'column',
        gap: '24px',
        background: '#fafafa',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #eaeaea',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          maxWidth: '480px'
        }}>
          <div style={{ marginBottom: '16px', color: '#666' }}>
            <Globe size={48} strokeWidth={1.5} />
          </div>
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: '600',
            margin: '0 0 16px',
            color: '#000',
            letterSpacing: '-0.02em'
          }}>404</h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#666',
            margin: '0'
          }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {data.customCss && (
        <style dangerouslySetInnerHTML={{ __html: data.customCss }} />
      )}
      <div className="subdomain-container">
        <header style={{
          padding: '60px 20px',
          background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
          borderBottom: '1px solid #eaeaea',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <h1 style={{ 
              margin: 0, 
              fontSize: '48px', 
              fontWeight: '700',
              color: '#000',
              letterSpacing: '-0.02em',
              lineHeight: '1.1'
            }}>
              {data.title}
            </h1>
            {data.description && (
              <p style={{ 
                margin: '20px 0 0', 
                fontSize: '20px',
                color: '#666',
                lineHeight: '1.6'
              }}>
                {data.description}
              </p>
            )}
          </div>
        </header>
        
        <main style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '60px 20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: '1.7',
          color: '#333'
        }}>
          <div 
            className="subdomain-content"
            dangerouslySetInnerHTML={{ __html: data.content }} 
          />
        </main>

        <footer style={{
          padding: '40px 20px',
          textAlign: 'center',
          borderTop: '1px solid #eaeaea',
          background: '#fafafa'
        }}>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#999'
          }}>
            Powered by Subdomain Creator
          </p>
        </footer>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .subdomain-content h2 {
          font-size: 32px;
          font-weight: 600;
          color: #000;
          margin: 40px 0 16px;
          letter-spacing: -0.01em;
        }

        .subdomain-content h3 {
          font-size: 24px;
          font-weight: 600;
          color: #000;
          margin: 32px 0 12px;
          letter-spacing: -0.01em;
        }

        .subdomain-content p {
          margin: 16px 0;
          font-size: 16px;
          line-height: 1.7;
          color: #333;
        }

        .subdomain-content a {
          color: #0070f3;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s ease;
        }

        .subdomain-content a:hover {
          border-bottom-color: #0070f3;
        }

        .subdomain-content ul,
        .subdomain-content ol {
          margin: 16px 0;
          padding-left: 24px;
        }

        .subdomain-content li {
          margin: 8px 0;
          line-height: 1.7;
        }

        .subdomain-content code {
          background: #f5f5f5;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
          font-size: 0.9em;
          color: #e11d48;
        }

        .subdomain-content pre {
          background: #000;
          color: #fff;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          margin: 24px 0;
        }

        .subdomain-content pre code {
          background: none;
          color: inherit;
          padding: 0;
        }

        .subdomain-content blockquote {
          border-left: 3px solid #eaeaea;
          padding-left: 20px;
          margin: 24px 0;
          color: #666;
          font-style: italic;
        }

        .subdomain-content img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 24px 0;
        }
      ` }} />
    </>
  );
}
