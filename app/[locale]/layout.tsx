import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Analytics } from "@/components/Analytics";
import { ThemeProvider } from "@/components/ThemeProvider";
import { routing } from "@/lib/i18n/routing";
import { site } from "@/lib/site";
import "@/app/globals.css";

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const path = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: path,
      languages: { en: "/", cs: "/cs", "x-default": "/" },
    },
    openGraph: {
      type: "profile",
      url: path,
      title: t("title"),
      description: t("description"),
      siteName: site.domain,
      locale: locale === "cs" ? "cs_CZ" : "en_US",
      alternateLocale: locale === "cs" ? "en_US" : "cs_CZ",
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  // Only the header controls are client components, so only "nav" is shipped to the browser.
  const messages = await getMessages();
  const clientMessages = { nav: messages.nav };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Fonts are self-hosted (app/globals.css). Preload what the first paint needs:
            latin always, latin-ext only for Czech, where the hero already uses those glyphs. */}
        <link
          rel="preload"
          href="/fonts/inter-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {locale === "cs" && (
          <link
            rel="preload"
            href="/fonts/inter-latin-ext.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className="min-h-dvh bg-bg text-text">
        <ThemeProvider>
          <NextIntlClientProvider messages={clientMessages}>{children}</NextIntlClientProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
