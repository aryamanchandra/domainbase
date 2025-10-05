'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { XCircle, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import styles from '@/styles/page.module.css';

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const PROFILE_PIC_CACHE_KEY = 'cachedProfilePic';
    const PROFILE_PIC_CACHE_TIME_KEY = 'cachedProfilePicTime';
    const PROFILE_PIC_CACHE_TTL = 90 * 24 * 60 * 60 * 1000; // 90 days

    async function cacheProfilePicture(url: string) {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          localStorage.setItem(PROFILE_PIC_CACHE_KEY, base64);
          localStorage.setItem(PROFILE_PIC_CACHE_TIME_KEY, String(Date.now()));
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error('Failed to cache profile picture:', e);
      }
    }

    async function loadCachedProfilePicture(originalUrl?: string): Promise<string | null> {
      const cached = localStorage.getItem(PROFILE_PIC_CACHE_KEY);
      const cachedTime = localStorage.getItem(PROFILE_PIC_CACHE_TIME_KEY);
      
      if (cached && cachedTime) {
        const age = Date.now() - parseInt(cachedTime, 10);
        if (age < PROFILE_PIC_CACHE_TTL) {
          return cached;
        }
      }
      
      if (originalUrl) {
        cacheProfilePicture(originalUrl);
      }
      
      return null;
    }

    (async () => {
      // Check for token in URL (from OAuth callback)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      const urlError = urlParams.get('error');
      const urlUserInfo = urlParams.get('userInfo');
      
      if (urlError) {
        setError('Authentication failed. Please try again.');
        window.history.replaceState({}, '', '/');
      }
      
      if (urlToken) {
        localStorage.setItem('token', urlToken);
        
        if (urlUserInfo) {
          try {
            const parsedUserInfo = JSON.parse(decodeURIComponent(urlUserInfo));
            localStorage.setItem('userInfo', JSON.stringify(parsedUserInfo));
            
            // Cache profile picture
            if (parsedUserInfo.picture) {
              await loadCachedProfilePicture(parsedUserInfo.picture);
            }
          } catch (e) {
            console.error('Failed to parse user info:', e);
          }
        }
        
        // Redirect to subdomains page
        router.push('/subdomains');
        return;
      }

      // Check for saved token
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        // Already logged in, redirect to subdomains
        router.push('/subdomains');
        return;
      }

      // Check theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    })();
  }, [router]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    if (newMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError('Google OAuth is not configured. Please add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your environment variables.');
      return;
    }

    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    const scope = 'openid email profile';
    const responseType = 'code';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=${responseType}&` +
      `scope=${encodeURIComponent(scope)}`;
    
    window.location.href = authUrl;
  };

  return (
    <div className={styles.loginContainer}>
      <button onClick={toggleDarkMode} className={styles.themeToggle} aria-label="Toggle theme">
        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      
      <div className={styles.loginWrapper}>
        <div className={styles.loginHeader}>
          <div className={styles.logoContainer}>
            <Image src="/logo.png" alt="Domainbase" width={48} height={48} className={styles.loginLogo} />
          </div>
          <h1 className={styles.loginTitle}>Welcome back</h1>
          <p className={styles.loginSubtitle}>Sign in with your Google account to manage subdomains</p>
        </div>

        <div className={styles.loginCard}>
          {error && (
            <div className={styles.errorAlert}>
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button onClick={handleGoogleLogin} className={styles.googleButton} disabled={loading}>
            {loading ? (
              <span className={styles.buttonLoader}>Connecting...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.20443C17.64 8.56625 17.5827 7.95262 17.4764 7.36353H9V10.8449H13.8436C13.635 11.9699 13.0009 12.9231 12.0477 13.5613V15.8194H14.9564C16.6582 14.2526 17.64 11.9453 17.64 9.20443Z" fill="#4285F4"/>
                  <path d="M8.99976 18C11.4298 18 13.467 17.1941 14.9561 15.8195L12.0475 13.5613C11.2416 14.1013 10.2107 14.4204 8.99976 14.4204C6.65567 14.4204 4.67158 12.8372 3.96385 10.71H0.957031V13.0418C2.43794 15.9831 5.48158 18 8.99976 18Z" fill="#34A853"/>
                  <path d="M3.96409 10.7098C3.78409 10.1698 3.68182 9.59301 3.68182 8.99983C3.68182 8.40665 3.78409 7.82983 3.96409 7.28983V4.95801H0.957273C0.347727 6.17301 0 7.54755 0 8.99983C0 10.4521 0.347727 11.8267 0.957273 13.0417L3.96409 10.7098Z" fill="#FBBC05"/>
                  <path d="M8.99976 3.57955C10.3211 3.57955 11.5075 4.03364 12.4402 4.92545L15.0216 2.34409C13.4629 0.891818 11.4257 0 8.99976 0C5.48158 0 2.43794 2.01682 0.957031 4.95818L3.96385 7.29C4.67158 5.16273 6.65567 3.57955 8.99976 3.57955Z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        <p className={styles.loginFooter}>
          Secured by Google OAuth 2.0
        </p>
      </div>
    </div>
  );
}
