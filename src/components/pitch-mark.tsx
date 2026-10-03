export function PitchMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      aria-hidden
      className={className}
    >
      <rect x="1" y="1" width="318" height="198" rx="3" />
      <line x1="160" y1="1" x2="160" y2="199" />
      <circle cx="160" cy="100" r="34" />
      <circle cx="160" cy="100" r="2" fill="currentColor" stroke="none" />
      <rect x="1" y="55" width="34" height="90" />
      <rect x="285" y="55" width="34" height="90" />
      <path d="M35 78a34 34 0 0 1 0 44" />
      <path d="M285 78a34 34 0 0 0 0 44" />
    </svg>
  );
}
