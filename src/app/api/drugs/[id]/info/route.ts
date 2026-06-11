import { NextRequest, NextResponse } from "next/server";
import { getDrugById } from "@/lib/drugs";
import { heuristicDrugInfo } from "@/lib/drug-parse";
import { getCachedDrugInfo, setCachedDrugInfo } from "@/lib/drug-info-cache";
import type { DrugInfo } from "@/types/drug";

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
  const cacheKey = `${id}:${locale}`;

  if (!refresh) {
    const cached = getCachedDrugInfo(cacheKey);
    if (cached) return NextResponse.json(cached);
  }

  const parsed = heuristicDrugInfo(drug, locale);
  const info: DrugInfo = {
    drugId: id,
    ...parsed,
    generatedAt: new Date().toISOString(),
  };

  setCachedDrugInfo(info, cacheKey);
  return NextResponse.json(info);
}
