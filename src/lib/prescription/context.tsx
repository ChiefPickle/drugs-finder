"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PrescriptionDraft, PrescriptionItem } from "@/types/prescription";
import { useAuth } from "@/lib/auth/context";

const PRESCRIPTION_KEY = "drugs-finder-prescription";

const emptyDraft = (): PrescriptionDraft => ({
  patientName: "",
  notes: "",
  items: [],
  updatedAt: new Date().toISOString(),
});

function loadLocalDraft(): PrescriptionDraft {
  if (typeof window === "undefined") return emptyDraft();
  try {
    const raw = localStorage.getItem(PRESCRIPTION_KEY);
    if (!raw) return emptyDraft();
    return JSON.parse(raw) as PrescriptionDraft;
  } catch {
    return emptyDraft();
  }
}

function saveLocalDraft(draft: PrescriptionDraft) {
  localStorage.setItem(PRESCRIPTION_KEY, JSON.stringify(draft));
}

interface PrescriptionContextValue {
  draft: PrescriptionDraft;
  addItem: (item: PrescriptionItem) => void;
  removeItem: (drugId: string) => void;
  updateItem: (drugId: string, patch: Partial<PrescriptionItem>) => void;
  setPatientName: (name: string) => void;
  setNotes: (notes: string) => void;
  clearDraft: () => void;
  isInPrescription: (drugId: string) => boolean;
}

const PrescriptionContext = createContext<PrescriptionContextValue | null>(null);

export function PrescriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [draft, setDraft] = useState<PrescriptionDraft>(emptyDraft);

  useEffect(() => {
    async function load() {
      if (user) {
        const res = await fetch("/api/prescription");
        if (res.ok) {
          const data = await res.json();
          if (data.draft) {
            setDraft(data.draft);
            saveLocalDraft(data.draft);
            return;
          }
        }
      }
      setDraft(loadLocalDraft());
    }
    load();
  }, [user]);

  const persist = useCallback(
    async (next: PrescriptionDraft) => {
      const withTimestamp = { ...next, updatedAt: new Date().toISOString() };
      setDraft(withTimestamp);
      saveLocalDraft(withTimestamp);
      if (user) {
        await fetch("/api/prescription", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(withTimestamp),
        });
      }
    },
    [user]
  );

  const addItem = useCallback(
    (item: PrescriptionItem) => {
      persist({
        ...draft,
        items: draft.items.some((x) => x.drugId === item.drugId)
          ? draft.items.map((x) => (x.drugId === item.drugId ? { ...x, ...item } : x))
          : [...draft.items, item],
      });
    },
    [draft, persist]
  );

  const removeItem = useCallback(
    (drugId: string) => {
      persist({ ...draft, items: draft.items.filter((x) => x.drugId !== drugId) });
    },
    [draft, persist]
  );

  const updateItem = useCallback(
    (drugId: string, patch: Partial<PrescriptionItem>) => {
      persist({
        ...draft,
        items: draft.items.map((x) => (x.drugId === drugId ? { ...x, ...patch } : x)),
      });
    },
    [draft, persist]
  );

  const setPatientName = useCallback(
    (patientName: string) => persist({ ...draft, patientName }),
    [draft, persist]
  );

  const setNotes = useCallback(
    (notes: string) => persist({ ...draft, notes }),
    [draft, persist]
  );

  const clearDraft = useCallback(() => persist(emptyDraft()), [persist]);

  const isInPrescription = useCallback(
    (drugId: string) => draft.items.some((x) => x.drugId === drugId),
    [draft.items]
  );

  const value = useMemo(
    () => ({
      draft,
      addItem,
      removeItem,
      updateItem,
      setPatientName,
      setNotes,
      clearDraft,
      isInPrescription,
    }),
    [draft, addItem, removeItem, updateItem, setPatientName, setNotes, clearDraft, isInPrescription]
  );

  return (
    <PrescriptionContext.Provider value={value}>{children}</PrescriptionContext.Provider>
  );
}

export function usePrescription() {
  const ctx = useContext(PrescriptionContext);
  if (!ctx) throw new Error("usePrescription must be used within PrescriptionProvider");
  return ctx;
}

export function exportPrescriptionJson(draft: PrescriptionDraft, drugs: { id: string; name: string }[]) {
  const payload = {
    ...draft,
    items: draft.items.map((item) => ({
      ...item,
      drugName: drugs.find((d) => d.id === item.drugId)?.name || item.drugId,
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `prescription-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const PRINT_STORAGE_KEY = "drugs-finder-print-payload";
