import { formatMatchDate } from "@/lib/format";
import { FORMAT_LABELS } from "@/lib/positions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, MatchFormat } from "@/types/domain";

/**
 * Invio delle notifiche Telegram.
 *
 * Il bot parla con le chat private che hanno premuto Start. Il `chat_id` viene
 * consegnato dal webhook e salvato in `telegram_subscribers`: qui lo si legge
 * con la service role e si manda il messaggio.
 *
 * Tutte le funzioni degrado con grazia: se il bot non è configurato o Telegram
 * non risponde, tornano `false` / non fanno nulla, senza far fallire l'azione
 * dell'app che ha innescato la notifica.
 *
 * Ogni avviso inviato resta in `telegram_notifications` con l'esito per chat in
 * `telegram_deliveries`: serve a sapere chi ha ricevuto cosa e a rimandarlo a chi
 * collega il bot più tardi.
 */

const TELEGRAM_API = "https://api.telegram.org";
const SEND_TIMEOUT_MS = 5_000;
/** Quanto indietro si guarda quando una chat nuova recupera gli avvisi persi. */
const CATCH_UP_WINDOW_DAYS = 7;
/** Tetto agli avvisi recuperati: meglio pochi che una raffica. */
const CATCH_UP_MAX = 5;
/** Telegram accetta ~1 messaggio al secondo per chat: li spaziamo. */
const CATCH_UP_SPACING_MS = 600;

const adminClient = () => createSupabaseAdminClient();

type Admin = ReturnType<typeof createSupabaseAdminClient>;
type NotificationKind = Database["public"]["Enums"] extends never ? never : "poll" | "match" | "match_reminder" | "match_fold";

export function telegramBotUsername(): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "");
  return username ? username : null;
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && telegramBotUsername());
}

/** Deep-link che apre il bot con il codice di collegamento già dentro. */
export function telegramLinkFor(code: string): string | null {
  const username = telegramBotUsername();
  if (!username) return null;
  return `https://t.me/${username}?start=${encodeURIComponent(code)}`;
}

/**
 * Codice monouso leggibile: niente 0/O/1/I per evitare errori di battitura,
 * anche se in realtà l'utente non lo digita mai (viaggia nel deep-link).
 */
export function generateTelegramLinkCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

/**
 * URL che passa dalla pagina-ponte `/open`: dentro Telegram mostra come aprire
 * il link nel browser del telefono, fuori reindirizza e basta.
 */
export function openInBrowserUrl(path: string): string {
  return `${appBaseUrl()}/open?to=${encodeURIComponent(path)}`;
}

/** Telegram interpreta l'HTML: il testo dell'utente va neutralizzato. */
export function escapeTelegramHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type Button = { label: string; url: string };

type SendOptions = { button?: Button };

/** Esito di un invio: `ok` più il motivo dell'errore, come lo racconta Telegram. */
export type TelegramSendResult = {
  ok: boolean;
  /** Codice HTTP di Telegram (`403` = bot bloccato, `429` = troppe richieste). */
  status: number | null;
  error: string | null;
};

/** Un singolo messaggio. */
export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options: SendOptions = {},
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, status: null, error: "TELEGRAM_BOT_TOKEN non configurato" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...(options.button
          ? { reply_markup: { inline_keyboard: [[{ text: options.button.label, url: options.button.url }]] } }
          : {}),
      }),
    });

    if (response.ok) return { ok: true, status: response.status, error: null };

    const detail = (await response.json().catch(() => null)) as { description?: string } | null;
    return {
      ok: false,
      status: response.status,
      error: detail?.description ?? `HTTP ${response.status}`,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: null,
      error: aborted ? "Telegram non ha risposto in tempo" : "Errore di rete verso Telegram",
    };
  } finally {
    clearTimeout(timer);
  }
}

type Broadcast = { text: string; button?: Button };

async function deliverToChatIds(chatIds: number[], message: Broadcast): Promise<number> {
  if (chatIds.length === 0) return 0;

  const results = await Promise.allSettled(
    chatIds.map((chatId) => sendTelegramMessage(chatId, message.text, { button: message.button })),
  );
  return results.filter((result) => result.status === "fulfilled" && result.value).length;
}

/** Manda lo stesso messaggio a tutte le chat iscritte e attive. */
export async function broadcastToSubscribers(message: Broadcast): Promise<number> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return 0;

  const admin = createSupabaseAdminClient();
  if (!admin) return 0;

  const { data } = await admin
    .from("telegram_subscribers")
    .select("chat_id")
    .eq("notifications_enabled", true);

  return deliverToChatIds((data ?? []).map((row) => row.chat_id), message);
}

/** Manda il messaggio solo alle chat dei profili indicati (es. i compagni di partita). */
async function sendToProfiles(profileIds: string[], message: Broadcast): Promise<number> {
  if (!process.env.TELEGRAM_BOT_TOKEN || profileIds.length === 0) return 0;

  const admin = createSupabaseAdminClient();
  if (!admin) return 0;

  const { data } = await admin
    .from("telegram_subscribers")
    .select("chat_id")
    .eq("notifications_enabled", true)
    .in("profile_id", profileIds);

  return deliverToChatIds((data ?? []).map((row) => row.chat_id), message);
}

/* ------------------------------------------------------------------ */
/* Messaggi di dominio                                                 */
/* ------------------------------------------------------------------ */

export async function notifyNewPoll(poll: {
  id: string;
  question: string;
  details: string | null;
  creator: string;
}): Promise<void> {
  const lines = ["📊 <b>Nuovo sondaggio</b>", escapeTelegramHtml(poll.question)];
  if (poll.details) lines.push(`<i>${escapeTelegramHtml(poll.details)}</i>`);
  lines.push(`👤 Creato da ${escapeTelegramHtml(poll.creator)}`);

  await broadcastToSubscribers({
    text: lines.join("\n"),
    button: { label: "Apri il sondaggio", url: openInBrowserUrl(`/polls/${poll.id}`) },
  });
}

export async function notifyNewMatch(match: {
  id: string;
  format: MatchFormat;
  matchDate: string;
  location: string;
  creator: string;
}): Promise<void> {
  const text = [
    "⚽ <b>Nuova partita</b>",
    `🗓 ${formatMatchDate(match.matchDate)}`,
    `📍 ${escapeTelegramHtml(match.location)}`,
    FORMAT_LABELS[match.format],
    `👤 Creata da ${escapeTelegramHtml(match.creator)}`,
  ].join("\n");

  await broadcastToSubscribers({
    text,
    button: { label: "Conferma la partita", url: openInBrowserUrl(`/matches/${match.id}`) },
  });
}

/**
 * Promemoria ~12 ore prima: lo manda il cron, a tutti gli iscritti.
 * Serve a ricordare di confermare la presenza.
 */
export async function notifyMatchReminder(match: {
  id: string;
  format: MatchFormat;
  matchDate: string;
  location: string;
}): Promise<number> {
  const text = [
    "⏰ <b>Si gioca tra circa 12 ore</b>",
    `🗓 ${formatMatchDate(match.matchDate)}`,
    `📍 ${escapeTelegramHtml(match.location)}`,
    FORMAT_LABELS[match.format],
    "",
    "Hai già confermato? Se non puoi più, ricordati di liberare il posto.",
  ].join("\n");

  return broadcastToSubscribers({
    text,
    button: { label: "Confermo la mia presenza", url: openInBrowserUrl(`/matches/${match.id}`) },
  });
}

/**
 * Forfait: avvisa **solo** chi è in quella partita, non tutto il gruppo.
 * La lista dei giocatori è `match_players`: la riga di chi dà forfait viene
 * cancellata prima di chiamare questa funzione, ma ci si protegge comunque.
 */
export async function notifyMatchFold(input: {
  matchId: string;
  folderProfileId: string;
  folderNickname: string;
}): Promise<number> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return 0;

  const admin = createSupabaseAdminClient();
  if (!admin) return 0;

  const [{ data: match }, { data: players }] = await Promise.all([
    admin
      .from("matches")
      .select("match_date, location")
      .eq("id", input.matchId)
      .maybeSingle(),
    admin.from("match_players").select("profile_id").eq("match_id", input.matchId),
  ]);

  if (!match) return 0;

  const teammates = (players ?? [])
    .map((row) => row.profile_id)
    .filter((id) => id !== input.folderProfileId);

  const text = [
    "❌ <b>Ha dato forfait</b>",
    `${escapeTelegramHtml(input.folderNickname)} ha liberato il posto.`,
    `🗓 ${formatMatchDate(match.match_date)}`,
    `📍 ${escapeTelegramHtml(match.location)}`,
  ].join("\n");

  return sendToProfiles(teammates, {
    text,
    button: { label: "Apri la partita", url: openInBrowserUrl(`/matches/${input.matchId}`) },
  });
}
