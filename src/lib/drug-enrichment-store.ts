import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { DrugEnrichment } from "@/types/drug";

const RUNTIME_FILE = resolve(process.cwd(), ".data/drug-enrichments.json");
const BUNDLED_FILE = resolve(process.cwd(), "src/data/drug-enrichments.json");

function enrichmentKey(drugId: string, locale: "he" | "en") {
  return `${drugId}:${locale}`;
}

function loadMap(): Record<string, DrugEnrichment> {
  const merged: Record<string, DrugEnrichment> = {};

  for (const file of [BUNDLED_FILE, RUNTIME_FILE]) {
    if (!existsSync(file)) continue;
    try {
      const data = JSON.parse(readFileSync(file, "utf-8")) as Record<string, DrugEnrichment>;
      Object.assign(merged, data);
    } catch {
      // ignore corrupt file
    }
  }

  return merged;
}

function saveRuntimeMap(map: Record<string, DrugEnrichment>): void {
  try {
    const dir = resolve(process.cwd(), ".data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(RUNTIME_FILE, JSON.stringify(map, null, 2));
  } catch (error) {
    console.warn("Drug enrichment runtime save failed:", error);
  }
}

export function getDrugEnrichment(
  drugId: string,
  locale: "he" | "en"
): DrugEnrichment | null {
  const map = loadMap();
  return map[enrichmentKey(drugId, locale)] || null;
}

export function isEnrichmentComplete(enrichment: DrugEnrichment | null): boolean {
  if (!enrichment) return false;
  return Boolean(
    enrichment.form &&
      enrichment.form !== "—" &&
      enrichment.shortDescription &&
      enrichment.shortDescription.length > 10
  );
}

export function saveDrugEnrichment(enrichment: DrugEnrichment): DrugEnrichment {
  const map = loadMap();
  const key = enrichmentKey(enrichment.drugId, enrichment.locale);
  map[key] = enrichment;
  saveRuntimeMap(map);
  return enrichment;
}

export function getEnrichmentsForIds(
  drugIds: string[],
  locale: "he" | "en"
): Record<string, DrugEnrichment | null> {
  const result: Record<string, DrugEnrichment | null> = {};
  for (const id of drugIds) {
    result[id] = getDrugEnrichment(id, locale);
  }
  return result;
}
