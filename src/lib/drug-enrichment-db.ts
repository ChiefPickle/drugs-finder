import { getDb } from "@/lib/db";
import type { DrugEnrichment } from "@/types/drug";

interface EnrichmentRow {
  drug_id: string;
  locale: string;
  form: string;
  strength: string;
  short_description: string;
  source: string;
  updated_at: string;
}

function rowToEnrichment(row: EnrichmentRow): DrugEnrichment {
  return {
    drugId: row.drug_id,
    locale: row.locale as "he" | "en",
    form: row.form,
    strength: row.strength,
    shortDescription: row.short_description,
    source: row.source as DrugEnrichment["source"],
    updatedAt: row.updated_at,
  };
}

export function getDrugEnrichmentFromDb(
  drugId: string,
  locale: "he" | "en"
): DrugEnrichment | null {
  const row = getDb()
    .prepare(
      "SELECT * FROM drug_enrichments WHERE drug_id = ? AND locale = ?"
    )
    .get(drugId, locale) as EnrichmentRow | undefined;
  return row ? rowToEnrichment(row) : null;
}

export function getDrugEnrichmentsFromDb(
  drugIds: string[],
  locale: "he" | "en"
): Record<string, DrugEnrichment> {
  if (!drugIds.length) return {};
  const placeholders = drugIds.map(() => "?").join(", ");
  const rows = getDb()
    .prepare(
      `SELECT * FROM drug_enrichments WHERE locale = ? AND drug_id IN (${placeholders})`
    )
    .all(locale, ...drugIds) as EnrichmentRow[];

  const result: Record<string, DrugEnrichment> = {};
  for (const row of rows) {
    result[row.drug_id] = rowToEnrichment(row);
  }
  return result;
}

export function saveDrugEnrichmentToDb(enrichment: DrugEnrichment): DrugEnrichment {
  getDb()
    .prepare(
      `INSERT INTO drug_enrichments (
        drug_id, locale, form, strength, short_description, source, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(drug_id, locale) DO UPDATE SET
        form = excluded.form,
        strength = excluded.strength,
        short_description = excluded.short_description,
        source = excluded.source,
        updated_at = excluded.updated_at`
    )
    .run(
      enrichment.drugId,
      enrichment.locale,
      enrichment.form,
      enrichment.strength,
      enrichment.shortDescription,
      enrichment.source,
      enrichment.updatedAt
    );
  return enrichment;
}
