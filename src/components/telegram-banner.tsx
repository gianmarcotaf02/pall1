"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconTelegram, IconX } from "@/components/icons";

/**
 * Avviso compatto sulla home per chi non ha ancora collegato Telegram.
 *
 * Chi non vuole Telegram può chiuderlo: la scelta dura una settimana, poi
 * ricompare una volta sola. Lo stato sta in `localStorage`, quindi non tocca il
 * database e non richiede una colonna "avviso visto" sul profilo.
 */

const DISMISS_KEY = "pall1-telegram-banner-dismissed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

export function TelegramBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      setVisible(!until || until < Date.now());
    } catch {
      // Storage non disponibile (Safari privato): mostra l'avviso.
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    } catch {
      // Se non si può salvare, si limita a sparire per questa visita.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-card border border-rule bg-surface px-3 py-2.5">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent-text"
      >
        <IconTelegram className="size-4" />
      </span>

      <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-muted">
        Attiva gli avvisi su Telegram per partite e sondaggi.
      </p>

      <Link
        href="/api/telegram/link"
        prefetch={false}
        className="shrink-0 text-[12.5px] font-medium text-accent-text hover:underline"
      >
        Collega
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Chiudi l'avviso"
        title="Non ora"
        className="-mr-1 flex size-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
      >
        <IconX className="size-3.5" />
      </button>
    </div>
  );
}
