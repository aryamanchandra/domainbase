'use client';

import { useState } from 'react';
import { 
  Globe, LogOut, Moon, Sun, Search, Shield, BarChart3, 
  Home, Menu, X as CloseIcon, ChevronDown
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  currentView: 'subdomains' | 'analytics' | 'dns' | 'verification';
  onNavigate: (view: 'subdomains' | 'analytics' | 'dns' | 'verification') => void;
  userInfo?: {
    name?: string;
    email?: string;
    picture?: string;
  };
}

export default function Sidebar({ 
  darkMode, 
  onToggleDarkMode, 
  onLogout, 
  currentView,
  onNavigate,
  userInfo
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigationItems = [
    { id: 'subdomains' as const, label: 'Subdomains', icon: Home },
    { id: 'dns' as const, label: 'DNS Checker', icon: Search },
    { id: 'verification' as const, label: 'Verification', icon: Shield },
  ];

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
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarContent}>
          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Globe size={24} strokeWidth={2.5} />
            </div>
            <span className={styles.logoText}>Subdomain Manager</span>
          </div>

          {/* Navigation */}
          <nav className={styles.navigation}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${currentView === item.id ? styles.active : ''}`}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsOpen(false);
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
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
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>

          {/* User Profile */}
          {userInfo && (
            <div className={styles.userSection}>
              <button 
                className={styles.userProfile}
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                {userInfo.picture ? (
                  <img 
                    src={userInfo.picture} 
                    alt={userInfo.name || 'User'} 
                    className={styles.userAvatar}
                  />
                ) : (
                  <div className={styles.userAvatarPlaceholder}>
                    {(userInfo.name || userInfo.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className={styles.userInfo}>
                  <div className={styles.userName}>
                    {userInfo.name || 'User'}
                  </div>
                  <div className={styles.userEmail}>
                    {userInfo.email || ''}
                  </div>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`${styles.chevron} ${showUserMenu ? styles.open : ''}`}
                />
              </button>

              {showUserMenu && (
                <div className={styles.userMenu}>
                  <button 
                    className={styles.userMenuItem}
                    onClick={() => {
                      onLogout();
                      setShowUserMenu(false);
                    }}
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
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

