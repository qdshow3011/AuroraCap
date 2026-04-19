'use client';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-[var(--primary-dark)] text-white py-16 border-t border-[var(--primary-light)] transition-all duration-300 hover:bg-[var(--primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 transition-all duration-300 hover:scale-105">
              <img 
                src="/logo.svg" 
                alt="Aurora Intelligent Fund" 
                width="32" 
                height="32" 
                className="object-contain transition-all duration-300 hover:rotate-12"
              />
              {t('appName')}
            </Link>
            <p className="text-gray-300 leading-relaxed max-w-md">
              {t('appDescription')}
            </p>
            <p className="text-gray-300 leading-relaxed max-w-md">
              {t('appSlogan')}
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white transition-all duration-300 hover:text-accent">
              {t('quickLinks')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-300 hover:text-white text-sm transition-all duration-300 relative group"
                >
                  {t('home')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/funds" 
                  className="text-gray-300 hover:text-white text-sm transition-all duration-300 relative group"
                >
                  {t('funds')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/insights" 
                  className="text-gray-300 hover:text-white text-sm transition-all duration-300 relative group"
                >
                  {t('insights')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/about" 
                  className="text-gray-300 hover:text-white text-sm transition-all duration-300 relative group"
                >
                  {t('about')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-white text-sm transition-all duration-300 relative group"
                >
                  {t('contact')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white transition-all duration-300 hover:text-accent">
              {t('legalInfo')}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/terms" 
                  className="text-gray-300 hover:text-white text-sm transition-all duration-300 relative group"
                >
                  {t('terms')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/privacy" 
                  className="text-gray-300 hover:text-white text-sm transition-all duration-300 relative group"
                >
                  {t('privacy')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/user/contracts" 
                  className="text-gray-300 hover:text-white text-sm transition-all duration-300 relative group"
                >
                  合同管理
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white transition-all duration-300 hover:text-accent">
              联系我们
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-gray-300 mr-2">📞</span>
                <span className="text-gray-300 text-sm">400-123-4567</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-300 mr-2">📧</span>
                <span className="text-gray-300 text-sm">service@auroracapital.com</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-300 mr-2">🕒</span>
                <span className="text-gray-300 text-sm">工作日 9:00-18:00</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-[var(--primary-light)] mt-12 pt-8 text-center">
          <p className="text-gray-300 text-sm transition-all duration-300 hover:text-white">
            © {new Date().getFullYear()} {t('appName')}. {t('allRightsReserved')}
          </p>
          <p className="text-gray-400 text-xs mt-2 transition-all duration-300 hover:text-gray-300">
            金融投资有风险，投资需谨慎
          </p>
        </div>
      </div>
    </footer>
  );
}