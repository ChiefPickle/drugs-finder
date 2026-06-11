export interface TemplateDrugItem {
  drugId: string;
  drugName: string;
  quantity: string;
  frequency: string;
  instructions: string;
}

export interface PredefinedPrescriptionTemplate {
  id: string;
  name: string;
  condition: string;
  targetPatientGroup: string;
  description: string;
  icon: string;
  drugs: TemplateDrugItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DrugSelectionRow {
  drugId: string;
  selected: boolean;
  quantity: string;
  frequency: string;
  instructions: string;
}

export const FREQUENCY_OPTIONS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 4 hours",
  "Every 6 hours",
  "Every 8 hours",
  "Every 12 hours",
  "At bedtime",
  "As needed for pain",
  "As needed for fever",
] as const;

export type FrequencyOption = (typeof FREQUENCY_OPTIONS)[number];

export const TEMPLATE_ICONS = ["💊", "🦠", "🤒", "🩺", "💉", "🌡️", "🫁", "❤️", "🧠", "👶"] as const;
