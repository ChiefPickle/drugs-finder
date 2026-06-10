"use client";

import { useEffect, useState } from "react";
import { t, type Locale } from "@/lib/i18n/translations";
import { PRINT_STORAGE_KEY } from "@/lib/prescription/context";

interface PrintPayload {
  draft: {
    patientName: string;
    notes: string;
    items: { drugId: string; drugName: string; instructions: string; quantity: string }[];
  };
  doctorName: string;
  locale: Locale;
}

export default function PrintPage() {
  const [payload, setPayload] = useState<PrintPayload | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(PRINT_STORAGE_KEY);
    if (raw) setPayload(JSON.parse(raw) as PrintPayload);
  }, []);

  const locale = payload?.locale === "en" ? "en" : "he";

  useEffect(() => {
    if (!payload) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "he" ? "rtl" : "ltr";
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [payload, locale]);

  if (!payload) {
    return <div className="p-8 text-center text-[var(--text-muted)]">No prescription data.</div>;
  }

  const date = new Date().toLocaleDateString(locale === "he" ? "he-IL" : "en-US");

  return (
    <div className="mx-auto max-w-3xl p-8 text-[var(--text-primary)]">
      <button
        type="button"
        onClick={() => window.print()}
        className="no-print mb-6 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
      >
        {t(locale, "printPrescription")}
      </button>
      <h1 className="font-serif text-2xl font-normal">{t(locale, "rxTitle")}</h1>
      <div className="mt-4 space-y-1 text-sm text-[var(--text-secondary)]">
        <div>
          {t(locale, "rxDate")}: {date}
        </div>
        <div>
          {t(locale, "rxDoctor")}: {payload.doctorName || "—"}
        </div>
        <div>
          {t(locale, "rxPatient")}: {payload.draft.patientName || "—"}
        </div>
      </div>
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[var(--bg-secondary)]">
            <th className="border border-[var(--border)] px-3 py-2">#</th>
            <th className="border border-[var(--border)] px-3 py-2">{t(locale, "rxDrug")}</th>
            <th className="border border-[var(--border)] px-3 py-2">{t(locale, "instructions")}</th>
            <th className="border border-[var(--border)] px-3 py-2">{t(locale, "quantity")}</th>
          </tr>
        </thead>
        <tbody>
          {payload.draft.items.map((item, index) => (
            <tr key={item.drugId}>
              <td className="border border-[var(--border)] px-3 py-2">{index + 1}</td>
              <td className="border border-[var(--border)] px-3 py-2">{item.drugName}</td>
              <td className="border border-[var(--border)] px-3 py-2">{item.instructions || "—"}</td>
              <td className="border border-[var(--border)] px-3 py-2">{item.quantity || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {payload.draft.notes && (
        <p className="mt-6 text-sm">
          <strong>{t(locale, "rxNotes")}:</strong> {payload.draft.notes}
        </p>
      )}
    </div>
  );
}
