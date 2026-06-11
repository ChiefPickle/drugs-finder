import { getDb } from "@/lib/db";
import type { PredefinedPrescriptionTemplate } from "@/types/template";

interface TemplateRow {
  id: string;
  user_id: string | null;
  name: string;
  condition_name: string;
  target_patient_group: string;
  description: string;
  icon: string;
  drugs_json: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

function rowToTemplate(row: TemplateRow): PredefinedPrescriptionTemplate {
  return {
    id: row.id,
    name: row.name,
    condition: row.condition_name,
    targetPatientGroup: row.target_patient_group,
    description: row.description,
    icon: row.icon,
    drugs: JSON.parse(row.drugs_json),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listUserTemplates(userId: string): PredefinedPrescriptionTemplate[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM prescription_templates WHERE user_id = ? ORDER BY updated_at DESC"
    )
    .all(userId) as TemplateRow[];
  return rows.map(rowToTemplate);
}

export function findUserTemplateByName(
  userId: string,
  name: string
): PredefinedPrescriptionTemplate | null {
  const row = getDb()
    .prepare(
      "SELECT * FROM prescription_templates WHERE user_id = ? AND LOWER(name) = LOWER(?)"
    )
    .get(userId, name.trim()) as TemplateRow | undefined;
  return row ? rowToTemplate(row) : null;
}

export function saveUserTemplate(
  userId: string,
  template: PredefinedPrescriptionTemplate
): PredefinedPrescriptionTemplate {
  getDb()
    .prepare(
      `INSERT INTO prescription_templates (
        id, user_id, name, condition_name, target_patient_group, description, icon,
        drugs_json, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        condition_name = excluded.condition_name,
        target_patient_group = excluded.target_patient_group,
        description = excluded.description,
        icon = excluded.icon,
        drugs_json = excluded.drugs_json,
        updated_at = excluded.updated_at`
    )
    .run(
      template.id,
      userId,
      template.name,
      template.condition,
      template.targetPatientGroup,
      template.description,
      template.icon,
      JSON.stringify(template.drugs),
      template.createdBy,
      template.createdAt,
      template.updatedAt
    );
  return template;
}
