"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { errorMessage, firstIssue } from "@/lib/errors";
import type { FormState } from "@/lib/form-state";
import { fromDatetimeLocalValue } from "@/lib/format";
import { timeSlotsForDay } from "@/lib/poll-times";
import { dayLabel, isSunday, weekdayName } from "@/lib/week";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pollSchema, pollStatusSchema, pollVoteSchema } from "@/lib/validation/schemas";

function revalidatePolls(pollId?: string) {
  revalidatePath("/");
  revalidatePath("/polls");
  // "layout" copre anche i sottosondaggi mostrati dentro il sondaggio padre.
  revalidatePath("/polls", "layout");
  if (pollId) revalidatePath(`/polls/${pollId}`);
}

function optionalIso(value: string | undefined) {
  if (!value) return null;
  return fromDatetimeLocalValue(value);
}

/** Giorno `YYYY-MM-DD` da un valore `datetime-local`. */
function dayKeyFromLocal(value: string | undefined): string | null {
  if (!value) return null;
  const [datePart] = value.split("T");
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart ?? "") ? datePart : null;
}

/**
 * Per ogni giorno del sondaggio crea un sottosondaggio con gli orari proposti
 * (feriali 18–21, sabato 15:30–18:30, passo 30 minuti). La domenica si salta.
 */
async function createTimeSubPolls(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string,
  options: { id: string; startsAt: string | undefined }[],
) {
  for (const option of options) {
    const day = dayKeyFromLocal(option.startsAt);
    if (!day || isSunday(day)) continue;

    const slots = timeSlotsForDay(day);
    if (slots.length === 0) continue;

    const { data: subPoll, error: subPollError } = await supabase
      .from("polls")
      .insert({
        question: `Orario per ${dayLabel(day)}`.slice(0, 160),
        details: `Orari preferiti per ${weekdayName(day).toLowerCase()}.`,
        allow_multiple: true,
        parent_option_id: option.id,
        created_by: profileId,
      })
      .select("id")
      .single();

    if (subPollError) return { error: subPollError };

    const { error: slotsError } = await supabase.from("poll_options").insert(
      slots.map((slot, index) => ({
        poll_id: subPoll.id,
        label: slot.label,
        starts_at: optionalIso(slot.startsAt),
        sort_order: index,
      })),
    );

    if (slotsError) return { error: slotsError };
  }

  return { error: null };
}

export async function createPollAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();

  const labels = formData.getAll("option_label").map(String);
  const startsAt = formData.getAll("option_starts_at").map(String);
  const options = labels.map((label, index) => ({
    label,
    starts_at: startsAt[index] ?? "",
  }));

  const parsed = pollSchema.safeParse({
    question: formData.get("question"),
    details: formData.get("details") ?? "",
    closes_at: String(formData.get("closes_at") ?? ""),
    week_start: String(formData.get("week_start") ?? ""),
    options,
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const validOptions = parsed.data.options.filter((option) => option.label.trim().length > 0);
  if (validOptions.length < 2) {
    return { error: "Servono almeno due opzioni compilate." };
  }

  const closesAt = optionalIso(parsed.data.closes_at);
  if (parsed.data.closes_at && !closesAt) return { error: "La data di chiusura non è valida." };

  const supabase = await createSupabaseServerClient();

  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      question: parsed.data.question,
      details: parsed.data.details?.trim() ? parsed.data.details.trim() : null,
      allow_multiple: formData.get("allow_multiple") === "on",
      closes_at: closesAt,
      week_start: parsed.data.week_start ? parsed.data.week_start : null,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: errorMessage(error) };

  const { data: insertedOptions, error: optionsError } = await supabase
    .from("poll_options")
    .insert(
      validOptions.map((option, index) => ({
        poll_id: poll.id,
        label: option.label.trim(),
        starts_at: optionalIso(option.starts_at),
        sort_order: index,
      })),
    )
    .select("id, sort_order");

  if (optionsError) {
    await supabase.from("polls").delete().eq("id", poll.id);
    return { error: errorMessage(optionsError) };
  }

  // I sottosondaggi degli orari per ogni giorno (attivi di default con una settimana).
  if (formData.get("with_time_subpolls") === "on") {
    const ordered = [...(insertedOptions ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    const { error: subPollsError } = await createTimeSubPolls(
      supabase,
      profile.id,
      ordered.map((option, index) => ({
        id: option.id,
        startsAt: validOptions[index]?.starts_at,
      })),
    );

    if (subPollsError) {
      await supabase.from("polls").delete().eq("id", poll.id);
      return { error: errorMessage(subPollsError) };
    }
  }

  revalidatePolls(poll.id);
  redirect(`/polls/${poll.id}`);
}

export async function toggleVoteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();

  const parsed = pollVoteSchema.safeParse({
    poll_id: formData.get("poll_id"),
    option_id: formData.get("option_id"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { poll_id, option_id } = parsed.data;
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("option_id", option_id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("poll_votes").delete().eq("id", existing.id);
    if (error) return { error: errorMessage(error) };
  } else {
    const { error } = await supabase
      .from("poll_votes")
      .insert({ poll_id, option_id, profile_id: profile.id });
    if (error) return { error: errorMessage(error) };
  }

  revalidatePolls(poll_id);
  return null;
}

export async function setPollStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireProfile();

  const parsed = pollStatusSchema.safeParse({
    poll_id: formData.get("poll_id"),
    is_closed: String(formData.get("is_closed")),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("polls")
    .update({ is_closed: parsed.data.is_closed === "true" })
    .eq("id", parsed.data.poll_id);

  if (error) return { error: errorMessage(error) };

  revalidatePolls(parsed.data.poll_id);
  return {
    success: parsed.data.is_closed === "true" ? "Sondaggio chiuso." : "Sondaggio riaperto.",
  };
}

export async function deletePollAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireProfile();
  const pollId = String(formData.get("poll_id") ?? "");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("polls").delete().eq("id", pollId);
  if (error) return { error: errorMessage(error) };

  revalidatePolls(pollId);
  redirect("/polls");
}
