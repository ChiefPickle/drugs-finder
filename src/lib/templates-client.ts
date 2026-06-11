import type { PredefinedPrescriptionTemplate } from "@/types/template";
import { FREQUENCY_OPTIONS } from "@/types/template";

const TEMPLATES_KEY = "drugs-finder-prescription-templates";

const AMBIGUOUS_FREQUENCY = /\b(QD|BID|TID|QID|QOD|QHS|QAM|PO|IV|IM|SC)\b/i;

export function loadLocalTemplates(): PredefinedPrescriptionTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalTemplates(templates: PredefinedPrescriptionTemplate[]): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

export function upsertLocalTemplate(template: PredefinedPrescriptionTemplate): void {
  const all = loadLocalTemplates();
  const index = all.findIndex((t) => t.id === template.id);
  if (index >= 0) all[index] = template;
  else all.unshift(template);
  saveLocalTemplates(all);
}

export function validateFrequency(frequency: string): string | null {
  const value = frequency.trim();
  if (!value) return "Frequency is required";
  if (AMBIGUOUS_FREQUENCY.test(value)) {
    return "Use clear labels such as \"once daily\" instead of abbreviations";
  }
  if (!FREQUENCY_OPTIONS.includes(value as (typeof FREQUENCY_OPTIONS)[number])) {
    return "Choose a standard frequency option from the list";
  }
  return null;
}

export function validateQuantity(quantity: string): string | null {
  const value = quantity.trim();
  if (!value) return "Quantity is required";
  if (!/^\d+(\.\d+)?(\s*(tablet|tablets|tab|capsule|capsules|cap|ml|mg|g|unit|units|pack|packs|dose|doses|puff|puffs|drop|drops))?$/i.test(value)) {
    return "Enter a numeric quantity, e.g. \"1 tablet\" or \"2\"";
  }
  return null;
}

export async function fetchTemplates(): Promise<PredefinedPrescriptionTemplate[]> {
  const res = await fetch("/api/templates");
  if (!res.ok) return loadLocalTemplates();
  const data = await res.json();
  const remote = Array.isArray(data.templates) ? data.templates : [];
  if (remote.length) saveLocalTemplates(remote);
  return remote.length ? remote : loadLocalTemplates();
}

export async function saveTemplateRemote(
  template: PredefinedPrescriptionTemplate,
  forceDuplicate = false
): Promise<{ ok: true; template: PredefinedPrescriptionTemplate } | { ok: false; error: string; duplicate?: boolean }> {
  const res = await fetch("/api/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...template, forceDuplicate }),
  });
  const data = await res.json();
  if (!res.ok) {
    return {
      ok: false,
      error: data.error || "Failed to save template",
      duplicate: data.error === "duplicate_name",
    };
  }
  upsertLocalTemplate(data.template);
  return { ok: true, template: data.template };
}
