import type { Drug, DrugInfo } from "@/types/drug";

export function parseFormFromName(name: string): string {
  const upper = name.toUpperCase();
  if (/\bTAB\b|\bTABLET/.test(upper)) return "Tablet";
  if (/\bCAP\b|\bCAPSULE/.test(upper)) return "Capsule";
  if (/\bSYR\b|\bSYRUP/.test(upper)) return "Syrup";
  if (/\bSUSP\b|\bSUSPENSION/.test(upper)) return "Suspension";
  if (/\bAMP\b|\bAMPOULE/.test(upper)) return "Ampoule";
  if (/\bVIAL\b/.test(upper)) return "Vial";
  if (/\bINH\b|\bINHALER\b|\bDISKUS\b|\bAER\b/.test(upper)) return "Inhaler";
  if (/\bCREAM\b|\bOINT\b|\bGEL\b/.test(upper)) return "Topical";
  if (/\bSUPP\b/.test(upper)) return "Suppository";
  if (/\bPATCH\b/.test(upper)) return "Patch";
  if (/\bDROPS\b|\bDROP\b/.test(upper)) return "Drops";
  if (/\bBAG\b/.test(upper)) return "Bag";
  return "";
}

export function parseStrengthFromName(name: string): string {
  const matches = name.match(
    /\d+(?:\.\d+)?\s*(?:MG|MCG|G|ML|IU|UNIT|UNITS|%)(?:\s*\/\s*\d+(?:\.\d+)?\s*(?:MG|MCG|ML))?/gi
  );
  if (!matches?.length) return "";
  return matches.slice(0, 3).join(" + ");
}

export function heuristicEnrichment(drug: Drug): {
  form: string;
  strength: string;
  shortDescription: string;
} {
  const form = parseFormFromName(drug.name) || drug.packageSize || "—";
  const strength = parseStrengthFromName(drug.name) || "—";
  const shortDescription = `${drug.name}${drug.manufacturer ? ` (${drug.manufacturer})` : ""}. Package: ${drug.packageSize || "N/A"}.`;
  return { form, strength, shortDescription };
}

export function heuristicDrugInfo(
  drug: Drug,
  locale: "he" | "en"
): Omit<DrugInfo, "drugId" | "generatedAt"> {
  const form = parseFormFromName(drug.name) || drug.packageSize || "—";
  const strength = parseStrengthFromName(drug.name) || "—";
  const price =
    drug.maxConsumerPriceWithVat != null
      ? `${drug.maxConsumerPriceWithVat.toFixed(2)} ₪`
      : locale === "he"
        ? "לא זמין"
        : "N/A";

  if (locale === "he") {
    return {
      summary: `${drug.name} — תכשיר מרשם במחירון הישראלי. יצרן: ${drug.manufacturer || "לא ידוע"}.`,
      indications:
        "מידע על התוויות אינו זמין במחירון. יש לבדוק בעלון לרופא או במקור רפואי מאושר.",
      dosage: `צורה: ${form}. עוצמה: ${strength}. אריזה: ${drug.packageSize || "—"}.`,
      warnings:
        "מידע זה מבוסס על נתוני המחירון בלבד ואינו תחליף לשיקול דעת רפואי או לעלון לרופא.",
    };
  }

  return {
    summary: `${drug.name} — prescription item in the Israeli formulary. Manufacturer: ${drug.manufacturer || "unknown"}.`,
    indications:
      "Indication details are not in the formulary price list. Refer to the official label or a trusted clinical reference.",
    dosage: `Form: ${form}. Strength: ${strength}. Package: ${drug.packageSize || "—"}. Max consumer price (incl. VAT): ${price}.`,
    warnings:
      "This information is derived from formulary data only and is not a substitute for clinical judgment or the prescribing information.",
  };
}
