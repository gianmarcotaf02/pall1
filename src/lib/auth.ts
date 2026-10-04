import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Chiamato solo dal layout /admin: se non sei admin la pagina non esiste (404, non 403). */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (!profile.is_admin) notFound();
  return profile;
}

/**
 * Creazione partite: admin o organizzatore. Serve al form "Nuova partita"
 * dedicato; il pannello /admin resta riservato agli admin.
 */
export async function requireOrganizer(): Promise<Profile> {
  const profile = await requireProfile();
  if (!profile.is_admin && !profile.is_organizer) notFound();
  return profile;
}
