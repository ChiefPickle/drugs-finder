const FAVORITES_KEY = "drugs-finder-favorites";

export function loadFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveFavoriteIds(ids: string[]): void {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export function toggleFavoriteId(id: string, ids: string[]): string[] {
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
  saveFavoriteIds(next);
  return next;
}

export function exportFavorites(ids: string[]): void {
  const blob = new Blob([JSON.stringify(ids, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `drugs-favorites-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importFavorites(file: File): Promise<string[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Invalid favorites file");
  const ids = parsed.filter((id): id is string => typeof id === "string");
  saveFavoriteIds(ids);
  return ids;
}
