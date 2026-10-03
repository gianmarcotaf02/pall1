/**
 * Marchio Pall1: il numero 1 costruito come un campo da calcio.
 *
 * Variante completa: pallone, linea di metà campo con cerchio di centrocampo,
 * arco di rigore, base a tre elementi (area di porta) e bandierina staccata da
 * una tacca circolare.
 *
 * Variante `compact` (sotto i ~40px, es. barra in alto e icona app): solo il
 * numero con la bandierina. Pallone e marcature sono spessi 1-2px a quelle
 * dimensioni, e la base a tre pezzi diventa una riga sporca.
 *
 * Le marcature del campo sono **sottrazioni** (mask), non bianco: così il
 * marchio funziona su qualunque fondo. La bandierina si sovrappone alla gamba
 * di proposito: se le due forme si limitano a toccarsi, l'antialiasing lascia
 * una fessura di 1px che sembra un errore.
 *
 * Stessa geometria di `public/logo.svg` e `public/icon.svg`: se cambi l'uno,
 * aggiorna gli altri. Coordinate su griglia 512x512.
 */

/** Bandierina: entra dentro la gamba (x 215) per evitare la cucitura. */
const FLAG = "M230 84C190 96 158 130 148 166l0 28c8 34 36 52 82 58z";
const STEM = "M215 84h136v295H215z";
const BASE = "M137 386h37v43h-37zM186 384h166v45H186zM364 386h37v43h-37z";
const FLAG_TIP = { cx: 137, cy: 176, r: 40 };
const NOTCH = { cx: 130, cy: 202, r: 32 };

const PENTAGONS = [
  { x: 258.9, y: 113.6, rotate: 145 },
  { x: 307.1, y: 113.6, rotate: 215 },
  { x: 241, y: 148, rotate: 90 },
  { x: 325, y: 148, rotate: 270 },
  { x: 283, y: 190, rotate: 0 },
];

const PENTAGON_PATH = "M0-22 20.9-6.8 12.9 17.8-12.9 17.8-20.9-6.8z";

function CompactMask() {
  return (
    <mask id="pall1-mark-compact" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
      <rect width="512" height="512" fill="#000" />
      <g fill="#fff">
        <path d={STEM} />
        <path d={FLAG} />
        <circle cx={FLAG_TIP.cx} cy={FLAG_TIP.cy} r={FLAG_TIP.r} />
      </g>
      <circle cx={NOTCH.cx} cy={NOTCH.cy} r={NOTCH.r} fill="#000" />
    </mask>
  );
}

function FullMask() {
  return (
    <mask id="pall1-mark" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
      <rect width="512" height="512" fill="#000" />
      <g fill="#fff">
        <path d={STEM} />
        <path d={BASE} />
        <path d={FLAG} />
        <circle cx={FLAG_TIP.cx} cy={FLAG_TIP.cy} r={FLAG_TIP.r} />
      </g>
      <g fill="#000">
        <circle cx={NOTCH.cx} cy={NOTCH.cy} r={NOTCH.r} />
        {PENTAGONS.map((panel) => (
          <g key={`${panel.x}-${panel.y}`} transform={`translate(${panel.x} ${panel.y}) rotate(${panel.rotate})`}>
            <path d={PENTAGON_PATH} />
          </g>
        ))}
      </g>
      <g fill="none" stroke="#000" strokeWidth="8">
        <path d="M215 314h136" />
        <circle cx="283" cy="314" r="50" />
        <path d="M235 379a37 37 0 0 1 74 0" />
      </g>
    </mask>
  );
}

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
      <defs>{compact ? <CompactMask /> : <FullMask />}</defs>

      {compact ? (
        <>
          <rect width="512" height="512" rx="115" fill="currentColor" />
          {/* senza la base il numero è più corto: lo ricentro in verticale */}
          <g transform="translate(0 26)">
            <rect width="512" height="512" fill="#f5fcf6" mask="url(#pall1-mark-compact)" />
          </g>
        </>
      ) : (
        <rect width="512" height="512" fill="currentColor" mask="url(#pall1-mark)" />
      )}
    </svg>
  );
}
