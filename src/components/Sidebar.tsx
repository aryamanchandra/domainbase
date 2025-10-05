'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import { 
  Globe, LogOut, Moon, Sun, Search, Shield, BarChart3, 
  Home, Menu, X as CloseIcon, ChevronDown, ChevronLeft, ChevronRight, Link
} from 'lucide-react';
import styles from '@/styles/Sidebar.module.css';
import Image from 'next/image';

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  userInfo?: {
    name?: string;
    email?: string;
    picture?: string;
  };
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ 
  darkMode, 
  onToggleDarkMode, 
  onLogout, 
  userInfo,
  isCollapsed,
  onToggleCollapse
}: Props) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { path: '/subdomains', label: 'Subdomains', icon: Home },
    { path: '/link-shortener', label: 'Link Shortener', icon: Link },
    { path: '/dns-checker', label: 'DNS Checker', icon: Search },
    { path: '/dns-records', label: 'Domain Manager', icon: Shield },
    { path: '/whois', label: 'WHOIS Lookup', icon: Globe },
  ];

  const isActive = (path: string) => {
    if (path === '/subdomains') {
      return pathname === '/subdomains' || pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button 
        className={styles.mobileMenuButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Image src="/logo.png" alt="Domainbase" className={styles.logoIconImage} width={40} height={40} />
            </div>
            {!isCollapsed && <span className={styles.logoText}>Domainbase</span>}
          </div>

          {/* Navigation */}
          <nav className={styles.navigation}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NextLink
                  key={item.path}
                  href={item.path}
                  className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
                </NextLink>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className={styles.spacer}></div>

          {/* Settings */}
          <div className={styles.settings}>
            <button 
              className={styles.settingItem}
              onClick={onToggleDarkMode}
              title={isCollapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : undefined}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              {!isCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
            
            {/* Logout Button */}
            <button 
              className={styles.logoutButton}
              onClick={onLogout}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut size={20} />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>

          {/* User Profile */}
          <div className={styles.userSection}>
            <div className={styles.userProfile}>
              {userInfo?.picture ? (
                <Image 
                  src={userInfo.picture} 
                  alt={userInfo.name || 'User'} 
                  className={styles.userAvatar}
                  width={40}
                  height={40}
                />
              ) : (
                <div className={styles.userAvatarPlaceholder}>
                  {userInfo?.name ? userInfo.name[0].toUpperCase() : 
                   userInfo?.email ? userInfo.email[0].toUpperCase() : 'U'}
                </div>
              )}
              {!isCollapsed && (
                <div className={styles.userInfo}>
                  <div className={styles.userName}>
                    {userInfo?.name || userInfo?.email || 'User'}
                  </div>
                  {userInfo?.email && userInfo?.name && (
                    <div className={styles.userEmail}>
                      {userInfo.email}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collapse Toggle Button */}
            <button 
              className={styles.collapseToggle}
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCollapsed ? 'Expand sidebar' : undefined}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              {!isCollapsed && <span>Collapse</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

