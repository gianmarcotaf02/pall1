import Link from "next/link";
import { signOutAction } from "@/lib/actions/auth";
import { Avatar } from "@/components/ui/avatar";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { BottomNav, RailNav } from "@/components/nav";
import { IconLogout, IconShield } from "@/components/icons";
import type { Profile } from "@/types/domain";

function Wordmark() {
  return (
    <span className="font-display text-[19px] font-bold tracking-[-0.03em] text-ink">
      Pall<span className="text-accent-text">1</span>
    </span>
  );
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[232px_1fr]">
      {/* Rail desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule px-3 py-5 md:flex">
        <div className="flex items-center gap-2.5 px-3 pb-6">
          <LogoMark compact className="size-8 text-accent-solid" title="" />
          <Wordmark />
        </div>

        <RailNav isAdmin={profile.is_admin} />

        <div className="mt-auto space-y-3 border-t border-rule pt-4">
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-control px-2 py-2 transition-colors duration-150 hover:bg-surface-2"
          >
            <Avatar name={profile.nickname} src={profile.avatar_url} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-ink">{profile.nickname}</span>
              <span className="block truncate text-[11px] text-muted">
                {profile.is_admin ? "Amministratore" : "Giocatore"}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={signOutAction} className="ml-auto">
              <button
                type="submit"
                className="inline-flex h-10 items-center gap-2 rounded-control px-3 text-[13px] text-muted transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              >
                <IconLogout className="size-[18px]" />
                Esci
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Barra mobile */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-rule bg-paper px-4 md:hidden">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Pall1 — home">
            <LogoMark compact className="size-8 text-accent-solid" title="" />
            <Wordmark />
          </Link>

          <div className="ml-auto flex items-center gap-1">
            {profile.is_admin ? (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-rule px-3 text-[12px] font-medium text-muted transition-colors duration-150 hover:text-ink"
              >
                <IconShield className="size-4 text-accent-text" />
                Gestione
              </Link>
            ) : null}
            <ThemeToggle />
            <Link href="/profile" aria-label="Il tuo profilo">
              <Avatar name={profile.nickname} src={profile.avatar_url} size="sm" />
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1040px] flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
