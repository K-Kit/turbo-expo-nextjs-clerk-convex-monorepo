import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ConvexClientProvider from "./ConvexClientProvider";
import "./globals.css";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WorkSafe Maps",
  description: "Multi-tenant geofencing application for worksite management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="WorkSafe Maps" />
        <meta name="author" content="WorkSafe Maps" />
        <meta
          name="keywords"
          content="WorkSafe Maps, worksite management, geofencing, safety, construction"
        />
      </head>
      <body className={inter.className}>
        <ConvexClientProvider><Suspense>{children}</Suspense></ConvexClientProvider>
      </body>
    </html>
  );
}
