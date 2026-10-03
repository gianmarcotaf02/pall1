/**
 * Marchio Pall1: il numero 1 costruito come un campo da calcio.
 *
 * Variante completa: pallone, linea di metà campo con cerchio di centrocampo,
 * arco di rigore, base a tre elementi (area di porta) e bandierina staccata da
 * una tacca circolare.
 *
 * Variante `compact` (sotto i ~40px, es. barra in alto e icona app): solo il
 * numero con la bandierina: pallone e marcature sono spessi 1-2px a quelle
 * dimensioni, e la base a tre pezzi diventa una riga sporca.
 *
 * COME È COSTRUITO — e perché non ci sono mask.
 * Pallone e marcature del campo sono **forme piene color crema**, non ritagli:
 * una `<mask>` richiede che il browser la risolva, e Safari non la applica in
 * modo affidabile quando è dentro un gruppo trasformato o quando l'SVG è usato
 * come favicon. Risultato, in quei casi: un quadrato tutto del colore del
 * marchio. Con le forme piene non può succedere.
 *
 * Il crema è **fisso**, non preso dal tema: se le marcature seguissero il colore
 * della pagina, in tema scuro il pallone e il cerchio di centrocampo diventano
 * neri e il marchio sembra bucherellato, non più il logo. L'unico elemento che
 * deve fondersi con il fondo è la tacca della bandierina, che è un vero "buco"
 * e quindi usa `var(--paper)`.
 *
 * Le forme dello stesso colore si **sovrappongono** (la bandierina entra nella
 * gamba): due forme che si limitano a toccarsi lasciano una fessura di 1px per
 * antialiasing.
 *
 * Coordinate su griglia 512x512. Stessa geometria di `public/logo.svg`,
 * `public/icon.svg` e `public/icon-maskable.svg`: se cambi uno, aggiorna gli altri.
 */

const STEM = "M215 84h136v295H215z";
const FLAG = "M230 84C190 96 158 130 148 166l0 28c8 34 36 52 82 58z";
const FLAG_TIP = { cx: 137, cy: 176, r: 40 };
const NOTCH = { cx: 130, cy: 202, r: 32 };

const BASE = ["M137 386h37v43h-37z", "M186 384h166v45H186z", "M364 386h37v43h-37z"];

const PENTAGONS = [
  { x: 258.9, y: 113.6, rotate: 145 },
  { x: 307.1, y: 113.6, rotate: 215 },
  { x: 241, y: 148, rotate: 90 },
  { x: 325, y: 148, rotate: 270 },
  { x: 283, y: 190, rotate: 0 },
];
const PENTAGON_PATH = "M0-22 20.9-6.8 12.9 17.8-12.9 17.8-20.9-6.8z";

/**
 * Colori fissi del marchio: non cambiano con il tema, così la tessera in app è
 * identica a favicon e icona PWA e le marcature del campo restano leggibili
 * anche su carta scura.
 */
const TILE = "#09782b";
const TILE_MARK = "#f5fcf6";

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
          {/* tassello */}
          <rect width="512" height="512" rx="115" fill={TILE} />
          {/* senza la base il numero è più corto: lo ricentro in verticale */}
          <g transform="translate(0 26)">
            <g fill={TILE_MARK}>
              <path d={STEM} />
              <path d={FLAG} />
              <circle cx={FLAG_TIP.cx} cy={FLAG_TIP.cy} r={FLAG_TIP.r} />
            </g>
            {/* tacca: cerchio del colore del tassello */}
            <circle cx={NOTCH.cx} cy={NOTCH.cy} r={NOTCH.r} fill={TILE} />
          </g>
        </>
      ) : (
        <>
          <g fill="currentColor">
            <path d={STEM} />
            {BASE.map((d) => (
              <path key={d} d={d} />
            ))}
            <path d={FLAG} />
            <circle cx={FLAG_TIP.cx} cy={FLAG_TIP.cy} r={FLAG_TIP.r} />
          </g>

          {/* tacca della bandierina: è un "buco", quindi prende il colore
              della superficie su cui poggia il marchio */}
          <circle cx={NOTCH.cx} cy={NOTCH.cy} r={NOTCH.r} style={{ fill: "var(--paper)" }} />

          {/* pallone e marcature del campo: crema fisso, non il colore del
              fondo, altrimenti in tema scuro si vedono solo dei buchi neri */}
          <g fill={TILE_MARK}>
            {PENTAGONS.map((panel) => (
              <g
                key={`${panel.x}-${panel.y}`}
                transform={`translate(${panel.x} ${panel.y}) rotate(${panel.rotate})`}
              >
                <path d={PENTAGON_PATH} />
              </g>
            ))}
            {/* linea di metà campo */}
            <rect x="215" y="310" width="136" height="8" />
            {/* cerchio di centrocampo (anello) */}
            <path
              fillRule="evenodd"
              d="M229 314a54 54 0 1 0 108 0a54 54 0 1 0-108 0M237 314a46 46 0 1 0 92 0a46 46 0 1 0-92 0"
            />
            {/* arco di rigore */}
            <path d="M242 379A41 41 0 0 1 324 379A33 33 0 0 0 242 379Z" />
          </g>
        </>
      )}
    </svg>
  );
}
