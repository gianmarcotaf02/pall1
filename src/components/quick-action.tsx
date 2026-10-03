import Link from "next/link";
import { IconChevronRight } from "@/components/icons";

/**
 * Scelta rapida in home: "cosa vuoi creare?".
 * Icona su tinta d'accento, etichetta, riga di contesto e invito a destra.
 */
export function QuickAction({
  href,
  icon,
  title,
  hint,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-card border border-rule bg-surface px-4 py-3.5 transition-colors duration-150 hover:border-line-strong hover:bg-surface-2"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-accent/15 text-accent-text dark:bg-accent/25">
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-ink">{title}</span>
        <span className="block truncate text-[12px] text-muted">{hint}</span>
      </span>

      <IconChevronRight className="size-4 shrink-0 text-muted transition-transform duration-150 ease-out-soft group-hover:translate-x-0.5" />
    </Link>
  );
}
