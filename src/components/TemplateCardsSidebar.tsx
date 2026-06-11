"use client";

import type { PredefinedPrescriptionTemplate } from "@/types/template";
import { useLocale } from "@/lib/i18n/context";

export function TemplateCardsSidebar({
  templates,
  onSelect,
}: {
  templates: PredefinedPrescriptionTemplate[];
  onSelect?: (template: PredefinedPrescriptionTemplate) => void;
}) {
  const { tr } = useLocale();

  return (
    <aside className="xl:w-80 shrink-0">
      <h2 className="font-serif text-lg text-[var(--text-primary)] mb-1">
        {tr("tplSavedTitle")}
      </h2>
      <p className="text-xs text-[var(--text-muted)] mb-4">{tr("tplSavedSubtitle")}</p>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/50 p-6 text-center text-sm text-[var(--text-muted)]">
          {tr("tplEmpty")}
        </div>
      ) : (
        <ul className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pe-1">
          {templates.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => onSelect?.(template)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 text-start transition-colors hover:border-[var(--accent)] hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none" aria-hidden>
                    {template.icon || "💊"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-primary)] truncate">
                      {template.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--accent)]">
                      {tr("tplCondition")}: {template.condition}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2">
                      {template.description}
                    </p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {tr("tplPatientGroup")}: {template.targetPatientGroup || "—"}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                      {tr("tplDrugsIncluded")}: {template.drugs.length}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
