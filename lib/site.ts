export const site = {
  name: "Jan Kopecký",
  domain: "kopecjan.cz",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://kopecjan.cz",
  email: "info@kopecjan.cz",
  linkedin: "https://linkedin.com/in/kopecjan",
  github: "https://github.com/coptchem",
  cv: {
    en: "/cv/Jan_Kopecky_CV.pdf",
    cs: "/cv/Jan_Kopecky_CV_CZ.pdf",
  },
} as const;
