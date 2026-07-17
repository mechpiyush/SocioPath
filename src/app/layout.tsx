import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "SocioPath | Premium Late-Night Social Experience in Mumbai",
  description: "Book exclusive late-night weekend villa retreats in Mumbai. Join Friday Night Jam (music & karaoke) or Saturday Night Social (stranger icebreakers & board games). BYOD-friendly, ₹1,500 all-inclusive.",
  keywords: ["SocioPath", "Mumbai late night", "weekend social", "villa party Mumbai", "karaoke Mumbai", "stranger meetups", "networking Mumbai", "Piyush Sharma"],
  authors: [{ name: "Piyush Sharma" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Scripts for Google OAuth and Razorpay Payments */}
        <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
