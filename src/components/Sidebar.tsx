'use client';

import { useState } from 'react';
import { 
  Globe, LogOut, Moon, Sun, Search, Shield, BarChart3, 
  Home, Menu, X as CloseIcon, ChevronDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface Props {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  currentView: 'subdomains' | 'dns' | 'details';
  onNavigate: (view: 'subdomains' | 'dns' | 'details') => void;
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
  currentView,
  onNavigate,
  userInfo,
  isCollapsed,
  onToggleCollapse
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigationItems = [
    { id: 'subdomains' as const, label: 'Subdomains', icon: Home },
    { id: 'dns' as const, label: 'DNS Checker', icon: Search },
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
      <div className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarContent}>
          {/* Collapse Toggle Button */}
          <button 
            className={styles.collapseToggle}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          {/* Logo */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Globe size={24} strokeWidth={2.5} />
            </div>
            {!isCollapsed && <span className={styles.logoText}>Subdomain Manager</span>}
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
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span>{item.label}</span>}
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
              title={isCollapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : undefined}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              {!isCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
            </button>
          </div>

          {/* User Profile */}
          <div className={styles.userSection}>
            <div className={styles.userProfile}>
              {userInfo?.picture ? (
                <img 
                  src={userInfo.picture} 
                  alt={userInfo.name || 'User'} 
                  className={styles.userAvatar}
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

            <button 
              className={styles.logoutButton}
              onClick={onLogout}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut size={20} />
              {!isCollapsed && <span>Logout</span>}
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

