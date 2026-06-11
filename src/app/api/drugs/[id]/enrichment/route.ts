import { NextRequest, NextResponse } from "next/server";
import { getDrugById } from "@/lib/drugs";
import { heuristicEnrichment } from "@/lib/drug-parse";
import {
  getDrugEnrichment,
  isEnrichmentComplete,
  saveDrugEnrichment,
} from "@/lib/drug-enrichment-store";
import { generateDrugEnrichment, resolveLLMProvider } from "@/lib/llm";
import type { DrugEnrichment } from "@/types/drug";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const drug = getDrugById(id);
  if (!drug) {
    return NextResponse.json({ error: "Drug not found" }, { status: 404 });
  }

  const locale = request.nextUrl.searchParams.get("locale") === "he" ? "he" : "en";
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";

  if (!refresh) {
    const existing = getDrugEnrichment(id, locale);
    if (isEnrichmentComplete(existing)) {
      return NextResponse.json(existing);
    }
  }

  const heuristic = heuristicEnrichment(drug);
  const partial: DrugEnrichment = {
    drugId: id,
    form: heuristic.form,
    strength: heuristic.strength,
    shortDescription: heuristic.shortDescription,
    locale,
    source: "heuristic",
    updatedAt: new Date().toISOString(),
  };

  if (!resolveLLMProvider()) {
    saveDrugEnrichment(partial);
    return NextResponse.json(partial);
  }

  try {
    const llm = await generateDrugEnrichment(drug, locale);
    const enrichment: DrugEnrichment = {
      drugId: id,
      form: llm.form || partial.form,
      strength: llm.strength || partial.strength,
      shortDescription: llm.shortDescription || partial.shortDescription,
      locale,
      source: "llm",
      updatedAt: new Date().toISOString(),
    };
    saveDrugEnrichment(enrichment);
    return NextResponse.json(enrichment);
  } catch (error) {
    console.error("Drug enrichment LLM error:", error);
    saveDrugEnrichment(partial);
    return NextResponse.json(partial);
  }
}
