'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from '@/styles/page.module.css';

interface UserInfo {
  name?: string;
  email?: string;
  picture?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | undefined>(undefined);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

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
      // Check for saved token and user info
      const savedToken = localStorage.getItem('token');
      const savedUserInfo = localStorage.getItem('userInfo');
      
      if (savedToken) {
        setToken(savedToken);
        setIsLoggedIn(true);
        
        if (savedUserInfo) {
          try {
            const parsedUserInfo = JSON.parse(savedUserInfo);
            
            if (parsedUserInfo.picture) {
              const cached = await loadCachedProfilePicture(parsedUserInfo.picture);
              if (cached) {
                setUserInfo({ ...parsedUserInfo, picture: cached });
              } else {
                setUserInfo(parsedUserInfo);
              }
            } else {
              setUserInfo(parsedUserInfo);
            }
          } catch (e) {
            console.error('Failed to parse saved user info:', e);
          }
        }
      } else {
        // No token, redirect to home page
        router.push('/');
      }

      // Check theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.setAttribute('data-theme', 'dark');
      }

      // Check sidebar state
      const savedCollapsed = localStorage.getItem('sidebarCollapsed');
      if (savedCollapsed === 'true') {
        setSidebarCollapsed(true);
        document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
      }

      setLoading(false);
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

  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
    
    if (newState) {
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-sidebar-collapsed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('cachedProfilePic');
    localStorage.removeItem('cachedProfilePicTime');
    setToken('');
    setIsLoggedIn(false);
    setUserInfo(undefined);
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #eaeaea',
          borderTop: '3px solid #000',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className={styles.appLayout}>
      <Sidebar
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
        userInfo={userInfo}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}

