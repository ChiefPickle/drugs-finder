import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { getPrescriptionDraft, savePrescriptionDraft } from "@/lib/prescription-db";
import type { PrescriptionDraft } from "@/types/prescription";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const draft = getPrescriptionDraft(user.id);
  return NextResponse.json({ draft });
}

export async function PUT(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PrescriptionDraft;
  if (!body || !Array.isArray(body.items)) {
    return NextResponse.json({ error: "Invalid draft" }, { status: 400 });
  }

  const draft: PrescriptionDraft = {
    patientName: String(body.patientName || ""),
    notes: String(body.notes || ""),
    items: body.items.map((item) => ({
      drugId: String(item.drugId),
      instructions: String(item.instructions || ""),
      quantity: String(item.quantity || ""),
    })),
    updatedAt: new Date().toISOString(),
  };

  savePrescriptionDraft(user.id, draft);
  return NextResponse.json({ draft });
}
