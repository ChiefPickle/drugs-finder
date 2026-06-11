import { NextRequest, NextResponse } from "next/server";
import { getDrugById } from "@/lib/drugs";
import { resolveDrugEnrichments } from "@/lib/drug-enrichment";

export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "he" ? "he" : "en";
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const idsParam = request.nextUrl.searchParams.get("ids") || "";
  const ids = idsParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 48);

  if (!ids.length) {
    return NextResponse.json({ error: "Missing ids parameter" }, { status: 400 });
  }

  const drugs = ids
    .map((id) => getDrugById(id))
    .filter((drug): drug is NonNullable<typeof drug> => Boolean(drug));

  const enrichments = await resolveDrugEnrichments(drugs, locale, { refresh });
  return NextResponse.json({ enrichments });
}
