/**
 * Marchio Pall1: il numero 1 costruito come un campo da calcio.
 *
 * Pallone in alto, linea di metà campo con cerchio di centrocampo al centro,
 * arco di rigore in basso, base a tre elementi (area di porta), bandierina
 * staccata da una tacca circolare.
 *
 * Le marcature del campo sono **sottrazioni** (mask), non bianco: così il
 * marchio funziona su qualunque fondo.
 *
 * Due varianti:
 * - `compact` (sotto i ~40px, es. barra in alto): tassello verde con il solo
 *   numero in crema. Pallone e marcature sparirebbero a quelle dimensioni.
 * - completa: il marchio intero, colorato da `currentColor`.
 *
 * Stessa geometria di `public/logo.svg` e `public/icon.svg`: se cambi l'uno,
 * aggiorna gli altri. Coordinate su griglia 512x512.
 */
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
      <defs>
        {compact ? (
          <mask id="pall1-mark-compact" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
            <rect width="512" height="512" fill="#000" />
            <g fill="#fff">
              <path d="M215 84h136v295H215z" />
              <path d="M137 386h37v43h-37zM186 384h166v45H186zM364 386h37v43h-37z" />
              <path d="M215 84C184 98 160 130 148 166l0 28c8 34 36 52 67 58z" />
              <circle cx="137" cy="176" r="40" />
            </g>
            <circle cx="130" cy="202" r="32" fill="#000" />
          </mask>
        ) : (
          <mask id="pall1-mark" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512">
            <rect width="512" height="512" fill="#000" />
            <g fill="#fff">
              <path d="M215 84h136v295H215z" />
              <path d="M137 386h37v43h-37zM186 384h166v45H186zM364 386h37v43h-37z" />
              <path d="M215 84C184 98 160 130 148 166l0 28c8 34 36 52 67 58z" />
              <circle cx="137" cy="176" r="40" />
            </g>
            <g fill="#000">
              <circle cx="130" cy="202" r="32" />
              <g transform="translate(258.9 113.6) rotate(145)">
                <path d="M0-22 20.9-6.8 12.9 17.8-12.9 17.8-20.9-6.8z" />
              </g>
              <g transform="translate(307.1 113.6) rotate(215)">
                <path d="M0-22 20.9-6.8 12.9 17.8-12.9 17.8-20.9-6.8z" />
              </g>
              <g transform="translate(241 148) rotate(90)">
                <path d="M0-22 20.9-6.8 12.9 17.8-12.9 17.8-20.9-6.8z" />
              </g>
              <g transform="translate(325 148) rotate(270)">
                <path d="M0-22 20.9-6.8 12.9 17.8-12.9 17.8-20.9-6.8z" />
              </g>
              <g transform="translate(283 190) rotate(0)">
                <path d="M0-22 20.9-6.8 12.9 17.8-12.9 17.8-20.9-6.8z" />
              </g>
            </g>
            <g fill="none" stroke="#000" strokeWidth="8">
              <path d="M215 314h136" />
              <circle cx="283" cy="314" r="50" />
              <path d="M235 379a37 37 0 0 1 74 0" />
            </g>
          </mask>
        )}
      </defs>

      {compact ? (
        <>
          <rect width="512" height="512" rx="115" fill="currentColor" />
          <rect width="512" height="512" fill="#f5fcf6" mask="url(#pall1-mark-compact)" />
        </>
      ) : (
        <rect width="512" height="512" fill="currentColor" mask="url(#pall1-mark)" />
      )}
    </svg>
  );
}
