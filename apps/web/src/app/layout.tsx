import "./globals.css";
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body
        className={`antialiased bg-gray-50`}
      >
          <Header />
          
          {/* Main Content */}
          <main className="min-h-screen">
            {children}
          </main>
          
          <Footer />
      </body>
    </html>
  );
}
