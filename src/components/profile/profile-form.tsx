"use client";

import { useActionState, useState } from "react";
import { updateProfileAction } from "@/lib/actions/profile";
import { Field, Input, Select } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { ROLE_LABELS, ROLE_ORDER } from "@/lib/format";
import type { PlayerRole, Profile } from "@/types/domain";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfileAction, null);
  const [roles, setRoles] = useState<PlayerRole[]>(profile.roles ?? []);

  function toggleRole(role: PlayerRole) {
    setRoles((previous) =>
      previous.includes(role) ? previous.filter((item) => item !== role) : [...previous, role],
    );
  }

  const preferred = profile.preferred_role && roles.includes(profile.preferred_role)
    ? profile.preferred_role
    : "";

  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nickname" htmlFor="nickname" hint="Unico nel gruppo, 3-24 caratteri.">
          <Input
            id="nickname"
            name="nickname"
            defaultValue={profile.nickname}
            required
            minLength={3}
            maxLength={24}
          />
        </Field>

        <Field label="Nome e cognome" htmlFor="full_name" hint="Visibile ai membri del gruppo.">
          <Input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} maxLength={80} />
        </Field>

        <Field label="Numero di maglia" htmlFor="jersey_number" hint="1-99. Libero tra i giocatori attivi.">
          <Input
            id="jersey_number"
            name="jersey_number"
            type="number"
            min={1}
            max={99}
            inputMode="numeric"
            defaultValue={profile.jersey_number ?? ""}
            placeholder="—"
          />
        </Field>

        <Field label="Data di nascita" htmlFor="birth_date" hint="Serve solo per le statistiche.">
          <Input id="birth_date" name="birth_date" type="date" defaultValue={profile.birth_date ?? ""} />
        </Field>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-muted">Ruoli</legend>
        <div className="flex flex-wrap gap-2">
          {ROLE_ORDER.map((role) => {
            const checked = roles.includes(role);
            return (
              <label key={role} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="roles"
                  value={role}
                  checked={checked}
                  onChange={() => toggleRole(role)}
                  className="peer sr-only"
                />
                <span
                  className={[
                    "inline-flex h-10 items-center rounded-control border px-3.5 text-[13px] font-medium transition-colors duration-150",
                    "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus",
                    checked
                      ? "border-accent-solid bg-accent-solid text-accent-on"
                      : "border-line-strong bg-surface text-muted hover:text-ink",
                  ].join(" ")}
                >
                  {ROLE_LABELS[role]}
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-xs text-muted">Puoi selezionare più ruoli.</p>
      </fieldset>

      <Field
        label="Ruolo preferito"
        htmlFor="preferred_role"
        hint={roles.length === 0 ? "Seleziona prima almeno un ruolo." : undefined}
      >
        <Select
          id="preferred_role"
          name="preferred_role"
          defaultValue={preferred}
          disabled={roles.length === 0}
          className="sm:max-w-xs"
        >
          <option value="">Nessuna preferenza</option>
          {ROLE_ORDER.filter((role) => roles.includes(role)).map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role]}
            </option>
          ))}
        </Select>
      </Field>

      <FormMessage state={state} />

      <SubmitButton pendingLabel="Salvataggio…">Salva profilo</SubmitButton>
    </form>
  );
}
