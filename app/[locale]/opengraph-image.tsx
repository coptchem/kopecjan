import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTranslations } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import { site } from "@/lib/site";

export const alt = "Jan Kopecký";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = { params: Promise<{ locale: string }> };

/** OG image: name, title and photo on the light --bg, no gradients (docs/03). */
export default async function OpenGraphImage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "hero" });
  const photo = await readFile(path.join(process.cwd(), "public", "jan-kopecky.jpg"));
  const photoSrc = "data:image/jpeg;base64," + photo.toString("base64");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "80px 96px",
        background: "#FFFFFF",
        color: "#1A2129",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 700 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700 }}
        >
          <div style={{ width: 18, height: 18, borderRadius: 5, background: "#1F5F8B" }} />
          {site.domain}
        </div>
        <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          {t("name")}
        </div>
        <div style={{ fontSize: 34, color: "#1F5F8B", fontWeight: 600 }}>{t("eyebrow")}</div>
        <div style={{ fontSize: 26, color: "#5A6675" }}>{t("location")}</div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoSrc}
        alt=""
        width={320}
        height={320}
        style={{
          width: 320,
          height: 320,
          borderRadius: 32,
          objectFit: "cover",
          border: "2px solid #E2E7EC",
        }}
      />
    </div>,
    { ...size },
  );
}
