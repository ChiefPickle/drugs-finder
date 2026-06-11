"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Drug } from "@/types/drug";
import type { DrugEnrichment } from "@/types/drug";
import { heuristicEnrichment } from "@/lib/drug-parse";
import { fetchEnrichmentsBatch, loadCachedEnrichments } from "@/lib/drug-enrichment-client";
import { useLocale } from "@/lib/i18n/context";
import { FREQUENCY_OPTIONS } from "@/types/template";
import type { DrugSelectionRow } from "@/types/template";
import { inputClass, tableHead, tableWrap } from "@/lib/ui";

const PAGE_SIZE = 24;

export function MedicationSelectionTable({
  drugs,
  selections,
  onSelectionChange,
  filter,
}: {
  drugs: Drug[];
  selections: Record<string, DrugSelectionRow>;
  onSelectionChange: (drugId: string, patch: Partial<DrugSelectionRow>) => void;
  filter: string;
}) {
  const { tr, locale } = useLocale();
  const [page, setPage] = useState(1);
  const [enrichments, setEnrichments] = useState<Record<string, DrugEnrichment | null>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const attemptedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    setEnrichments(loadCachedEnrichments(locale));
    attemptedIds.current = new Set();
  }, [locale]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.manufacturer.toLowerCase().includes(q) ||
        d.code.includes(q)
    );
  }, [drugs, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageDrugs = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    let cancelled = false;
    const ids = pageDrugs.map((d) => d.id);
    const missing = ids.filter(
      (id) => !enrichments[id] && !attemptedIds.current.has(id)
    );

    if (!missing.length) return;

    for (const id of missing) attemptedIds.current.add(id);

    setLoadingIds((prev) => {
      const next = new Set(prev);
      for (const id of missing) next.add(id);
      return next;
    });

    fetchEnrichmentsBatch(missing, locale)
      .then((batch) => {
        if (cancelled) return;
        setEnrichments((prev) => {
          const next = { ...prev };
          for (const drug of pageDrugs) {
            if (batch[drug.id]) {
              next[drug.id] = batch[drug.id];
              continue;
            }
            if (next[drug.id]) continue;
            const h = heuristicEnrichment(drug);
            next[drug.id] = {
              drugId: drug.id,
              form: h.form,
              strength: h.strength,
              shortDescription: h.shortDescription,
              locale,
              source: "heuristic",
              updatedAt: new Date().toISOString(),
            };
          }
          return next;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setEnrichments((prev) => {
          const next = { ...prev };
          for (const drug of pageDrugs) {
            if (next[drug.id]) continue;
            const h = heuristicEnrichment(drug);
            next[drug.id] = {
              drugId: drug.id,
              form: h.form,
              strength: h.strength,
              shortDescription: h.shortDescription,
              locale,
              source: "heuristic",
              updatedAt: new Date().toISOString(),
            };
          }
          return next;
        });
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingIds((prev) => {
          const next = new Set(prev);
          for (const id of missing) next.delete(id);
          return next;
        });
      });

    return () => {
      cancelled = true;
    };
  }, [pageDrugs, locale, enrichments]);

  function getRow(drugId: string): DrugSelectionRow {
    return (
      selections[drugId] || {
        drugId,
        selected: false,
        quantity: "",
        frequency: "",
        instructions: "",
      }
    );
  }

  return (
    <div>
      <div className={tableWrap}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="px-3 py-3 text-start">{tr("tplSelect")}</th>
                <th className="px-3 py-3 text-start">{tr("colName")}</th>
                <th className="px-3 py-3 text-start">{tr("tplForm")}</th>
                <th className="px-3 py-3 text-start">{tr("tplStrength")}</th>
                <th className="px-3 py-3 text-start min-w-[12rem]">{tr("tplClinicalDesc")}</th>
                <th className="px-3 py-3 text-start">{tr("quantity")}</th>
                <th className="px-3 py-3 text-start">{tr("tplFrequency")}</th>
                <th className="px-3 py-3 text-start">{tr("instructions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {pageDrugs.map((drug) => {
                const row = getRow(drug.id);
                const enrichment = enrichments[drug.id];
                const loading = loadingIds.has(drug.id);
                const h = heuristicEnrichment(drug);

                return (
                  <tr
                    key={drug.id}
                    className={row.selected ? "bg-[var(--accent-soft)]/40" : undefined}
                  >
                    <td className="px-3 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) =>
                          onSelectionChange(drug.id, { selected: e.target.checked })
                        }
                        aria-label={`${tr("tplSelect")} ${drug.name}`}
                        className="h-4 w-4 accent-[var(--accent)]"
                      />
                    </td>
                    <td className="px-3 py-3 align-top font-medium text-[var(--text-primary)]">
                      {drug.name}
                    </td>
                    <td className="px-3 py-3 align-top text-[var(--text-secondary)]">
                      {loading ? "…" : enrichment?.form || h.form || "—"}
                    </td>
                    <td className="px-3 py-3 align-top text-[var(--text-secondary)]">
                      {loading ? "…" : enrichment?.strength || h.strength || "—"}
                    </td>
                    <td className="px-3 py-3 align-top text-[var(--text-secondary)] text-xs leading-relaxed max-w-xs">
                      {loading
                        ? tr("loadingInfo")
                        : enrichment?.shortDescription || h.shortDescription}
                    </td>
                    <td className="px-3 py-3 align-top">
                      <input
                        type="text"
                        value={row.quantity}
                        disabled={!row.selected}
                        onChange={(e) =>
                          onSelectionChange(drug.id, { quantity: e.target.value })
                        }
                        placeholder={tr("tplQtyPlaceholder")}
                        className={`${inputClass} min-w-[5rem] py-1.5 text-sm disabled:opacity-40`}
                      />
                    </td>
                    <td className="px-3 py-3 align-top">
                      <select
                        value={row.frequency}
                        disabled={!row.selected}
                        onChange={(e) =>
                          onSelectionChange(drug.id, { frequency: e.target.value })
                        }
                        className={`${inputClass} min-w-[9rem] py-1.5 text-sm disabled:opacity-40`}
                      >
                        <option value="">{tr("tplChooseFrequency")}</option>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <input
                        type="text"
                        value={row.instructions}
                        disabled={!row.selected}
                        onChange={(e) =>
                          onSelectionChange(drug.id, { instructions: e.target.value })
                        }
                        placeholder={tr("tplNotesPlaceholder")}
                        className={`${inputClass} min-w-[8rem] py-1.5 text-sm disabled:opacity-40`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
        <span>
          {tr("tplPage")} {safePage} / {totalPages} · {filtered.length.toLocaleString()}{" "}
          {tr("drugsCount")}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40"
          >
            {tr("tplPrev")}
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40"
          >
            {tr("tplNext")}
          </button>
        </div>
      </div>
    </div>
  );
}
