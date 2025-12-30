import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";

const oswald = Oswald({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  // subsets: ['latin', 'latin-ext'],
  // weight: ['400', '500', '600', '700'],
  // display: 'swap',
  adjustFontFallback: false,
  // Thêm preload để font load nhanh hơn
  preload: true,
  // Variable font giúp render tốt hơn
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "Thoai Son Handbag Factory",
  description: "Thoai Son Handbag Factory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={oswald.variable}>
      <body className={`${oswald.className} font-semibold`}>
        {/* <Navigation /> */}
        {children}
      </body>
    </html>
  );
}
