"use client";

import { QUICK_SEARCH_TAGS } from "@/lib/quick-search";
import { useLocale } from "@/lib/i18n/context";
import { chipClass } from "@/lib/ui";

export function QuickSearchTags({ onSelect }: { onSelect: (query: string) => void }) {
  const { tr } = useLocale();

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
        {tr("quickSearch")}
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK_SEARCH_TAGS.map((tag) => (
          <button
            key={tag.query}
            type="button"
            onClick={() => onSelect(tag.query)}
            className={chipClass}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
