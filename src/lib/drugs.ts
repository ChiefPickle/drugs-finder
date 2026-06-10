import type { Drug } from "@/types/drug";
import drugsData from "@/data/drugs.json";

export const drugs: Drug[] = drugsData as Drug[];

export function formatPrice(value: number | null): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function getDrugById(id: string): Drug | undefined {
  return drugs.find((d) => d.id === id);
}
