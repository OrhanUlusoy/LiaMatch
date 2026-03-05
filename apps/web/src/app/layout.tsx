import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { LANG_COOKIE, normalizeLang } from "@/i18n/lang";
import { getMessages } from "@/i18n/getMessages";
import { I18nProvider } from "@/i18n/I18nProvider";
import { AppShell } from "@/components/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "LiaMatch",
    template: "%s | LiaMatch",
  },
  description: "Matcha LIA-studenter och arbetsgivare på ett seriöst sätt",
  openGraph: {
    title: "LiaMatch",
    description: "Matcha LIA-studenter och arbetsgivare på ett seriöst sätt",
    siteName: "LiaMatch",
    type: "website",
    locale: "sv_SE",
  },
  twitter: {
    card: "summary",
    title: "LiaMatch",
    description: "Matcha LIA-studenter och arbetsgivare på ett seriöst sätt",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo-light.png",
    apple: "/logo-light.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get(LANG_COOKIE)?.value);
  const messages = await getMessages(lang);

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <Script src="/theme-init.js" strategy="beforeInteractive" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <I18nProvider lang={lang} messages={messages}>
          <AppShell>{children}</AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
