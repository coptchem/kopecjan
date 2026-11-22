type Props = { title: string; subtitle: string; id?: string };

export function SectionHeading({ title, subtitle, id }: Props) {
  return (
    <div className="flex max-w-[680px] flex-col gap-2.5">
      <h2
        id={id}
        className="text-[28px] leading-[1.15] font-bold tracking-[-0.02em] md:text-[36px]"
      >
        {title}
      </h2>
      <p className="text-[17px] leading-[1.55] text-muted">{subtitle}</p>
    </div>
  );
}
