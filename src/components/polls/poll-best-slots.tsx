import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBall, IconPodium } from "@/components/icons";
import { bestPollSlots } from "@/lib/poll-best-slots";
import type { PollDetail } from "@/types/domain";

/**
 * A sondaggio concluso, le tre fasce (giorno + orario) con più persone
 * disponibili. Il calcolo è in `@/lib/poll-best-slots`.
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

  if (slots.length === 0) {
    return (
      <section className="mt-8">
        <EmptyState
          title="Nessuna disponibilità da incrociare"
          description="Servono voti, sui giorni e sugli orari, per calcolare la fascia con più persone."
        />
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <IconPodium className="size-4 text-accent-text" />
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
          Le {slots.length === 1 ? "fascia" : `${slots.length} fasce`} con più persone
        </h2>
      </div>
      <p className="mb-4 max-w-prose text-[12.5px] text-muted">
        Incrocio dei voti: chi ha scelto sia il giorno sia l&apos;orario. A pari merito vince la
        fascia proposta prima.
      </p>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot, index) => {
          const isBest = index === 0;
          const extra = slot.voters.length - 5;

          return (
            <li
              key={slot.key}
              className={[
                "flex flex-col gap-3 rounded-card border bg-surface p-4",
                isBest ? "border-accent-solid" : "border-rule",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-semibold text-ink">
                    {slot.primary}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-muted">
                    {slot.time ? (
                      <span className="num font-semibold text-ink">{slot.time}</span>
                    ) : (
                      "Tutto il giorno"
                    )}
                  </p>
                </div>
                <span
                  className={[
                    "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    isBest ? "bg-accent-solid text-accent-on" : "bg-surface-2 text-muted",
                  ].join(" ")}
                >
                  {isBest ? "Migliore" : `#${index + 1}`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ul className="flex -space-x-2">
                  {slot.voters.slice(0, 5).map((voter) => (
                    <li key={voter.profileId}>
                      <Avatar
                        name={voter.nickname}
                        src={voter.avatarUrl}
                        size="sm"
                        className="size-6 text-[9px] ring-2 ring-surface"
                      />
                    </li>
                  ))}
                </ul>
                {extra > 0 ? <span className="num text-[11.5px] text-muted">+{extra}</span> : null}
                <span className="ml-auto text-right">
                  <span className="num text-[18px] font-semibold text-ink">{slot.voters.length}</span>
                  <span className="ml-1 text-[11.5px] text-muted">
                    {slot.voters.length === 1 ? "persona" : "persone"}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2 border-t border-rule pt-3">
                <span className="num text-[11.5px] font-medium text-accent-text">
                  {slot.percentage}%
                </span>
                <span className="text-[11.5px] text-muted">dei votanti</span>
                {matchCreatePath && slot.startsAt ? (
                  <Link
                    href={`${matchCreatePath}?date=${encodeURIComponent(slot.startsAt)}`}
                    className="ml-auto inline-flex items-center gap-1.5 text-[11.5px] font-medium text-accent-text hover:underline"
                  >
                    <IconBall className="size-3.5" />
                    Crea partita
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
