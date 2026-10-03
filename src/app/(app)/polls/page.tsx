import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { SectionTabs } from "@/components/section-tabs";
import { PollCard } from "@/components/polls/poll-card";
import { EmptyState, SectionTitle } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { listPolls } from "@/lib/queries";

export const metadata: Metadata = { title: "Sondaggi" };

export default async function PollsPage() {
  const profile = await requireProfile();
  const polls = await listPolls(profile.id);

  const open = polls.filter((poll) => !poll.closed);
  const closed = polls.filter((poll) => poll.closed);
  const waitingForMe = open.filter((poll) => poll.myVotes.length === 0);

  return (
    <>
      <PageHeader
        title="Sondaggi"
        description={[profile.nickname, "qui si decide quando e come giocare."].join(", ")}
        action={
          <Link href="/polls/new" className={buttonClass({ size: "sm" })}>
            Nuovo sondaggio
          </Link>
        }
      />

      <SectionTabs active="polls" />

      <section>
        <SectionTitle
          action={
            waitingForMe.length > 0 ? (
              <span className="text-[12px] text-accent-text">
                {waitingForMe.length} in attesa del tuo voto
              </span>
            ) : null
          }
        >
          Aperti
        </SectionTitle>

        {open.length > 0 ? (
          <div className="divide-y divide-rule overflow-hidden rounded-card border border-rule bg-surface">
            {open.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nessun sondaggio aperto"
            description="Crea un sondaggio per scegliere il giorno della partita, poi uno per l'orario."
            action={
              <Link href="/polls/new" className={buttonClass({ size: "sm" })}>
                Crea il primo sondaggio
              </Link>
            }
          />
        )}
      </section>

      {closed.length > 0 ? (
        <section className="mt-8">
          <SectionTitle>Chiusi</SectionTitle>
          <div className="divide-y divide-rule overflow-hidden rounded-card border border-rule bg-surface">
            {closed.map((poll) => (
              <PollCard key={poll.id} poll={poll} />
            ))}
          </div>
        </section>
      ) : null}

      <p className="mt-6 text-[12px] text-muted">
        Tutti i membri del gruppo vedono chi ha votato cosa. Ogni sondaggio può essere a scelta
        singola o multipla, e l&apos;autore lo può chiudere o eliminare.
      </p>
    </>
  );
}
