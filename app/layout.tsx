import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cleanride.my.id"),
  title: {
    default: `${APP_NAME} | Premium Car Wash Management`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "car wash",
    "cleanride",
    "dashboard admin",
    "booking cuci mobil",
    "supabase",
    "next.js",
  ],
  authors: [{ name: "CleanRide Team" }],
  creator: "CleanRide Team",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: "https://cleanride.my.id",
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
