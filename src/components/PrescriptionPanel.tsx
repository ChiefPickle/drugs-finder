"use client";

import { drugs } from "@/lib/drugs";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";
import {
  exportPrescriptionJson,
  PRINT_STORAGE_KEY,
  usePrescription,
} from "@/lib/prescription/context";
import { btnLink, btnPrimary, btnSecondary, inputClass, tableHead, tableWrap } from "@/lib/ui";

export function PrescriptionPanel() {
  const { tr } = useLocale();
  const { user } = useAuth();
  const { draft, updateItem, setPatientName, setNotes, clearDraft, removeItem } =
    usePrescription();

  const handlePrint = () => {
    const payload = {
      draft,
      doctorName: user?.name || "",
      items: draft.items.map((item) => ({
        ...item,
        drugName: drugs.find((d) => d.id === item.drugId)?.name || item.drugId,
      })),
      locale: document.documentElement.lang || "he",
    };
    sessionStorage.setItem(PRINT_STORAGE_KEY, JSON.stringify(payload));
    window.open("/print", "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          value={draft.patientName}
          onChange={(e) => setPatientName(e.target.value)}
          placeholder={tr("patientName")}
          className={inputClass}
        />
        <input
          type="text"
          value={draft.notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={tr("prescriptionNotes")}
          className={inputClass}
        />
      </div>

      {draft.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-12 text-center text-[var(--text-muted)]">
          {tr("emptyPrescription")}
        </p>
      ) : (
        <div className={tableWrap}>
          <table className="min-w-full text-sm">
            <thead className={tableHead}>
              <tr>
                <th className="px-4 py-3">{tr("colName")}</th>
                <th className="px-4 py-3">{tr("instructions")}</th>
                <th className="px-4 py-3">{tr("quantity")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {draft.items.map((item) => {
                const drug = drugs.find((d) => d.id === item.drugId);
                return (
                  <tr key={item.drugId} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                      {drug?.name || item.drugId}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) =>
                          updateItem(item.drugId, { instructions: e.target.value })
                        }
                        className={inputClass}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.drugId, { quantity: e.target.value })}
                        className={`${inputClass} w-24`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeItem(item.drugId)}
                        className={`${btnLink} text-[var(--danger)]`}
                      >
                        {tr("removeFromRx")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePrint}
          disabled={draft.items.length === 0}
          className={btnPrimary}
        >
          {tr("printPrescription")}
        </button>
        <button
          type="button"
          onClick={() => exportPrescriptionJson(draft, drugs)}
          disabled={draft.items.length === 0}
          className={btnSecondary}
        >
          {tr("exportPrescription")}
        </button>
        <button
          type="button"
          onClick={clearDraft}
          disabled={draft.items.length === 0}
          className={`${btnSecondary} text-[var(--danger)]`}
        >
          {tr("clearPrescription")}
        </button>
      </div>
    </div>
  );
}
