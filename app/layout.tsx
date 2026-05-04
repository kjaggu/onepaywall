import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnePaywall — Intelligent Paywall Software for Publishers",
  description:
    "Turn every reader into revenue. OnePaywall adapts its paywall strategy in real time — subscriptions, ads, and unlocks — based on each reader's behavior profile. 5-minute setup, any CMS.",
  openGraph: {
    title: "OnePaywall — Intelligent Paywall Software for Publishers",
    description:
      "Turn every reader into revenue. OnePaywall adapts its paywall strategy in real time — subscriptions, ads, and unlocks — based on each reader's behavior profile.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
