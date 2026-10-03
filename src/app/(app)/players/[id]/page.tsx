import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { JerseyNumber, RoleTag } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { requireProfile } from "@/lib/auth";
import { ageFrom, formatDate, ROLE_LABELS, ROLE_ORDER } from "@/lib/format";
import { getPlayerStats, getProfileById } from "@/lib/queries";
import { IconArrowLeft } from "@/components/icons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const player = await getProfileById(id);
  return { title: player?.nickname ?? "Giocatore" };
}

function StatCell({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="px-4 py-3.5">
      <p className="text-[11.5px] text-muted">{label}</p>
      <p className={`num mt-1 text-[20px] font-semibold tracking-[-0.02em] ${tone ?? "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireProfile();
  const player = await getProfileById(id);

  if (!player) notFound();

  const stats = await getPlayerStats(id);
  const age = ageFrom(player.birth_date);
  const isMe = player.id === me.id;

  return (
    <>
      <PageHeader
        back={
          <Link href="/players" className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink">
            <IconArrowLeft className="size-4" />
            Tutti i giocatori
          </Link>
        }
        title={player.nickname}
        description={player.full_name ?? "Nome non indicato"}
        action={
          isMe ? (
            <Link href="/profile" className="text-[13px] font-medium text-accent-text hover:underline">
              Modifica il tuo profilo
            </Link>
          ) : null
        }
      />

      <section className="flex flex-wrap items-center gap-5 rounded-card border border-rule bg-surface p-5">
        <Avatar name={player.nickname} src={player.avatar_url} size="xl" />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {player.roles.length > 0 ? (
              player.roles
                .slice()
                .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
                .map((role) => (
                  <RoleTag key={role} role={role} muted={player.preferred_role !== role} />
                ))
            ) : (
              <span className="text-[13px] text-muted">Ruolo da definire</span>
            )}
            {player.preferred_role ? (
              <span className="text-[11.5px] text-muted">
                preferito: {ROLE_LABELS[player.preferred_role]}
              </span>
            ) : null}
          </div>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
            <JerseyNumber value={player.jersey_number} />
            {age !== null ? <span>{age} anni</span> : null}
            <span>{player.is_active ? "Attivo" : "Non attivo"}</span>
          </p>

          {player.notes ? <p className="text-[13px] text-muted">{player.notes}</p> : null}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-[13px] font-semibold text-muted">Statistiche</h2>

        {stats ? (
          <div className="grid grid-cols-2 divide-rule overflow-hidden rounded-card border border-rule bg-surface sm:grid-cols-4 sm:divide-x">
            <StatCell label="Partite" value={stats.matches_played ?? 0} />
            <StatCell label="Vittorie" value={stats.wins ?? 0} tone="text-win" />
            <StatCell label="Pareggi" value={stats.draws ?? 0} />
            <StatCell label="Sconfitte" value={stats.losses ?? 0} tone="text-loss" />
            <StatCell label="Gol" value={stats.goals ?? 0} />
            <StatCell label="Assist" value={stats.assists ?? 0} />
            <StatCell
              label="% vittorie"
              value={stats.win_rate === null || stats.win_rate === undefined ? "—" : `${stats.win_rate}%`}
            />
            <StatCell
              label="Ultima partita"
              value={stats.last_played_at ? formatDate(stats.last_played_at) : "Mai"}
            />
          </div>
        ) : (
          <EmptyState
            title="Nessuna statistica"
            description="Le statistiche arrivano dopo la prima partita giocata con il risultato."
          />
        )}
      </section>
    </>
  );
}
