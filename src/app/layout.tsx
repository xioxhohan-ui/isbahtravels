import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import QueryProvider from "@/components/providers/query-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Isbah Travels | Flights, Hotels, Tour Packages & Visa Processing Bangladesh",
  description: "Book domestic and international flights, luxury hotel resorts, Umrah packages, customized tours, and hassle-free visa processing in Bangladesh with SSLCommerz payments.",
  keywords: "Isbah Travels, Travel Agency Bangladesh, Flight Booking Dhaka, Cox's Bazar Hotels, Umrah Package Bangladesh, Dubai Visa, SSLCommerz Payment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col font-sans">
        <QueryProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  );
}
