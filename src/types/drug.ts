export interface Drug {
  id: string;
  code: string;
  name: string;
  packageSize: string;
  maxRetailPrice: number | null;
  retailerMarginPercent: number | null;
  maxConsumerPrice: number | null;
  maxConsumerPriceWithVat: number | null;
  manufacturer: string;
  yerpaCode: string;
  farmasoftCode: string;
  rowIndex: number;
}

export interface DrugInfo {
  drugId: string;
  summary: string;
  indications: string;
  dosage: string;
  warnings: string;
  generatedAt: string;
}

export interface DrugEnrichment {
  drugId: string;
  form: string;
  strength: string;
  shortDescription: string;
  locale: "he" | "en";
  source: "heuristic" | "llm";
  updatedAt: string;
}

export interface FavoriteDrug extends Drug {
  savedAt: string;
}
