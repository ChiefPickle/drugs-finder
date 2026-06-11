import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import type { DrugEnrichment } from "@/types/drug";
import {
  getDrugEnrichmentFromDb,
  getDrugEnrichmentsFromDb,
  saveDrugEnrichmentToDb,
} from "@/lib/drug-enrichment-db";

const RUNTIME_FILE = process.env.VERCEL
  ? resolve("/tmp", "drugs-finder-drug-enrichments.json")
  : resolve(process.cwd(), ".data/drug-enrichments.json");
const BUNDLED_FILE = resolve(process.cwd(), "src/data/drug-enrichments.json");

function enrichmentKey(drugId: string, locale: "he" | "en") {
  return `${drugId}:${locale}`;
}

function loadJsonMap(): Record<string, DrugEnrichment> {
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

function saveRuntimeJsonMap(map: Record<string, DrugEnrichment>): void {
  try {
    if (!process.env.VERCEL) {
      const dir = resolve(process.cwd(), ".data");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    }
    writeFileSync(RUNTIME_FILE, JSON.stringify(map, null, 2));
  } catch (error) {
    console.warn("Drug enrichment runtime save failed:", error);
  }
}

export function getDrugEnrichment(
  drugId: string,
  locale: "he" | "en"
): DrugEnrichment | null {
  try {
    const fromDb = getDrugEnrichmentFromDb(drugId, locale);
    if (fromDb) return fromDb;
  } catch (error) {
    console.warn("Drug enrichment DB read failed:", error);
  }

  const map = loadJsonMap();
  return map[enrichmentKey(drugId, locale)] || null;
}

export function getDrugEnrichments(
  drugIds: string[],
  locale: "he" | "en"
): Record<string, DrugEnrichment | null> {
  const result: Record<string, DrugEnrichment | null> = {};
  for (const id of drugIds) result[id] = null;

  try {
    const fromDb = getDrugEnrichmentsFromDb(drugIds, locale);
    for (const [id, enrichment] of Object.entries(fromDb)) {
      result[id] = enrichment;
    }
  } catch (error) {
    console.warn("Drug enrichment DB batch read failed:", error);
  }

  const map = loadJsonMap();
  for (const id of drugIds) {
    if (result[id]) continue;
    result[id] = map[enrichmentKey(id, locale)] || null;
  }

  return result;
}

export function saveDrugEnrichment(enrichment: DrugEnrichment): DrugEnrichment {
  try {
    saveDrugEnrichmentToDb(enrichment);
  } catch (error) {
    console.warn("Drug enrichment DB save failed:", error);
  }

  const map = loadJsonMap();
  map[enrichmentKey(enrichment.drugId, enrichment.locale)] = enrichment;
  saveRuntimeJsonMap(map);
  return enrichment;
}

/** @deprecated Use getDrugEnrichments */
export function getEnrichmentsForIds(
  drugIds: string[],
  locale: "he" | "en"
): Record<string, DrugEnrichment | null> {
  return getDrugEnrichments(drugIds, locale);
}
