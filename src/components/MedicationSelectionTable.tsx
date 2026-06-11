"use client";

import { useEffect, useMemo, useState } from "react";
import type { Drug } from "@/types/drug";
import type { DrugEnrichment } from "@/types/drug";
import { heuristicEnrichment } from "@/lib/drug-parse";
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

    async function load() {
      for (const id of ids) {
        if (cancelled) return;
        if (enrichments[id] !== undefined) continue;
        setLoadingIds((prev) => new Set(prev).add(id));
        try {
          const res = await fetch(`/api/drugs/${id}/enrichment?locale=${locale}`);
          if (res.ok) {
            const data = (await res.json()) as DrugEnrichment;
            if (!cancelled) {
              setEnrichments((prev) => ({ ...prev, [id]: data }));
            }
          } else {
            const drug = pageDrugs.find((d) => d.id === id);
            if (drug && !cancelled) {
              const h = heuristicEnrichment(drug);
              setEnrichments((prev) => ({
                ...prev,
                [id]: {
                  drugId: id,
                  form: h.form,
                  strength: h.strength,
                  shortDescription: h.shortDescription,
                  locale,
                  source: "heuristic",
                  updatedAt: new Date().toISOString(),
                },
              }));
            }
          }
        } catch {
          const drug = pageDrugs.find((d) => d.id === id);
          if (drug && !cancelled) {
            const h = heuristicEnrichment(drug);
            setEnrichments((prev) => ({
              ...prev,
              [id]: {
                drugId: id,
                form: h.form,
                strength: h.strength,
                shortDescription: h.shortDescription,
                locale,
                source: "heuristic",
                updatedAt: new Date().toISOString(),
              },
            }));
          }
        } finally {
          if (!cancelled) {
            setLoadingIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageDrugs.map((d) => d.id).join(","), locale]);

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
