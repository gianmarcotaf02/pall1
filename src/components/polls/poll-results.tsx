"use client";

import { useActionState } from "react";
import Link from "next/link";
import { toggleVoteAction } from "@/lib/actions/polls";
import { Avatar } from "@/components/ui/avatar";
import { FormMessage } from "@/components/ui/form-message";
import { IconCheck, IconPoll } from "@/components/icons";
import { formatMatchDate } from "@/lib/format";
import type { PollDetail, PollSubPoll } from "@/types/domain";

export function PollResults({
  poll,
  myProfileId,
  matchCreatePath = null,
}: {
  poll: PollDetail;
  myProfileId: string;
  /** Base per creare la partita da un'opzione con data (admin o organizzatore). */
  matchCreatePath?: string | null;
}) {
  const [state, action] = useActionState(toggleVoteAction, null);
  const canVote = !poll.closed;
  const myVotes = new Set(poll.myVotes);
  const totalVoters = poll.voterCount;
  const isMine = poll.createdBy === myProfileId;

  return (
    <div className="space-y-4">
      <ul className="space-y-2.5">
        {poll.options.map((option) => {
          const selected = myVotes.has(option.id);
          const count = option.voters.length;
          const percentage = totalVoters > 0 ? Math.round((count / totalVoters) * 100) : 0;

          return (
            <li key={option.id}>
              <form action={action}>
                <input type="hidden" name="poll_id" value={poll.id} />
                <input type="hidden" name="option_id" value={option.id} />

                <button
                  type="submit"
                  disabled={!canVote}
                  aria-pressed={selected}
                  className={[
                    "relative w-full overflow-hidden rounded-card border bg-surface text-left transition-colors duration-150",
                    selected ? "border-accent-solid" : "border-rule hover:border-line-strong",
                    canVote ? "" : "cursor-default",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 bg-accent/12"
                    style={{ width: `${percentage}%` }}
                  />

                  <span className="relative flex items-center gap-3 px-3.5 py-3">
                    <span
                      aria-hidden
                      className={[
                        "flex size-[18px] shrink-0 items-center justify-center border transition-colors duration-150",
                        poll.allowMultiple ? "rounded-[5px]" : "rounded-full",
                        selected
                          ? "border-accent-solid bg-accent-solid text-accent-on"
                          : "border-line-strong bg-surface",
                      ].join(" ")}
                    >
                      {selected ? <IconCheck className="size-3" strokeWidth={2.6} /> : null}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-ink">
                        {option.label}
                      </span>
                      {option.startsAt ? (
                        <span className="mt-0.5 block text-[12px] text-muted">
                          {formatMatchDate(option.startsAt)}
                        </span>
                      ) : null}
                    </span>

                    <span className="num shrink-0 text-[13px] font-semibold text-ink">{count}</span>
                    <span className="num w-9 shrink-0 text-right text-[12.5px] text-muted">
                      {percentage}%
                    </span>
                  </span>
                </button>
              </form>

              {count > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-1.5 pl-1">
                  {option.voters.map((voter) => (
                    <li
                      key={voter.profileId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rule px-2 py-0.5 text-[11.5px] text-muted"
                    >
                      <Avatar
                        name={voter.nickname}
                        src={voter.avatarUrl}
                        size="sm"
                        className="size-5 text-[9px]"
                      />
                      {voter.nickname}
                      {voter.profileId === myProfileId ? (
                        <span className="text-accent-text">(tu)</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 pl-1 text-[11.5px] text-muted">Nessun voto su questa opzione.</p>
              )}

              {matchCreatePath && option.startsAt ? (
                <p className="mt-2 pl-1">
                  <Link
                    href={`${matchCreatePath}?date=${encodeURIComponent(option.startsAt)}`}
                    className="text-[11.5px] font-medium text-accent-text hover:underline"
                  >
                    Crea una partita con questa data
                  </Link>
                </p>
              ) : null}

              {option.subPoll ? <SubPollVotes subPoll={option.subPoll} action={action} /> : null}
            </li>
          );
        })}
      </ul>

      <div className="space-y-3">
        <FormMessage state={state} />

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
          <span>
            <span className="num font-semibold text-ink">{totalVoters}</span>{" "}
            {totalVoters === 1 ? "votante" : "votanti"}
          </span>
          <span>{poll.allowMultiple ? "Risposta multipla" : "Una sola scelta"}</span>
          {canVote ? <span>Tocca un&apos;opzione per votare o ritirare il voto.</span> : null}
        </p>

        {isMine ? (
          <Link
            href={`/polls/new?from=${poll.id}`}
            className="inline-flex items-center gap-2 text-[12px] font-medium text-accent-text hover:underline"
          >
            <IconPoll className="size-3.5" />
            Crea il sondaggio successivo (es. l&apos;orario)
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** Elenco orari sotto un giorno: è un sondaggio a sé, votabile in linea. */
function SubPollVotes({
  subPoll,
  action,
}: {
  subPoll: PollSubPoll;
  action: (formData: FormData) => void;
}) {
  const myVotes = new Set(subPoll.myVotes);
  const canVote = !subPoll.closed;

  return (
    <div className="mt-2 ml-1 rounded-card border border-rule bg-paper p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <p className="text-[12px] font-medium text-ink">Orari preferiti</p>
        <p className="text-[11px] text-muted">
          <span className="num">{subPoll.voterCount}</span>{" "}
          {subPoll.voterCount === 1 ? "votante" : "votanti"}
          {subPoll.allowMultiple ? " · più scelte" : " · una scelta"}
        </p>
      </div>

      <ul className="mt-2 flex flex-wrap gap-1.5">
        {subPoll.options.map((option) => {
          const selected = myVotes.has(option.id);
          return (
            <li key={option.id}>
              <form action={action}>
                <input type="hidden" name="poll_id" value={subPoll.id} />
                <input type="hidden" name="option_id" value={option.id} />
                <button
                  type="submit"
                  disabled={!canVote}
                  aria-pressed={selected}
                  title={
                    option.voters.length > 0
                      ? option.voters.map((voter) => voter.nickname).join(", ")
                      : "Nessun voto"
                  }
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors duration-150",
                    selected
                      ? "border-accent-solid bg-accent-solid text-accent-on"
                      : "border-rule text-muted hover:border-line-strong hover:text-ink",
                    canVote ? "" : "cursor-default",
                  ].join(" ")}
                >
                  <span className="num font-medium">{option.label}</span>
                  {option.voters.length > 0 ? (
                    <span className="num text-[11px] opacity-80">{option.voters.length}</span>
                  ) : null}
                </button>
              </form>
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-[11px] text-muted">
        {canVote
          ? "Tocca gli orari che preferisci: puoi sceglierne più di uno."
          : "Votazione degli orari chiusa."}
      </p>
    </div>
  );
}
