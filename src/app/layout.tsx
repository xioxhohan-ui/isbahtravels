import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import QueryProvider from "@/components/providers/query-provider";

// System font stack — no external font download, no render blocking
// Looks identical to Inter on macOS/iOS (SF Pro), Windows 11 (Segoe UI), Android (Roboto)

export const metadata: Metadata = {
  title: "Isbah Travels | Flights, Hotels, Tour Packages & Visa Processing Bangladesh",
  description: "Book domestic and international flights, luxury hotel resorts, Umrah packages, customized tours, and hassle-free visa processing in Bangladesh with SSLCommerz payments.",
  keywords: "Isbah Travels, Travel Agency Bangladesh, Flight Booking Dhaka, Cox's Bazar Hotels, Umrah Package Bangladesh, Dubai Visa, SSLCommerz Payment",
  other: {
    "theme-color": "#0A192F",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Supabase for faster API calls */}
        <link rel="preconnect" href="https://zeifjodsxezfinwdclqn.supabase.co" />
        <link rel="dns-prefetch" href="https://zeifjodsxezfinwdclqn.supabase.co" />
        {/* Preconnect to Supabase Auth */}
        <link rel="preconnect" href="https://api.resend.com" />
      </head>
      <body className="bg-offwhite text-slate-900 antialiased min-h-screen flex flex-col">
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
