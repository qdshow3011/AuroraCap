import React from 'react';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Aurora Intelligent Fund',
  description: '极光基金管理有限公司 - 专业的基金管理平台',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div>
          <header>
            <h1>Aurora Fund Management Co., Ltd.</h1>
          </header>
          <main>{children}</main>
          <footer>© {new Date().getFullYear()} Aurora Fund Management Co., Ltd.</footer>
        </div>
      </body>
    </html>
  );
};

export default Layout;