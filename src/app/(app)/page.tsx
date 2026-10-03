import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { NextMatchPanel } from "@/components/match/next-match";
import { StandingsTable } from "@/components/stats/standings-table";
import { EmptyState, SectionTitle } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";
import { formatMatchDate } from "@/lib/format";
import {
  getMyAttendance,
  listMatches,
  listPlayerStats,
  listProfiles,
  listStandings,
  splitMatches,
} from "@/lib/queries";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const matches = await listMatches();
  const { upcoming } = splitMatches(matches);

  const next = upcoming[0] ?? null;
  const myAttendance = next ? await getMyAttendance(next.id, profile.id) : null;

  const [standings, stats, players] = await Promise.all([
    listStandings(),
    listPlayerStats(),
    listProfiles(),
  ]);

  const nicknameById = new Map(players.map((p) => [p.id, p.nickname]));
  const scorers = stats
    .filter((row) => (row.goals ?? 0) > 0)
    .sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))
    .slice(0, 4);

  const lastPlayed =
    matches
      .filter((m) => m.status === "played" && m.result)
      .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())[0] ?? null;

  return (
    <>
      <PageHeader
        title={`Ciao, ${profile.nickname}`}
        description="Ecco come sta andando il nostro calcetto."
        action={
          profile.is_admin ? (
            <Link href="/admin/matches" className={buttonClass({ variant: "secondary", size: "sm" })}>
              Nuova partita
            </Link>
          ) : null
        }
      />

      {next ? (
        <NextMatchPanel match={next} myAttendance={myAttendance} />
      ) : (
        <EmptyState
          title="Nessuna partita in programma"
          description="Quando l'admin ne crea una, la trovi qui con i posti disponibili."
          action={
            profile.is_admin ? (
              <Link href="/admin/matches" className={buttonClass({ size: "sm" })}>
                Crea la prossima partita
              </Link>
            ) : null
          }
        />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <SectionTitle
            action={
              <Link href="/standings" className="text-[13px] font-medium text-accent-text hover:underline">
                Tutta la classifica
              </Link>
            }
          >
            Classifica
          </SectionTitle>

          {standings.length > 0 ? (
            <StandingsTable rows={standings} limit={5} compact />
          ) : (
            <EmptyState
              title="Classifica ancora vuota"
              description="Si popola dopo la prima partita chiusa con il risultato."
            />
          )}
        </section>

        <div className="space-y-6">
          <section>
            <SectionTitle
              action={
                <Link href="/matches" className="text-[13px] font-medium text-accent-text hover:underline">
                  Storico
                </Link>
              }
            >
              Ultima partita
            </SectionTitle>

            {lastPlayed && lastPlayed.result ? (
              <Link
                href={`/matches/${lastPlayed.id}`}
                className="block rounded-card border border-rule bg-surface px-5 py-4 transition-colors duration-150 hover:bg-surface-2"
              >
                <p className="text-[12.5px] text-muted">{formatMatchDate(lastPlayed.match_date)}</p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className="num text-[22px] font-semibold tracking-[-0.02em] text-ink">
                    {lastPlayed.result.team_a_score}
                    <span className="px-1 text-muted">–</span>
                    {lastPlayed.result.team_b_score}
                  </span>
                  <span className="min-w-0 truncate text-right text-[13px] text-muted">
                    {lastPlayed.team_a_name} · {lastPlayed.team_b_name}
                  </span>
                </div>
              </Link>
            ) : (
              <EmptyState title="Nessun risultato" description="Ancora nessuna partita è stata chiusa." />
            )}
          </section>

          <section>
            <SectionTitle
              action={
                <Link href="/stats" className="text-[13px] font-medium text-accent-text hover:underline">
                  Statistiche
                </Link>
              }
            >
              Capocannonieri
            </SectionTitle>

            {scorers.length > 0 ? (
              <ul className="divide-y divide-rule overflow-hidden rounded-card border border-rule bg-surface">
                {scorers.map((row, index) => (
                  <li key={row.profile_id} className="flex items-center gap-3 px-5 py-3">
                    <span className="num w-4 text-[12px] text-muted">{index + 1}</span>
                    <Link
                      href={`/players/${row.profile_id}`}
                      className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink hover:text-accent-text"
                    >
                      {nicknameById.get(row.profile_id ?? "") ?? "—"}
                    </Link>
                    <span className="num text-[14px] font-semibold text-ink">{row.goals}</span>
                    <span className="text-[11px] text-muted">gol</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nessun gol registrato" description="I gol si inseriscono chiudendo la partita." />
            )}
          </section>
        </div>
      </div>
    </>
  );
}
