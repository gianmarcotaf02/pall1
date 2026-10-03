"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { setAttendanceAction } from "@/lib/actions/participation";
import { FormMessage } from "@/components/ui/form-message";
import type { Attendance } from "@/types/domain";

const OPTIONS: Array<{ value: Attendance; label: string }> = [
  { value: "present", label: "Ci sono" },
  { value: "maybe", label: "Forse" },
  { value: "absent", label: "Non ci sono" },
];

function Options({ value }: { value: Attendance | null }) {
  const { pending } = useFormStatus();

  return (
    <fieldset
      disabled={pending}
      className="flex w-full rounded-control bg-surface-2 p-1 sm:w-auto"
      aria-busy={pending}
    >
      <legend className="sr-only">La tua presenza a questa partita</legend>
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="submit"
            name="attendance"
            value={option.value}
            aria-pressed={selected}
            className={[
              "flex-1 whitespace-nowrap rounded-[7px] px-3 py-2 text-[13px] font-medium transition-colors duration-150 sm:flex-none",
              selected
                ? "bg-accent-solid text-accent-on"
                : "text-muted hover:text-ink",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}

export function AttendanceControl({
  matchId,
  value,
  disabled,
  className,
}: {
  matchId: string;
  value: Attendance | null;
  disabled?: boolean;
  className?: string;
}) {
  const [state, action] = useActionState(setAttendanceAction, null);

  return (
    <div className={[" space-y-2", className].filter(Boolean).join(" ")}>
      <form action={action}>
        <input type="hidden" name="match_id" value={matchId} />
        <Options value={value} />
      </form>
      {disabled ? (
        <p className="text-xs text-muted">Le iscrizioni sono chiuse per questa partita.</p>
      ) : null}
      <FormMessage state={state} />
    </div>
  );
}
