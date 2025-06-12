'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div>Loading...</div>
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
        fontFamily: 'system-ui, -apple-system, sans-serif',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ fontSize: '48px', margin: 0 }}>404</h1>
        <p style={{ fontSize: '20px', color: '#666' }}>{error}</p>
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
          padding: '40px 20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 'bold' }}>
            {data.title}
          </h1>
          {data.description && (
            <p style={{ margin: '20px 0 0', fontSize: '20px', opacity: 0.9 }}>
              {data.description}
            </p>
          )}
        </header>
        
        <main style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: '1.6'
        }}>
          <div dangerouslySetInnerHTML={{ __html: data.content }} />
        </main>

        <footer style={{
          padding: '20px',
          textAlign: 'center',
          borderTop: '1px solid #eee',
          color: '#666',
          fontSize: '14px'
        }}>
          <p>Powered by Subdomain Creator</p>
        </footer>
      </div>
    </>
  );
}

