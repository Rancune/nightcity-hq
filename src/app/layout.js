import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';

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
      <body className={robotoMono.className}>
        
        {children}
      </body>
    </html>
    </ClerkProvider>
  );
}
