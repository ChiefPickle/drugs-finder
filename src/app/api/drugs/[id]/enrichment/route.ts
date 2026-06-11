import { NextRequest, NextResponse } from "next/server";
import { getDrugById } from "@/lib/drugs";
import { resolveDrugEnrichment } from "@/lib/drug-enrichment";

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
  const enrichment = await resolveDrugEnrichment(drug, locale, { refresh });
  return NextResponse.json(enrichment);
}
