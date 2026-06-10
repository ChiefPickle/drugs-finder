"use client";

import { useCallback, useEffect, useState } from "react";
import type { DrugInfo } from "@/types/drug";
import { useLocale } from "@/lib/i18n/context";
import { btnLink } from "@/lib/ui";

export function DrugInfoPanel({ drugId }: { drugId: string }) {
  const { tr, locale } = useLocale();
  const [info, setInfo] = useState<DrugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInfo = useCallback(
    async (refresh = false) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ locale });
        if (refresh) params.set("refresh", "1");
        const res = await fetch(`/api/drugs/${drugId}/info?${params}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || data.error || tr("networkError"));
          setInfo(null);
          return;
        }
        setInfo(data);
      } catch {
        setError(tr("networkError"));
        setInfo(null);
      } finally {
        setLoading(false);
      }
    },
    [drugId, locale, tr]
  );

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  if (loading) {
    return <p className="text-sm text-[var(--text-muted)]">{tr("loadingInfo")}</p>;
  }

  if (error) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-[var(--warning)]">{error}</p>
        <button type="button" onClick={() => fetchInfo(true)} className={btnLink}>
          {tr("retry")}
        </button>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="space-y-3 text-sm leading-relaxed text-[var(--text-secondary)]">
      <p className="text-[var(--text-primary)]">{info.summary}</p>
      <div>
        <span className="font-medium text-[var(--text-primary)]">{tr("indications")}: </span>
        {info.indications}
      </div>
      <div>
        <span className="font-medium text-[var(--text-primary)]">{tr("dosage")}: </span>
        {info.dosage}
      </div>
      <div>
        <span className="font-medium text-[var(--text-primary)]">{tr("warnings")}: </span>
        {info.warnings}
      </div>
      <p className="text-xs text-[var(--text-muted)]">{tr("aiDisclaimer")}</p>
    </div>
  );
}
