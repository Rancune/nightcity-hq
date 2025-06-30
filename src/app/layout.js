import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import RequireAuthMessage from '@/components/RequireAuthMessage';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "The Fixer's Grid",
  description: 'Fixer contracts handling',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Header />
            <RequireAuthMessage />
          </div>
          <div className="overflow-y-auto min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
