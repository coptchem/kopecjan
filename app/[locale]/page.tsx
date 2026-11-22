import { setRequestLocale } from "next-intl/server";
import { Ask } from "@/components/ask/Ask";
import { Contact } from "@/components/contact/Contact";
import { Experience } from "@/components/experience/Experience";
import { Footer } from "@/components/footer/Footer";
import { Header } from "@/components/header/Header";
import { Hero } from "@/components/hero/Hero";
import { JsonLd } from "@/components/JsonLd";
import { Projects } from "@/components/projects/Projects";
import { Skills } from "@/components/skills/Skills";

type Props = { params: Promise<{ locale: string }> };

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Ask />
        <Projects />
        <Skills />
        <Experience />
        <Contact />
      </main>
      <Footer />
      <JsonLd />
    </>
  );
}
