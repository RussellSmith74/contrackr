import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Contrakr — Find & Hire Blue Collar Pros",
  description:
    "Contrakr connects homeowners with trusted local contractors. Post a job, compare bids, and get work done — free for everyone.",
  keywords: "contractors, landscaping, roofing, plumbing, HVAC, electricians, handyman",
  openGraph: {
    title: "Contrakr — Find & Hire Blue Collar Pros",
    description: "The professional marketplace for the blue collar workforce.",
    type: "website",
  },
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
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
