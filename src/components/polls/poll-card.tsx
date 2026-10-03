import Link from "next/link";
import { PollDeadline, PollStatus } from "@/components/polls/poll-status";
import type { PollSummary } from "@/types/domain";

export function PollCard({ poll }: { poll: PollSummary }) {
  const voted = poll.myVotes.length > 0;

  return (
    <Link
      href={`/polls/${poll.id}`}
      className="flex items-start gap-4 px-4 py-3.5 transition-colors duration-150 hover:bg-surface-2"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-ink">{poll.question}</p>
        <p className="mt-0.5 truncate text-[12.5px] text-muted">
          {poll.creatorNickname} · {poll.optionCount} opzioni ·{" "}
          <span className="num">{poll.voterCount}</span> votanti
        </p>
        {poll.details ? (
          <p className="mt-1 line-clamp-1 text-[12.5px] text-muted">{poll.details}</p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <PollStatus closed={poll.closed} />
        {voted ? (
          <span className="text-[11px] text-accent-text">hai votato</span>
        ) : (
          <PollDeadline closesAt={poll.closesAt} />
        )}
      </div>
    </Link>
  );
}
