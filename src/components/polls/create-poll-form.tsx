"use client";

import { useActionState, useState } from "react";
import { createPollAction } from "@/lib/actions/polls";
import { Field, Input, Textarea } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/ui/form-message";
import { IconPlus, IconTrash, IconX } from "@/components/icons";
import { MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from "@/lib/validation/schemas";

type Row = {
  key: number;
  label: string;
  startsAt: string;
  withDate: boolean;
};

let nextKey = 1;

function emptyRow(): Row {
  return { key: nextKey++, label: "", startsAt: "", withDate: false };
}

const PRESETS = [
  { label: "Giorni", values: ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"] },
  { label: "Orari", values: ["18:00", "19:00", "20:00", "21:00", "22:00"] },
];

export function CreatePollForm({
  prefillQuestion,
  prefillSingleChoice,
}: {
  prefillQuestion?: string;
  prefillSingleChoice?: boolean;
}) {
  const [state, action] = useActionState(createPollAction, null);
  const [rows, setRows] = useState<Row[]>([emptyRow(), emptyRow()]);
  const [allowMultiple, setAllowMultiple] = useState(!prefillSingleChoice);

  function update(key: number, patch: Partial<Row>) {
    setRows((previous) => previous.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((previous) => (previous.length >= MAX_POLL_OPTIONS ? previous : [...previous, emptyRow()]));
  }

  function removeRow(key: number) {
    setRows((previous) => (previous.length <= MIN_POLL_OPTIONS ? previous : previous.filter((row) => row.key !== key)));
  }

  function applyPreset(values: string[]) {
    setRows(values.slice(0, MAX_POLL_OPTIONS).map((label) => ({ key: nextKey++, label, startsAt: "", withDate: false })));
  }

  return (
    <form action={action} className="space-y-5">
      <Field label="Domanda" htmlFor="question" hint="Es. «Quale giorno giochiamo?»">
        <Input
          id="question"
          name="question"
          required
          minLength={3}
          maxLength={160}
          defaultValue={prefillQuestion ?? ""}
          placeholder="Quale giorno giochiamo?"
        />
      </Field>

      <Field label="Dettagli" htmlFor="details" hint="Opzionale: contesto, scadenza, note.">
        <Textarea id="details" name="details" maxLength={500} placeholder="Es. decidiamo entro giovedì" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <fieldset className="space-y-2">
          <legend className="text-[13px] font-medium text-muted">Tipo di risposta</legend>

          <input type="hidden" name="allow_multiple" value={allowMultiple ? "on" : "off"} />

          <div className="inline-flex rounded-control bg-surface-2 p-1">
            <button
              type="button"
              onClick={() => setAllowMultiple(false)}
              aria-pressed={!allowMultiple}
              className={[
                "rounded-[7px] px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                !allowMultiple ? "bg-accent-solid text-accent-on" : "text-muted hover:text-ink",
              ].join(" ")}
            >
              Una sola scelta
            </button>
            <button
              type="button"
              onClick={() => setAllowMultiple(true)}
              aria-pressed={allowMultiple}
              className={[
                "rounded-[7px] px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                allowMultiple ? "bg-accent-solid text-accent-on" : "text-muted hover:text-ink",
              ].join(" ")}
            >
              Più scelte
            </button>
          </div>

          <p className="text-xs text-muted">
            «Una sola scelta» va bene per un orario; «più scelte» per i giorni disponibili.
          </p>
        </fieldset>

        <Field label="Chiusura automatica" htmlFor="closes_at" hint="Opzionale: oltre questa data non si vota più.">
          <Input id="closes_at" name="closes_at" type="datetime-local" />
        </Field>
      </div>

      <fieldset className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <legend className="text-[13px] font-medium text-muted">
            Opzioni · minimo {MIN_POLL_OPTIONS}, massimo {MAX_POLL_OPTIONS}
          </legend>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11.5px] text-muted">Riempi con:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset.values)}
                className="rounded-full border border-rule px-2.5 py-1 text-[11.5px] text-muted transition-colors duration-150 hover:border-line-strong hover:text-ink"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={row.key} className="rounded-control border border-rule bg-paper p-2.5">
              <div className="flex items-center gap-2">
                <span className="num w-5 shrink-0 text-center text-[12px] text-muted">
                  {index + 1}
                </span>

                <input
                  name="option_label"
                  value={row.label}
                  onChange={(event) => update(row.key, { label: event.target.value })}
                  maxLength={80}
                  placeholder={`Opzione ${index + 1}`}
                  aria-label={`Testo opzione ${index + 1}`}
                  className="h-10 min-w-0 flex-1 rounded-[8px] border border-rule bg-surface px-2.5 text-[13.5px] text-ink placeholder:text-muted/80 focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
                />

                <button
                  type="button"
                  onClick={() => update(row.key, { withDate: !row.withDate })}
                  aria-pressed={row.withDate}
                  title="Collega una data e un'ora precise"
                  className={[
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] border transition-colors duration-150",
                    row.withDate
                      ? "border-accent-solid text-accent-text"
                      : "border-rule text-muted hover:text-ink",
                  ].join(" ")}
                >
                  <IconPlus className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  disabled={rows.length <= MIN_POLL_OPTIONS}
                  title="Rimuovi opzione"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-[8px] border border-rule text-muted transition-colors duration-150 hover:border-loss hover:text-loss disabled:pointer-events-none disabled:opacity-40"
                >
                  <IconTrash className="size-4" />
                </button>
              </div>

              {row.withDate ? (
                <div className="mt-2 pl-7">
                  <input
                    type="datetime-local"
                    name="option_starts_at"
                    value={row.startsAt}
                    onChange={(event) => update(row.key, { startsAt: event.target.value })}
                    aria-label={`Data e ora opzione ${index + 1}`}
                    className="h-10 w-full rounded-[8px] border border-rule bg-surface px-2.5 text-[13px] text-ink focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25 sm:w-auto"
                  />
                </div>
              ) : (
                <input type="hidden" name="option_starts_at" value="" />
              )}
            </li>
          ))}
        </ul>

        {rows.length < MAX_POLL_OPTIONS ? (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex h-10 items-center gap-2 rounded-control border border-dashed border-line-strong px-3.5 text-[13px] text-muted transition-colors duration-150 hover:border-accent-solid hover:text-ink"
          >
            <IconPlus className="size-4" />
            Aggiungi opzione
          </button>
        ) : (
          <p className="flex items-center gap-1.5 text-[12px] text-muted">
            <IconX className="size-3.5" />
            Raggiunto il massimo di {MAX_POLL_OPTIONS} opzioni.
          </p>
        )}

        <p className="text-xs text-muted">
          Collegando data e ora a un&apos;opzione, l&apos;admin può poi creare la partita con un click.
        </p>
      </fieldset>

      <FormMessage state={state} />

      <SubmitButton pendingLabel="Creazione…">Crea sondaggio</SubmitButton>
    </form>
  );
}
