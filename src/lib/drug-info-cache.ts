import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import type { DrugInfo } from "@/types/drug";

const CACHE_DIR = process.env.VERCEL
  ? resolve("/tmp", "drugs-finder-drug-info")
  : resolve(process.cwd(), ".cache/drug-info");

function cachePath(key: string) {
  return resolve(CACHE_DIR, `${key.replace(/[^a-zA-Z0-9:_-]/g, "_")}.json`);
}

export function getCachedDrugInfo(key: string): DrugInfo | null {
  try {
    const path = cachePath(key);
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, "utf-8")) as DrugInfo;
  } catch {
    return null;
  }
}

export function setCachedDrugInfo(info: DrugInfo, key?: string): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
    const cacheKey = key || info.drugId;
    writeFileSync(cachePath(cacheKey), JSON.stringify(info, null, 2));
  } catch (error) {
    console.warn("Drug info cache write failed:", error);
  }
}
