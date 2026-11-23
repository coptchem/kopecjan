import { getTranslations } from "next-intl/server";
import { site } from "@/lib/site";

/** schema.org Person for the one page. Facts come from messages/*.json (seeded from the CV). */
export async function JsonLd() {
  const hero = await getTranslations("hero");
  const experience = await getTranslations("experience");
  const languages = experience.raw("languages") as string[];

  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: hero("name"),
    jobTitle: hero("eyebrow"),
    url: site.url,
    email: "mailto:" + site.email,
    sameAs: [site.linkedin, site.github],
    address: { "@type": "PostalAddress", addressCountry: "CZ" },
    knowsLanguage: languages,
    image: site.url + "/jan-kopecky.jpg",
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output contains no user input; escape "<" defensively anyway.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
