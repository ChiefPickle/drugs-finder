import { getDb } from "@/lib/db";

export function getFavoriteIds(userId: string): string[] {
  const rows = getDb()
    .prepare("SELECT drug_id FROM favorites WHERE user_id = ? ORDER BY saved_at DESC")
    .all(userId) as { drug_id: string }[];

  return rows.map((row) => row.drug_id);
}

export function setFavoriteIds(userId: string, drugIds: string[]): void {
  const db = getDb();
  const now = new Date().toISOString();

  const replaceAll = db.transaction((ids: string[]) => {
    db.prepare("DELETE FROM favorites WHERE user_id = ?").run(userId);
    const insert = db.prepare(
      "INSERT INTO favorites (user_id, drug_id, saved_at) VALUES (?, ?, ?)"
    );
    for (const drugId of ids) {
      insert.run(userId, drugId, now);
    }
  });

  replaceAll(drugIds);
}

export function mergeFavoriteIds(userId: string, localIds: string[]): string[] {
  const serverIds = getFavoriteIds(userId);
  const merged = [...new Set([...serverIds, ...localIds])];
  setFavoriteIds(userId, merged);
  return merged;
}
