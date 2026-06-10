import type { Metadata, Viewport } from "next";
import { Heebo, Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Physician Drug Search | Drug Finder",
  description: "Israeli prescription drug search, prices, and clinical summaries",
  appleWebApp: {
    capable: true,
    title: "Drug Finder",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#c96442",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body
        className={`${heebo.variable} ${inter.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
