'use client';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-[var(--primary-dark)] text-white py-16 border-t border-[var(--primary-light)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {t('appName')}
            </h3>
            <p className="text-gray-300 leading-relaxed max-w-md">
              {t('appDescription')}
            </p>
            <p className="text-gray-300 leading-relaxed max-w-md">
              {t('appSlogan')}
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {t('quickLinks')}
            </h4>
            <ul className="space-y-3">

              <li>
                <Link 
                  href="/about" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  {t('contact')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">
              {t('legalInfo')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[var(--primary-light)] mt-12 pt-8 text-center">
          <p className="text-gray-300 text-sm">
            © {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
}