import type { Metadata, Viewport } from "next";
import { Work_Sans } from "next/font/google";
import Image from "next/image";

import { BRAND, BRAND_URL } from "@/lib/config";
import { QUESTION_COUNT_WORD } from "@/lib/questions";

import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: `AI Readiness Roadmap | ${BRAND}`,
  description: `${QUESTION_COUNT_WORD.charAt(0).toUpperCase() + QUESTION_COUNT_WORD.slice(1)} short questions about how your business operates. Get your place on the five step AI readiness roadmap and the next things to do. Nothing to download.`,
  robots: { index: true, follow: true },
  openGraph: {
    title: `AI Readiness Roadmap | ${BRAND}`,
    description: "Where does your business stand with AI right now? Find out in two minutes.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `AI Readiness Roadmap | ${BRAND}`,
    description: "Where does your business stand with AI right now? Find out in two minutes.",
  },
  icons: {
    icon: [{ url: "/arena-icon.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/arena-icon.png", sizes: "192x192" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={workSans.variable}>
      <body>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-[var(--rule)] bg-[var(--paper)]">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 sm:py-4">
              <a href={BRAND_URL} className="shrink-0" aria-label={BRAND}>
                <Image
                  src="/arena-logo.png"
                  alt={BRAND}
                  width={500}
                  height={157}
                  priority
                  className="h-8 w-auto sm:h-10"
                />
              </a>
              <span className="hidden text-[0.8125rem] font-medium text-[var(--ink-faint)] sm:block">
                Clarity, confidence and control on your AI journey
              </span>
            </div>
          </header>

          <main className="flex-1 px-5 py-8 sm:px-8 sm:py-10">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>

          <footer className="mt-10 border-t border-[var(--rule)] px-5 py-6 sm:px-8">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-[0.8125rem] text-[var(--ink-faint)]">
              <span>© {new Date().getFullYear()} {BRAND}</span>
              <a
                href={BRAND_URL}
                className="font-medium text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--ink)] hover:underline"
              >
                arenastrategic.ai
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
