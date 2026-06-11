import type { DrugEnrichment } from "@/types/drug";

const CACHE_PREFIX = "drugs-finder-enrichments";

function cacheKey(locale: "he" | "en") {
  return `${CACHE_PREFIX}:${locale}`;
}

export function loadCachedEnrichments(
  locale: "he" | "en"
): Record<string, DrugEnrichment> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(cacheKey(locale));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function mergeCachedEnrichments(
  locale: "he" | "en",
  enrichments: Record<string, DrugEnrichment>
): void {
  if (typeof window === "undefined" || !Object.keys(enrichments).length) return;
  const existing = loadCachedEnrichments(locale);
  localStorage.setItem(
    cacheKey(locale),
    JSON.stringify({ ...existing, ...enrichments })
  );
}

export async function fetchEnrichmentsBatch(
  drugIds: string[],
  locale: "he" | "en"
): Promise<Record<string, DrugEnrichment>> {
  const cached = loadCachedEnrichments(locale);
  const missing = drugIds.filter((id) => !cached[id]);

  if (!missing.length) {
    const result: Record<string, DrugEnrichment> = {};
    for (const id of drugIds) {
      if (cached[id]) result[id] = cached[id];
    }
    return result;
  }

  const params = new URLSearchParams({
    ids: missing.join(","),
    locale,
  });
  const res = await fetch(`/api/drugs/enrichment?${params.toString()}`);
  if (!res.ok) return cached;

  const data = await res.json();
  const remote = (data.enrichments || {}) as Record<string, DrugEnrichment>;
  mergeCachedEnrichments(locale, remote);

  const result: Record<string, DrugEnrichment> = { ...cached, ...remote };
  for (const id of drugIds) {
    if (result[id]) continue;
    if (cached[id]) result[id] = cached[id];
  }
  return result;
}
