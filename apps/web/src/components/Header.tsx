'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { t } = useTranslation('common');

  useEffect(() => {
    // Check for mock session in localStorage
    const checkMockSession = () => {
      const mockSessionStr = localStorage.getItem('mock_session');
      if (mockSessionStr) {
        try {
          const mockSession = JSON.parse(mockSessionStr);
          setUser(mockSession.user);
        } catch (error) {
          console.error('Error parsing mock session:', error);
          localStorage.removeItem('mock_session');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkMockSession();

    // Add event listener for storage changes (in case mock session is updated in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'mock_session') {
        checkMockSession();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Add a timer to periodically check mock session (every 5 seconds)
    const mockSessionTimer = setInterval(checkMockSession, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(mockSessionTimer);
    };
  }, []);

  const handleLogout = () => {
    try {
      // Clear all user-related data from localStorage
      localStorage.removeItem('mock_session');
      localStorage.removeItem('user');
      localStorage.removeItem('session');
      
      // Clear all user-related data from sessionStorage
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('session');
      
      // Clear all cookies (optional, but ensures complete logout)
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });
      
      // Explicitly set user to null
      setUser(null);
      
      // Redirect to homepage for a clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <header className="bg-[var(--surface)] sticky top-0 z-50 border-b border-[var(--border)] shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="text-2xl font-bold text-[var(--primary)] tracking-tight flex items-center gap-2 transition-all duration-300 hover:scale-105">
            <img 
              src="/logo.svg" 
              alt="Aurora Intelligent Fund" 
              width="32" 
              height="32" 
              className="object-contain transition-all duration-300 hover:rotate-12"
            />
            {t('appName')}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Main navigation items - always visible */}
            <Link href="/" className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium text-sm transition-all duration-300 relative group">
              {t('home')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/funds" className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium text-sm transition-all duration-300 relative group">
              {t('funds')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/insights" className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium text-sm transition-all duration-300 relative group">
              {t('insights')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/about" className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium text-sm transition-all duration-300 relative group">
              {t('about')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="/contact" className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium text-sm transition-all duration-300 relative group">
              {t('contact')}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all duration-300 group-hover:w-full"></span>
            </Link>
           
            
            {/* Divider */}
            <span className="text-[var(--border)] hidden lg:block">|</span>
            
            {/* User-specific buttons */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Logged in state: only show 操作台 and 退出登录 */}
                <Link 
                  href="/user" 
                  className="btn btn-primary btn-md hover:shadow-lg"
                >
                  操作台
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary btn-md hover:shadow-lg"
                >
                  退出登录
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                {/* Logged out state: only show 注册 and 登录 */}
                <Link
                  href="/register"
                  className="btn btn-primary btn-md hover:shadow-lg"
                >
                  注册
                </Link>
                <Link href="/login" className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium text-sm transition-all duration-300 relative group">
                  登录
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </div>
            )}
            
            {/* Divider */}
            <span className="text-[var(--border)] hidden lg:block">|</span>
            
            {/* Language switcher - always visible */}
            <LanguageSwitcher className="ml-2" />
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--border)] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen ? (
                <>
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-[var(--surface)] border-t border-[var(--border)] py-4 px-4 animate-slideDown shadow-lg">
            <div className="space-y-3">
              <Link 
                href="/" 
                className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium py-3 px-4 block rounded-lg hover:bg-[var(--border)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('home')}
              </Link>
              <Link 
                href="/funds" 
                className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium py-3 px-4 block rounded-lg hover:bg-[var(--border)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('funds')}
              </Link>
              <Link 
                href="/insights" 
                className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium py-3 px-4 block rounded-lg hover:bg-[var(--border)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('insights')}
              </Link>
              <Link 
                href="/about" 
                className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium py-3 px-4 block rounded-lg hover:bg-[var(--border)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('about')}
              </Link>
              <Link 
                href="/contact" 
                className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium py-3 px-4 block rounded-lg hover:bg-[var(--border)] transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {t('contact')}
              </Link>
              <div className="px-4 pb-2">
                <LanguageSwitcher />
              </div>
            
            {/* User-specific buttons */}
            {user ? (
              <>
                {/* Logged in state: only show 操作台 and 退出登录 */}
                <Link 
                  href="/user" 
                  className="w-full btn btn-primary btn-md block text-center mb-3 hover:shadow-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  操作台
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full btn btn-secondary btn-md hover:shadow-lg"
                >
                  退出登录
                </button>
              </>
            ) : (
              <>
                {/* Logged out state: only show 注册 and 登录 */}
                <Link
                  href="/register"
                  className="w-full btn btn-primary btn-md block text-center mb-3 hover:shadow-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  注册
                </Link>
                <Link 
                  href="/login" 
                  className="text-[var(--text-primary)] hover:text-[var(--primary)] font-medium py-3 px-4 block rounded-lg hover:bg-[var(--border)] transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  登录
                </Link>
              </>
            )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}