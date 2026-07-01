import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adarsh Singh Gaur | Graphics & Web Designer Portfolio",
  description:
    "Portfolio of Adarsh Singh Gaur — Graphics & Web Designer with 5+ years of experience in Adobe Creative Suite, UI/UX, and web development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
