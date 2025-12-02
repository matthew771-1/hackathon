import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DAO AI Agent",
  description: "AI-powered governance delegation for Solana DAOs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


