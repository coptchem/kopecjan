import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/Button";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="container-site flex min-h-dvh flex-col items-start justify-center gap-5 py-20">
      <p className="text-[14px] font-semibold tracking-[0.02em] text-accent">404</p>
      <h1 className="text-[40px] leading-[1.05] font-bold tracking-[-0.03em] md:text-[56px]">
        {t("title")}
      </h1>
      <p className="max-w-[600px] text-[19px] leading-[1.55] text-muted">{t("body")}</p>
      <ButtonLink href="/" variant="primary">
        {t("home")}
      </ButtonLink>
    </main>
  );
}
