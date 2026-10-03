"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconCalendar,
  IconPitch,
  IconPodium,
  IconShield,
  IconUser,
  IconUsers,
} from "@/components/icons";

const ITEMS = [
  { href: "/", label: "Home", Icon: IconPitch, exact: true },
  { href: "/matches", label: "Partite", Icon: IconCalendar, exact: false },
  { href: "/standings", label: "Classifica", Icon: IconPodium, exact: false },
  { href: "/players", label: "Giocatori", Icon: IconUsers, exact: false },
  { href: "/profile", label: "Profilo", Icon: IconUser, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RailNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5" aria-label="Navigazione principale">
      {ITEMS.map(({ href, label, Icon, exact }) => {
        const active = isActive(pathname, href, exact);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={[
              "group flex h-10 items-center gap-3 rounded-control px-3 text-sm transition-colors duration-150",
              active ? "bg-surface-2 font-medium text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
            ].join(" ")}
          >
            <Icon className={["size-[18px]", active ? "text-accent-text" : "text-muted group-hover:text-ink"].join(" ")} />
            {label}
            {active ? <span className="ml-auto size-1.5 rounded-full bg-accent" aria-hidden /> : null}
          </Link>
        );
      })}

      {isAdmin ? (
        <Link
          href="/admin"
          aria-current={pathname.startsWith("/admin") ? "page" : undefined}
          className={[
            "mt-2 flex h-10 items-center gap-3 rounded-control px-3 text-sm transition-colors duration-150",
            pathname.startsWith("/admin")
              ? "bg-surface-2 font-medium text-ink"
              : "text-muted hover:bg-surface-2 hover:text-ink",
          ].join(" ")}
        >
          <IconShield className="size-[18px] text-accent-text" />
          Gestione
          <span className="ml-auto rounded-full border border-rule px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted">
            ADMIN
          </span>
        </Link>
      ) : null}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigazione principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface pb-[max(env(safe-area-inset-bottom),0.25rem)] md:hidden"
    >
      <ul className="flex items-stretch">
        {ITEMS.map(({ href, label, Icon, exact }) => {
          const active = isActive(pathname, href, exact);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex h-16 flex-col items-center justify-center gap-1 text-[10.5px] font-medium transition-colors duration-150",
                  active ? "text-accent-text" : "text-muted",
                ].join(" ")}
              >
                <Icon className="size-[22px]" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
