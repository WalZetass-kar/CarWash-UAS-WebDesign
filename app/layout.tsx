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
  metadataBase: new URL("https://kilapkendaraan.my.id"),
  title: {
    default: `${APP_NAME} | Premium Car Wash Management`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "car wash",
    "kilapkendaraan",
    "dashboard admin",
    "booking cuci mobil",
    "supabase",
    "next.js",
  ],
  authors: [{ name: "Kilap Kendaraan Team" }],
  creator: "Kilap Kendaraan Team",
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: "https://kilapkendaraan.my.id",
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
    ],
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
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
        <AppProviders>{children}</AppProviders>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CarWash",
              "name": APP_NAME,
              "description": APP_DESCRIPTION,
              "url": "https://kilapkendaraan.my.id",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "Jl. Cuci Kilat No. 88",
                "addressLocality": "Jakarta",
                "addressRegion": "DKI Jakarta",
                "postalCode": "12345",
                "addressCountry": "ID"
              },
              "openingHoursSpecification": {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                "opens": "08:00",
                "closes": "21:00"
              }
            }),
          }}
        />
      </body>
    </html>
  );
}
