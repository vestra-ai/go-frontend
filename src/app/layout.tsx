import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Figtree } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";
import { AppFrame } from "@/components/shell/AppFrame";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Go — Group Trip Agent",
  applicationName: "Go",
  manifest: "/manifest.webmanifest",
  icons: { apple: "/pwa/apple-touch-icon.png" },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Go" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F6F7F9",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={figtree.variable}>
      <body>
        <SerwistProvider swUrl="/serwist/sw.js">
          <AppFrame>
            {children}
            <Toaster />
          </AppFrame>
        </SerwistProvider>
      </body>
    </html>
  );
}
