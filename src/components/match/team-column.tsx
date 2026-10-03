import { AttendanceChip, RoleTag } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ROLE_ORDER } from "@/lib/format";
import type { RosterEntry } from "@/types/domain";

export function PlayerLine({
  entry,
  showContributions = false,
}: {
  entry: RosterEntry;
  showContributions?: boolean;
}) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={entry.nickname} src={entry.avatarUrl} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
          <span className="truncate">{entry.nickname}</span>
          {entry.jerseyNumber !== null ? (
            <span className="num text-[11px] text-muted">#{entry.jerseyNumber}</span>
          ) : null}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {entry.roles.length > 0 ? (
            entry.roles
              .slice()
              .sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b))
              .map((role) => <RoleTag key={role} role={role} muted />)
          ) : (
            <AttendanceChip attendance={entry.attendance} />
          )}
        </div>
      </div>

      {showContributions ? (
        <div className="flex items-center gap-3 text-[12px] text-muted">
          {(entry.goals > 0 || entry.assists > 0) && (
            <>
              <span className="num font-semibold text-ink" title="Gol">
                {entry.goals} <span className="font-normal text-muted">gol</span>
              </span>
              <span className="num font-semibold text-ink" title="Assist">
                {entry.assists} <span className="font-normal text-muted">ass</span>
              </span>
            </>
          )}
        </div>
      ) : null}
    </li>
  );
}

export function TeamColumn({
  name,
  entries,
  showContributions,
}: {
  name: string;
  entries: RosterEntry[];
  showContributions?: boolean;
}) {
  return (
    <section className="rounded-card border border-rule bg-surface p-4 md:p-5">
      <header className="flex items-baseline justify-between gap-3 border-b border-rule pb-3">
        <h3 className="text-[14px] font-semibold text-ink">{name}</h3>
        <span className="num text-[12px] text-muted">{entries.length}</span>
      </header>
      {entries.length > 0 ? (
        <ul className="mt-1 divide-y divide-rule/70">
          {entries.map((entry) => (
            <PlayerLine key={entry.matchPlayerId} entry={entry} showContributions={showContributions} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[13px] text-muted">Nessun giocatore assegnato.</p>
      )}
    </section>
  );
}
