import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Initialize monitoring service
import '@/lib/monitor';

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: "App Live Tracker - Monitor Your Applications",
  description: "A comprehensive application monitoring system with real-time alerts and health checks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${montserrat.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
