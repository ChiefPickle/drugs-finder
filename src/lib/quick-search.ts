export interface QuickSearchTag {
  label: string;
  query: string;
}

/** Short labels with search terms that match common formulary entries. */
export const QUICK_SEARCH_TAGS: QuickSearchTag[] = [
  { label: "Acamol", query: "ACAMOL" },
  { label: "Optalgin", query: "Optalgin" },
  { label: "Nexium", query: "NEXIUM" },
  { label: "Concor", query: "CONCOR" },
  { label: "Lipitor", query: "LIPITOR" },
];
