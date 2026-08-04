import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import BottomTabBar from "@/components/layout/BottomTabBar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://contrakr.com"),
  title: "Contrakr — Find & Hire Blue Collar Pros",
  description:
    "Contrakr connects homeowners with trusted local contractors. Post a job, compare bids, and get work done — free for everyone.",
  keywords: "contractors, landscaping, roofing, plumbing, HVAC, electricians, handyman",
  openGraph: {
    title: "Contrakr — Find & Hire Blue Collar Pros",
    description: "The professional marketplace for the blue collar workforce.",
    type: "website",
    url: "https://contrakr.com",
    siteName: "Contrakr",
    images: [{ url: "/icon.png", width: 180, height: 180, alt: "Contrakr" }],
  },
  twitter: {
    card: "summary",
    title: "Contrakr — Find & Hire Blue Collar Pros",
    description: "The professional marketplace for the blue collar workforce.",
    images: ["/icon.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Contrakr",
    // Lets the navy header run under the iOS status bar once installed.
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1628",
  // Keeps content clear of the notch and home indicator in standalone mode.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')!=='light')document.documentElement.classList.add('dark')}catch(e){document.documentElement.classList.add('dark')}})()`,
          }}
        />
      </head>
      {/* Bottom padding clears the mobile tab bar (3.25rem + safe area). */}
      <body className="min-h-full flex flex-col pb-[calc(3.25rem+env(safe-area-inset-bottom))] sm:pb-0">
        {children}
        <BottomTabBar />
        <ServiceWorkerRegistrar />
        <InstallPrompt />
      </body>
    </html>
  );
}
