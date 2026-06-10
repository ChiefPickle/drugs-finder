import Fuse from "fuse.js";
import type { Drug } from "@/types/drug";

export function createDrugSearchIndex(drugs: Drug[]) {
  return new Fuse(drugs, {
    keys: [
      { name: "name", weight: 0.6 },
      { name: "manufacturer", weight: 0.15 },
      { name: "code", weight: 0.15 },
      { name: "yerpaCode", weight: 0.05 },
      { name: "farmasoftCode", weight: 0.05 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
}

export function searchDrugs(index: Fuse<Drug>, query: string, limit = 50): Drug[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  return index.search(trimmed, { limit }).map((result) => result.item);
}
