import Link from "next/link";

/**
 * Tab condivise fra partite e sondaggi: la programmazione è una sola cosa,
 * quindi sta sotto un'unica voce di navigazione.
 */
export function SectionTabs({ active }: { active: "matches" | "polls" }) {
  const items = [
    { key: "matches" as const, href: "/matches", label: "Partite" },
    { key: "polls" as const, href: "/polls", label: "Sondaggi" },
  ];

  return (
    <div className="mb-5 inline-flex rounded-control bg-surface-2 p-1" role="tablist">
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            role="tab"
            aria-selected={selected}
            className={[
              "rounded-[7px] px-3.5 py-2 text-[13px] font-medium transition-colors duration-150",
              selected ? "bg-accent-solid text-accent-on" : "text-muted hover:text-ink",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
