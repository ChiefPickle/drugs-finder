import { resolve } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

const RUNTIME_FILE = resolve(process.cwd(), ".data/prescription-templates.json");

export interface StoredTemplate {
  id: string;
  name: string;
  condition: string;
  targetPatientGroup: string;
  description: string;
  icon: string;
  drugs: {
    drugId: string;
    drugName: string;
    quantity: string;
    frequency: string;
    instructions: string;
  }[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
}

function loadAll(): StoredTemplate[] {
  if (!existsSync(RUNTIME_FILE)) return [];
  try {
    const data = JSON.parse(readFileSync(RUNTIME_FILE, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveAll(templates: StoredTemplate[]): void {
  const dir = resolve(process.cwd(), ".data");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(RUNTIME_FILE, JSON.stringify(templates, null, 2));
}

export function listTemplates(userId?: string | null): StoredTemplate[] {
  const all = loadAll();
  if (!userId) return all.filter((t) => !t.userId);
  return all.filter((t) => t.userId === userId || !t.userId);
}

export function getTemplateById(id: string): StoredTemplate | null {
  return loadAll().find((t) => t.id === id) || null;
}

export function findTemplateByName(name: string, userId?: string | null): StoredTemplate | null {
  const normalized = name.trim().toLowerCase();
  return (
    listTemplates(userId).find((t) => t.name.trim().toLowerCase() === normalized) || null
  );
}

export function saveTemplate(template: StoredTemplate): StoredTemplate {
  const all = loadAll();
  const index = all.findIndex((t) => t.id === template.id);
  if (index >= 0) all[index] = template;
  else all.push(template);
  saveAll(all);
  return template;
}

export function deleteTemplate(id: string): boolean {
  const all = loadAll();
  const next = all.filter((t) => t.id !== id);
  if (next.length === all.length) return false;
  saveAll(next);
  return true;
}
