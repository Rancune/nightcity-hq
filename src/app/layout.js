import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/Header';
import RequireAuthMessage from '@/components/RequireAuthMessage';
import PersistentCanvas from './PersistentCanvas';

export const metadata = {
  title: "The Fixer's Grid",
  description: "Fixer contracts handling",
};

const robotoMono = Roboto_Mono({
  //variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ['400', '700']
});

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${robotoMono.className} relative crt-effect`}>
          <PersistentCanvas />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Header />
            <RequireAuthMessage />
            <div className="overflow-y-auto min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
              {children}
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
