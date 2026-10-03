"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { errorMessage, firstIssue } from "@/lib/errors";
import type { FormState } from "@/lib/form-state";
import { fromDatetimeLocalValue } from "@/lib/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { pollSchema, pollStatusSchema, pollVoteSchema } from "@/lib/validation/schemas";

function revalidatePolls(pollId?: string) {
  revalidatePath("/");
  revalidatePath("/polls");
  if (pollId) revalidatePath(`/polls/${pollId}`);
}

function optionalIso(value: string | undefined) {
  if (!value) return null;
  return fromDatetimeLocalValue(value);
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
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: errorMessage(error) };

  const { error: optionsError } = await supabase.from("poll_options").insert(
    validOptions.map((option, index) => ({
      poll_id: poll.id,
      label: option.label.trim(),
      starts_at: optionalIso(option.starts_at),
      sort_order: index,
    })),
  );

  if (optionsError) {
    await supabase.from("polls").delete().eq("id", poll.id);
    return { error: errorMessage(optionsError) };
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
