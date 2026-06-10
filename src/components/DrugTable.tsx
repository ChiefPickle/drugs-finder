"use client";

import type { Drug } from "@/types/drug";
import { formatPrice } from "@/lib/drugs";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";
import { usePrescription } from "@/lib/prescription/context";
import { btnLink, tableHead, tableWrap } from "@/lib/ui";
import { DrugInfoPanel } from "@/components/DrugInfoPanel";

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 ${filled ? "fill-[var(--accent)] text-[var(--accent)]" : "fill-none text-[var(--text-muted)]"}`}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
    </svg>
  );
}

function DrugRow({
  drug,
  isFavorite,
  onToggleFavorite,
  expanded,
  onToggleExpand,
  inPrescription,
  onTogglePrescription,
}: {
  drug: Drug;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  inPrescription: boolean;
  onTogglePrescription: (drug: Drug) => void;
}) {
  const { tr } = useLocale();

  return (
    <>
      <tr className="border-b border-[var(--border)] transition-colors hover:bg-[var(--bg-elevated)]">
        <td className="px-4 py-3.5">
          <button
            type="button"
            aria-label={isFavorite ? tr("removeFavorite") : tr("addFavorite")}
            onClick={() => onToggleFavorite(drug.id)}
            className="rounded p-1 transition-colors hover:bg-[var(--accent-soft)]"
          >
            <StarIcon filled={isFavorite} />
          </button>
        </td>
        <td className="px-4 py-3.5 font-medium text-[var(--text-primary)]">{drug.name}</td>
        <td className="px-4 py-3.5 whitespace-nowrap text-[var(--text-secondary)]">
          {formatPrice(drug.maxConsumerPriceWithVat)}
        </td>
        <td className="px-4 py-3.5 text-[var(--text-secondary)]">{drug.manufacturer || "—"}</td>
        <td className="px-4 py-3.5 text-[var(--text-secondary)]">{drug.packageSize}</td>
        <td className="px-4 py-3.5">
          <button type="button" onClick={() => onToggleExpand(drug.id)} className={btnLink}>
            {expanded ? tr("close") : tr("info")}
          </button>
        </td>
        <td className="px-4 py-3.5">
          <button
            type="button"
            onClick={() => onTogglePrescription(drug)}
            className={`${btnLink} ${inPrescription ? "text-[var(--danger)]" : ""}`}
          >
            {inPrescription ? tr("removeFromRx") : tr("addToRx")}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-[var(--bg-secondary)]">
          <td colSpan={7} className="border-b border-[var(--border)] px-6 py-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
              AI Summary
            </p>
            <DrugInfoPanel drugId={drug.id} />
          </td>
        </tr>
      )}
    </>
  );
}

export function DrugTable({
  drugs: rows,
  emptyMessage,
  expandedId,
  onToggleExpand,
}: {
  drugs: Drug[];
  emptyMessage: string;
  expandedId: string | null;
  onToggleExpand: (id: string) => void;
}) {
  const { favoriteIds, toggleFavorite } = useAuth();
  const { isInPrescription, addItem, removeItem } = usePrescription();
  const { tr } = useLocale();

  const handleTogglePrescription = (drug: Drug) => {
    if (isInPrescription(drug.id)) {
      removeItem(drug.id);
    } else {
      addItem({ drugId: drug.id, instructions: "", quantity: "1" });
    }
  };

  return (
    <div className={tableWrap}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className={tableHead}>
            <tr>
              <th className="px-4 py-3">{tr("colFavorite")}</th>
              <th className="px-4 py-3">{tr("colName")}</th>
              <th className="px-4 py-3">{tr("colPrice")}</th>
              <th className="px-4 py-3">{tr("colManufacturer")}</th>
              <th className="px-4 py-3">{tr("colPackage")}</th>
              <th className="px-4 py-3">{tr("colInfo")}</th>
              <th className="px-4 py-3">{tr("colAddRx")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-[var(--text-muted)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((drug) => (
                <DrugRow
                  key={drug.id}
                  drug={drug}
                  isFavorite={favoriteIds.includes(drug.id)}
                  onToggleFavorite={toggleFavorite}
                  expanded={expandedId === drug.id}
                  onToggleExpand={onToggleExpand}
                  inPrescription={isInPrescription(drug.id)}
                  onTogglePrescription={handleTogglePrescription}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
