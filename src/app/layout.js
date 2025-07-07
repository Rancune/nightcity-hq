import { Source_Code_Pro } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import RequireAuthMessage from '@/components/RequireAuthMessage';
import { ClerkProvider } from '@clerk/nextjs';

const sourceCodePro = Source_Code_Pro({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap'
});

export const metadata = {
  title: "The Fixer's Grid",
  description: 'Fixer contracts handling',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={sourceCodePro.className}>
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
