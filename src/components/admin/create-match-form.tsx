"use client";

import { useActionState } from "react";
import { createMatchAction } from "@/lib/actions/admin";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";

export function CreateMatchForm({ defaultDateLocal }: { defaultDateLocal: string }) {
  const [state, action] = useActionState(createMatchAction, null);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data e ora" htmlFor="match_date_local" hint="Fuso orario italiano.">
          <Input
            id="match_date_local"
            name="match_date_local"
            type="datetime-local"
            required
            defaultValue={defaultDateLocal}
          />
        </Field>

        <Field label="Campo" htmlFor="location">
          <Input id="location" name="location" required maxLength={120} placeholder="es. Centro Sportivo Nord" />
        </Field>

        <Field label="Posti disponibili" htmlFor="max_players" hint="Quanti giocatori in totale.">
          <Input
            id="max_players"
            name="max_players"
            type="number"
            min={2}
            max={40}
            inputMode="numeric"
            defaultValue={10}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Nome squadra A" htmlFor="team_a_name">
            <Input id="team_a_name" name="team_a_name" defaultValue="Squadra A" maxLength={40} required />
          </Field>
          <Field label="Nome squadra B" htmlFor="team_b_name">
            <Input id="team_b_name" name="team_b_name" defaultValue="Squadra B" maxLength={40} required />
          </Field>
        </div>
      </div>

      <Field label="Note" htmlFor="notes" hint="Opzionale: ritrovo, quote, regole.">
        <Textarea id="notes" name="notes" maxLength={500} placeholder="Es. ritrovo 15 minuti prima" />
      </Field>

      <FormMessage state={state} />

      <SubmitButton pendingLabel="Creazione…">Crea partita</SubmitButton>
    </form>
  );
}
