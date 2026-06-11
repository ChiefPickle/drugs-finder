"use client";

import { useLocale } from "@/lib/i18n/context";

type Tab = "search" | "favorites" | "prescription" | "templates";

export function SidebarNav({
  tab,
  onTabChange,
  favoriteCount,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  favoriteCount: number;
}) {
  const { tr } = useLocale();

  const items: { id: Tab; label: string }[] = [
    { id: "search", label: tr("search") },
    { id: "favorites", label: `${tr("favorites")} (${favoriteCount})` },
    { id: "prescription", label: tr("prescription") },
    { id: "templates", label: tr("templates") },
  ];

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`rounded-lg px-4 py-2.5 text-start text-sm transition-colors ${
              active
                ? "border-s-[3px] border-[var(--accent)] bg-[var(--accent-soft)] font-medium text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
