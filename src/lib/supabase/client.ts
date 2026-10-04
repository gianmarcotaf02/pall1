"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase per il browser. Serve al solo Realtime: la sessione è già
 * nei cookie (leggibili da JS), quindi il socket si autentica da solo e la
 * RLS continua a valere su ogni evento.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
