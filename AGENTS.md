<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Progetto Supabase collegato: non servono conferme dall'utente

Questo repository è **già collegato** al progetto Supabase remoto. Vale a dire che
l'agente **può applicare le migration da solo**, senza chiedere all'utente di farlo.

- Progetto: `pall1` · ref `yivbesunamjxdmbczmda` · regione Francoforte.
  Il link è già configurato in `supabase/.temp/project-ref` (`supabase link` è già stato eseguito).
- Credenziali in **`.env.local`** (non versionato): `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PROJECT_ID`.
- **Password del Postgres remoto: `pall1`** (vedi README §1.4; va ruotata prima di condividere
  il link dell'app). La CLI non la memorizza: va passata con `-p`.
- `supabase/.temp/pooler-url` esiste ma può avere una password stantia: non fidarsi, usare `-p`.

### Comandi utili

```bash
# Confronta migration locali e remote (l'ultima riga deve combaciare)
supabase migration list

# Applica le migration nuove: SEMPRE prima il dry-run, poi il push
supabase db push --dry-run -p "pall1" --yes
supabase db push -p "pall1" --yes

# Rigenera i tipi dal DB. Attenzione: `>` tronca il file anche se il comando
# fallisce. Scrivere su un file temporaneo, confrontare, poi sostituire.
supabase gen types typescript --linked > tmp/database.types.generated.ts
```

- Non rigenerare `src/types/database.types.ts` alla leggera: se il diff è vuoto i tipi
  a mano vanno bene così; se differisce, sostituire solo dopo aver visto il diff.
- `npm run test:rls` (`tests/rls/rls.test.mjs`) usa `SUPABASE_SERVICE_ROLE_KEY` da `.env.local`:
  è l'unico test che tocca il DB reale.
- **Realtime:** le nuove tabelle che devono aggiornarsi in tempo reale vanno aggiunte alla
  publication `supabase_realtime` e, se servono gli eventi `DELETE` sotto RLS, con
  `alter table … replica identity full;` (come in `…_chat.sql`).
