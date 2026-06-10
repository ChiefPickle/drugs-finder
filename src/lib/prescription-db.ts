import { getDb } from "@/lib/db";
import type { PrescriptionDraft } from "@/types/prescription";

export function getPrescriptionDraft(userId: string): PrescriptionDraft | null {
  const row = getDb()
    .prepare(
      "SELECT patient_name, notes, items_json, updated_at FROM prescription_drafts WHERE user_id = ?"
    )
    .get(userId) as
    | { patient_name: string; notes: string; items_json: string; updated_at: string }
    | undefined;

  if (!row) return null;

  return {
    patientName: row.patient_name,
    notes: row.notes,
    items: JSON.parse(row.items_json),
    updatedAt: row.updated_at,
  };
}

export function savePrescriptionDraft(userId: string, draft: PrescriptionDraft): void {
  const updatedAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO prescription_drafts (user_id, patient_name, notes, items_json, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         patient_name = excluded.patient_name,
         notes = excluded.notes,
         items_json = excluded.items_json,
         updated_at = excluded.updated_at`
    )
    .run(
      userId,
      draft.patientName,
      draft.notes,
      JSON.stringify(draft.items),
      updatedAt
    );
}
