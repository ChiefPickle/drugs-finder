export interface PrescriptionItem {
  drugId: string;
  instructions: string;
  quantity: string;
}

export interface PrescriptionDraft {
  patientName: string;
  notes: string;
  items: PrescriptionItem[];
  updatedAt: string;
}
