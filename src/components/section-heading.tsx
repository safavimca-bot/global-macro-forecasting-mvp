export function SectionHeading({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <div className="mb-6">
      {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-signal-cyan">{eyebrow}</p> : null}
      <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h1>
      {copy ? <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{copy}</p> : null}
    </div>
  );
}
