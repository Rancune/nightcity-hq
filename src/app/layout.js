import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import Header from '@/components/Header';
import RequireAuthMessage from '@/components/RequireAuthMessage';

const robotoMono = Roboto_Mono({
  //variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ['400', '700']
});

export const metadata = {
  title: "The Fixer's Grid",
  description: "Fixer contracts handling",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body className={`${robotoMono.className} relative crt-effect`}>
        <Header />
        <RequireAuthMessage />
        {children}
      </body>
    </html>
    </ClerkProvider>
  );
}
