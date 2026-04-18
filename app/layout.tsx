import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "منصة محتوى",
  description: "منصة داخلية لإدارة وتوليد المقالات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${plexArabic.variable} font-sans`}>
        {children}
        <Toaster position="top-center" richColors closeButton dir="rtl" />
      </body>
    </html>
  );
}
