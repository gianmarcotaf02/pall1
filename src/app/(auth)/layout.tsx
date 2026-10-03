import { PitchMark } from "@/components/pitch-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[1.05fr_1fr]">
      <section className="hidden flex-col justify-between border-r border-rule p-10 lg:p-14 md:flex">
        <span className="font-display text-[22px] font-bold tracking-[-0.03em] text-ink">
          Pall<span className="text-accent-text">1</span>
        </span>

        <div className="max-w-[26rem] space-y-5">
          <h1 className="text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
            Il calcetto del gruppo, finalmente in ordine.
          </h1>
          <p className="text-[15px] leading-relaxed text-muted">
            Iscrizioni, formazione delle squadre, risultati e classifica. Un solo posto, niente più
            messaggi persi nella chat.
          </p>
          <PitchMark className="mt-2 h-36 w-full text-line-strong" />
        </div>

        <p className="text-xs text-muted">Solo per il nostro gruppo · accesso su invito</p>
      </section>

      <section className="flex min-h-dvh items-center justify-center px-5 py-12 md:min-h-0 md:px-10">
        <div className="w-full max-w-sm">
          <span className="mb-8 block font-display text-[20px] font-bold tracking-[-0.03em] text-ink md:hidden">
            Pall<span className="text-accent-text">1</span>
          </span>
          {children}
        </div>
      </section>
    </div>
  );
}
