import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import AppProviders from "@/context/AppProviders";

/**
 * Inter carries the Latin UI; Noto Sans Devanagari carries Marathi. Both are
 * self-hosted by next/font (no network request at runtime, no layout shift)
 * and exposed as CSS variables consumed by --font-sans in globals.css.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "MPSC Pulse — Pulse of MPSC",
  description:
    "Your complete MPSC preparation platform: recorded lectures, PDF notes, tests with analysis, XP and leaderboards — in Marathi and English.",
  applicationName: "MPSC Pulse",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "MPSC Pulse",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#5b34e0",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${devanagari.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
