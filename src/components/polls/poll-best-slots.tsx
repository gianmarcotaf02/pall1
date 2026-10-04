import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBall, IconPodium } from "@/components/icons";
import { bestPollSlots } from "@/lib/poll-best-slots";
import type { PollDetail } from "@/types/domain";

/**
 * Grafico a barre orizzontali con le tre fasce (giorno + orario) più votate.
 * Il calcolo è in `@/lib/poll-best-slots`: incrocia chi ha votato il giorno con
 * chi ha votato quell'orario.
 *
 * - sondaggio concluso → risultato definitivo;
 * - sondaggio senza scadenza e ancora aperto → anteprima che si aggiorna a ogni voto.
 */
export function PollBestSlots({
  poll,
  matchCreatePath = null,
}: {
  poll: PollDetail;
  /** Base per creare la partita dalla fascia migliore (admin o organizzatore). */
  matchCreatePath?: string | null;
}) {
  const slots = bestPollSlots(poll);
  const isPreview = !poll.closed;

  if (slots.length === 0) {
    return (
      <section className="mt-8">
        <EmptyState
          title="Nessuna disponibilità da incrociare"
          description={
            isPreview
              ? "Appena arrivano voti sui giorni e sugli orari, qui compaiono le tre fasce più votate."
              : "Servono voti, sui giorni e sugli orari, per calcolare la fascia con più persone."
          }
        />
      </section>
    );
  }

  // Le barre sono proporzionali alla fascia più votata, non ai votanti totali:
  // così si vede il distacco senza schiacciare tutto a sinistra.
  const top = slots[0].voters.length;

  return (
    <section className="mt-8">
      <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <IconPodium className="size-4 text-accent-text" />
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          {isPreview ? "Le 3 proposte più votate" : "Le 3 fasce con più persone"}
        </h2>
        {isPreview ? (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-muted">
            anteprima
          </span>
        ) : null}
      </div>
      <p className="mb-4 max-w-prose text-[12.5px] text-muted">
        {isPreview
          ? "Sondaggio ancora aperto: il grafico si aggiorna a ogni voto e si fissa alla chiusura."
          : "Incrocio dei voti: chi ha scelto sia il giorno sia l'orario. A pari merito vince la fascia proposta prima."}
      </p>

      <ul className="space-y-3.5">
        {slots.map((slot, index) => {
          const isBest = index === 0;
          const width = top > 0 ? Math.max(6, Math.round((slot.voters.length / top) * 100)) : 0;
          const names = slot.voters.map((voter) => voter.nickname).join(", ");

          return (
            <li key={slot.key}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-[13px] font-medium text-ink">
                  {slot.primary}
                  <span className="text-muted">
                    {slot.time ? <> · <span className="num text-ink">{slot.time}</span></> : " · tutto il giorno"}
                  </span>
                  {isBest ? (
                    <span className="ml-2 rounded-full bg-accent-solid px-1.5 py-0.5 align-middle text-[10px] font-semibold text-accent-on">
                      migliore
                    </span>
                  ) : null}
                </p>
                <p className="shrink-0 text-[12px] text-muted" title={names}>
                  <span className="num text-[14px] font-semibold text-ink">
                    {slot.voters.length}
                  </span>{" "}
                  {slot.voters.length === 1 ? "persona" : "persone"}
                  <span className="num ml-1.5 text-[11px] text-muted">{slot.percentage}%</span>
                </p>
              </div>

              <div
                className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
                role="img"
                aria-label={`${slot.primary}${slot.time ? ` alle ${slot.time}` : ""}: ${slot.voters.length} persone`}
              >
                <span
                  className={[
                    "block h-full rounded-full transition-[width] duration-500",
                    isBest ? "bg-accent-solid" : "bg-accent",
                  ].join(" ")}
                  style={{ width: `${width}%` }}
                />
              </div>

              {matchCreatePath && slot.startsAt && !isPreview ? (
                <p className="mt-1.5">
                  <Link
                    href={`${matchCreatePath}?date=${encodeURIComponent(slot.startsAt)}`}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-accent-text hover:underline"
                  >
                    <IconBall className="size-3.5" />
                    Crea partita con questa fascia
                  </Link>
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
