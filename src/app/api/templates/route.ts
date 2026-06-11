import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import {
  deleteTemplate,
  findTemplateByName,
  listTemplates,
  saveTemplate,
} from "@/lib/templates-db";
import {
  findUserTemplateByName,
  listUserTemplates,
  saveUserTemplate,
} from "@/lib/templates-user-db";
import type { PredefinedPrescriptionTemplate } from "@/types/template";

export async function GET(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const templates = user
    ? listUserTemplates(user.id)
    : listTemplates(null).map((t) => ({
        id: t.id,
        name: t.name,
        condition: t.condition,
        targetPatientGroup: t.targetPatientGroup,
        description: t.description,
        icon: t.icon,
        drugs: t.drugs,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));

  return NextResponse.json({ templates });
}

export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  const body = await request.json();
  const template = body as PredefinedPrescriptionTemplate;
  const forceDuplicate = body.forceDuplicate === true;

  if (!template?.name?.trim() || !template?.condition?.trim()) {
    return NextResponse.json(
      { error: "Template name and condition are required" },
      { status: 400 }
    );
  }

  const duplicate = user
    ? findUserTemplateByName(user.id, template.name)
    : findTemplateByName(template.name, null);

  if (duplicate && !forceDuplicate) {
    return NextResponse.json(
      { error: "duplicate_name", existingId: duplicate.id },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const saved: PredefinedPrescriptionTemplate = {
    ...template,
    id: template.id || crypto.randomUUID(),
    createdBy: user?.name || template.createdBy || "Local physician",
    createdAt: template.createdAt || now,
    updatedAt: now,
  };

  if (user) {
    saveUserTemplate(user.id, saved);
  } else {
    saveTemplate({
      ...saved,
      userId: undefined,
    });
  }

  return NextResponse.json({ template: saved });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  deleteTemplate(id);
  return NextResponse.json({ ok: true });
}
