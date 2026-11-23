import Script from "next/script";
import { site } from "@/lib/site";

/**
 * Privacy-friendly analytics (Plausible or Umami), loaded only when
 * NEXT_PUBLIC_ANALYTICS_URL is set. No cookies, so no banner.
 * Plausible reads data-domain; Umami needs data-website-id in NEXT_PUBLIC_ANALYTICS_SITE_ID.
 */
export function Analytics() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_URL;
  if (!src) return null;
  const websiteId = process.env.NEXT_PUBLIC_ANALYTICS_SITE_ID;

  return (
    <Script
      src={src}
      strategy="afterInteractive"
      data-domain={site.domain}
      {...(websiteId
        ? // Umami: count only the production domain, never localhost or previews.
          { "data-website-id": websiteId, "data-domains": site.domain }
        : {})}
    />
  );
}
