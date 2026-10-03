import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AvatarForm } from "@/components/profile/avatar-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireProfile } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth";
import { signOutAction } from "@/lib/actions/auth";
import { getPositionsByProfile } from "@/lib/queries";

export const metadata: Metadata = { title: "Il tuo profilo" };

export default async function ProfilePage() {
  const profile = await requireProfile();
  const [user, positionsByProfile] = await Promise.all([
    getCurrentUser(),
    getPositionsByProfile([profile.id]),
  ]);

  const positions = positionsByProfile.get(profile.id) ?? [];

  return (
    <>
      <PageHeader
        title="Il tuo profilo"
        description="Aggiorna i tuoi dati: compaiono nelle partite e nella classifica."
      />

      <section className="rounded-card border border-rule bg-surface p-5 md:p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Foto</h2>
        <AvatarForm profile={profile} />
      </section>

      <section className="mt-6 rounded-card border border-rule bg-surface p-5 md:p-6">
        <h2 className="mb-5 text-[15px] font-semibold text-ink">Dati giocatore</h2>
        <ProfileForm profile={profile} positions={positions} />
      </section>

      <section className="mt-6 rounded-card border border-rule bg-surface p-5 md:p-6">
        <h2 className="mb-4 text-[15px] font-semibold text-ink">Account</h2>

        <dl className="space-y-3 text-[13.5px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-ink">{user?.email ?? "—"}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted">Permessi</dt>
            <dd className="font-medium text-ink">
              {profile.is_admin ? "Amministratore" : "Giocatore"}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-muted">Stato</dt>
            <dd className="font-medium text-ink">{profile.is_active ? "Attivo" : "Non attivo"}</dd>
          </div>
        </dl>

        <div className="mt-5 border-t border-rule pt-4">
          <form action={signOutAction}>
            <SubmitButton variant="secondary" size="sm" pendingLabel="Uscita…">
              Esci dall&apos;account
            </SubmitButton>
          </form>
        </div>
      </section>
    </>
  );
}
