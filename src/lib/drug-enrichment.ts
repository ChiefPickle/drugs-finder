import type { Drug, DrugEnrichment } from "@/types/drug";
import { heuristicEnrichment } from "@/lib/drug-parse";
import {
  getDrugEnrichment,
  getDrugEnrichments,
  saveDrugEnrichment,
} from "@/lib/drug-enrichment-store";
import { generateDrugEnrichment, resolveLLMProvider } from "@/lib/llm";

export async function resolveDrugEnrichment(
  drug: Drug,
  locale: "he" | "en",
  options: { refresh?: boolean } = {}
): Promise<DrugEnrichment> {
  const { refresh = false } = options;

  if (!refresh) {
    const cached = getDrugEnrichment(drug.id, locale);
    if (cached) return cached;
  }

  const heuristic = heuristicEnrichment(drug);
  const partial: DrugEnrichment = {
    drugId: drug.id,
    form: heuristic.form,
    strength: heuristic.strength,
    shortDescription: heuristic.shortDescription,
    locale,
    source: "heuristic",
    updatedAt: new Date().toISOString(),
  };

  if (!resolveLLMProvider()) {
    return saveDrugEnrichment(partial);
  }

  try {
    const llm = await generateDrugEnrichment(drug, locale);
    const enrichment: DrugEnrichment = {
      drugId: drug.id,
      form: llm.form || partial.form,
      strength: llm.strength || partial.strength,
      shortDescription: llm.shortDescription || partial.shortDescription,
      locale,
      source: "llm",
      updatedAt: new Date().toISOString(),
    };
    return saveDrugEnrichment(enrichment);
  } catch (error) {
    console.error("Drug enrichment LLM error:", error);
    return saveDrugEnrichment(partial);
  }
}

export async function resolveDrugEnrichments(
  drugs: Drug[],
  locale: "he" | "en",
  options: { refresh?: boolean } = {}
): Promise<Record<string, DrugEnrichment>> {
  const { refresh = false } = options;
  const cached = refresh ? {} : getDrugEnrichments(
    drugs.map((d) => d.id),
    locale
  );

  const result: Record<string, DrugEnrichment> = {};
  const missing: Drug[] = [];

  for (const drug of drugs) {
    const hit = cached[drug.id];
    if (hit) result[drug.id] = hit;
    else missing.push(drug);
  }

  for (const drug of missing) {
    result[drug.id] = await resolveDrugEnrichment(drug, locale, options);
  }

  return result;
}
