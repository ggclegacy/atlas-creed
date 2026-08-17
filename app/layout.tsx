import type { Metadata, Viewport } from "next";

import { clientEnv } from "@/lib/env/client";

import "./globals.css";

export const metadata: Metadata = {
  title: clientEnv.NEXT_PUBLIC_APP_NAME,
  description: "A persistent personal intelligence system.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#09090d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
