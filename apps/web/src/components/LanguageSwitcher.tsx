'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from '../i18n/i18n.config';

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className = '' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (language: string) => {
    i18next.changeLanguage(language);
    setCurrentLanguage(language);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleMenu}
        className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors flex items-center justify-center"
        aria-label="Change language"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)]">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" x2="22" y1="12" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${currentLanguage === 'en' ? 'bg-[var(--border)] text-[var(--primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
          >
            English
          </button>
          <button
            onClick={() => handleLanguageChange('zh')}
            className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${currentLanguage === 'zh' ? 'bg-[var(--border)] text-[var(--primary)]' : 'text-[var(--text-primary)] hover:bg-[var(--border)]'}`}
          >
            中文
          </button>
        </div>
      )}
    </div>
  );
}
