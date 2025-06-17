import { Roboto_Mono } from "next/font/google";
import "./globals.css";

const robotoMono = Roboto_Mono({
  //variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ['400', '700']
});



export const metadata = {
  title: "Fixer HQ",
  description: "Fixer contracts handling",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={robotoMono.className}>
        
        {children}
      </body>
    </html>
  );
}
