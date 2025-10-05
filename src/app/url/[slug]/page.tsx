'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ShortLinkRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    async function redirect() {
      try {
        const response = await fetch(`/api/links/redirect/${slug}`);
        
        if (!response.ok) {
          router.push('/404');
          return;
        }

        const data = await response.json();
        
        // Redirect to target URL
        window.location.href = data.targetUrl;
      } catch (error) {
        console.error('Redirect error:', error);
        router.push('/404');
      }
    }

    redirect();
  }, [slug, router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #eaeaea',
          borderTop: '3px solid #000',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#666', fontSize: '14px' }}>Redirecting...</p>
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

