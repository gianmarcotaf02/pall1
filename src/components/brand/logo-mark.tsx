/**
 * Marchio Pall1: il numero 1 costruito come un campo da calcio (pallone, linea di
 * metà campo con cerchio di centrocampo, arco di rigore, base a tre pezzi e
 * bandierina staccata da una tacca).
 *
 * I tracciati NON sono disegnati a mano: sono generati con potrace dal
 * riferimento `docs/logo/riferimento.jpg` (vedi `scripts/trace-logo.py`, che li
 * scrive in `logo-paths.json`). Ridisegnarli a mano aveva prodotto una sagoma
 * che somigliava al riferimento solo da lontano: così invece è la stessa forma.
 *
 * Tre tracciati:
 *
 * | chiave     | cos'è                                              | colore       |
 * |------------|----------------------------------------------------|--------------|
 * | `hull`     | sagoma piena, marcature comprese                    | `currentColor`|
 * | `markings` | pallone e marcature del campo, sopra la sagoma      | crema         |
 * | `compact`  | sagoma senza base, per icona app e barra in alto    | crema         |
 *
 * La tacca della bandierina è un **vuoto vero** nella sagoma: la punta è un
 * pezzo staccato, quindi lascia vedere il fondo su cui poggia il marchio (carta
 * in tema chiaro, carta scura in tema scuro) come nel riferimento. Per questo il
 * marchio non ha bisogno di sapere su che fondo sta, e non usa maschere SVG né
 * forme colorate "a imitazione" del fondo.
 *
 * La variante `compact` (barra in alto, icona app) è la stessa sagoma senza la
 * base: sotto i ~40px pallone e marcature sono spessi 1-2px, e la base a tre
 * pezzi diventa una riga sporca.
 */

import paths from "./logo-paths.json";

/**
 * Colori fissi del marchio: non cambiano con il tema, così la tessera in app è
 * identica a favicon e icona PWA e le marcature del campo restano leggibili
 * anche su carta scura.
 */
const TILE = "#09782b";
const CREAM = "#f5fcf6";

export function LogoMark({
  className,
  title,
  compact = false,
}: {
  className?: string;
  title?: string;
  compact?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable={false}
      className={className}
    >
      {compact ? (
        <>
          <rect width="512" height="512" rx="115" fill={TILE} />
          <path fill={CREAM} d={paths.compact} />
        </>
      ) : (
        <>
          <path fill="currentColor" d={paths.hull} />
          <path fill={CREAM} d={paths.markings} />
        </>
      )}
    </svg>
  );
}
