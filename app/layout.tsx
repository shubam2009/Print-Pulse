import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Print Pulse",
  description: "CSV-powered QR engagement reports for advertiser campaigns."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
