"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import type { FormState } from "@/lib/form-state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Mettere in pausa o riattivare le notifiche Telegram del proprio profilo. */
export async function setTelegramNotificationsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const profile = await requireProfile();
  const enabled = formData.get("enabled") === "true";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("telegram_subscribers")
    .update({ notifications_enabled: enabled })
    .eq("profile_id", profile.id);

  if (error) return { error: errorMessage(error) };

  revalidatePath("/profile");
  return { success: enabled ? "Notifiche Telegram riattivate." : "Notifiche Telegram in pausa." };
}

/** Scollegare del tutto la chat Telegram dal profilo. */
export async function unlinkTelegramAction(_prev: FormState): Promise<FormState> {
  const profile = await requireProfile();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("telegram_subscribers")
    .delete()
    .eq("profile_id", profile.id);

  if (error) return { error: errorMessage(error) };

  revalidatePath("/profile");
  return { success: "Telegram scollegato." };
}
