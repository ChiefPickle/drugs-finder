"use client";

import { useEffect, useState } from "react";
import type { Drug } from "@/types/drug";
import type { PredefinedPrescriptionTemplate, TemplateDrugItem } from "@/types/template";
import { TEMPLATE_ICONS } from "@/types/template";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";
import {
  fetchTemplates,
  saveTemplateRemote,
  validateFrequency,
  validateQuantity,
} from "@/lib/templates-client";
import { btnPrimary, btnSecondary, inputClass } from "@/lib/ui";
import { MedicationSelectionTable } from "@/components/MedicationSelectionTable";
import { TemplateCardsSidebar } from "@/components/TemplateCardsSidebar";
import type { DrugSelectionRow } from "@/types/template";

type Step = "edit" | "review" | "save";

type TemplateFormState = {
  name: string;
  condition: string;
  targetPatientGroup: string;
  description: string;
  icon: string;
};

export function TemplateBuilderPanel({ drugs }: { drugs: Drug[] }) {
  const { tr } = useLocale();
  const { user } = useAuth();
  const [filter, setFilter] = useState("");
  const [selections, setSelections] = useState<Record<string, DrugSelectionRow>>({});
  const [templates, setTemplates] = useState<PredefinedPrescriptionTemplate[]>([]);
  const [step, setStep] = useState<Step>("edit");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [duplicateConfirm, setDuplicateConfirm] = useState(false);

  const [form, setForm] = useState<TemplateFormState>({
    name: "",
    condition: "",
    targetPatientGroup: "",
    description: "",
    icon: TEMPLATE_ICONS[0],
  });

  const selectedRows = Object.values(selections).filter((r) => r.selected);

  useEffect(() => {
    fetchTemplates().then(setTemplates);
  }, []);

  function updateSelection(drugId: string, patch: Partial<DrugSelectionRow>) {
    setSelections((prev) => ({
      ...prev,
      [drugId]: {
        ...(prev[drugId] || {
          drugId,
          selected: false,
          quantity: "",
          frequency: "",
          instructions: "",
        }),
        ...patch,
      },
    }));
  }

  function validateSelections(): string[] {
    const errors: string[] = [];
    if (selectedRows.length === 0) {
      errors.push(tr("tplErrNoDrugs"));
      return errors;
    }
    for (const row of selectedRows) {
      const drug = drugs.find((d) => d.id === row.drugId);
      const label = drug?.name || row.drugId;
      const qErr = validateQuantity(row.quantity);
      if (qErr) errors.push(`${label}: ${qErr}`);
      const fErr = validateFrequency(row.frequency);
      if (fErr) errors.push(`${label}: ${fErr}`);
    }
    return errors;
  }

  function buildDrugItems(): TemplateDrugItem[] {
    return selectedRows.map((row) => {
      const drug = drugs.find((d) => d.id === row.drugId);
      return {
        drugId: row.drugId,
        drugName: drug?.name || row.drugId,
        quantity: row.quantity.trim(),
        frequency: row.frequency.trim(),
        instructions: row.instructions.trim(),
      };
    });
  }

  function handleStartReview() {
    const errors = validateSelections();
    setValidationErrors(errors);
    if (errors.length) return;
    setStep("review");
  }

  function handleProceedToSave() {
    setStep("save");
  }

  async function handleSave(forceDuplicate = false) {
    if (!form.name.trim()) {
      setValidationErrors([tr("tplErrName")]);
      return;
    }
    if (!form.condition.trim()) {
      setValidationErrors([tr("tplErrCondition")]);
      return;
    }

    setSaving(true);
    setValidationErrors([]);

    const now = new Date().toISOString();
    const template: PredefinedPrescriptionTemplate = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      condition: form.condition.trim(),
      targetPatientGroup: form.targetPatientGroup.trim(),
      description: form.description.trim(),
      icon: form.icon,
      drugs: buildDrugItems(),
      createdBy: user?.name || "Local physician",
      createdAt: now,
      updatedAt: now,
    };

    const result = await saveTemplateRemote(template, forceDuplicate);
    setSaving(false);

    if (!result.ok) {
      if (result.duplicate) {
        setDuplicateConfirm(true);
        setValidationErrors([tr("tplDuplicateWarning")]);
        return;
      }
      setValidationErrors([result.error]);
      return;
    }

    setDuplicateConfirm(false);
    setStep("edit");
    setForm({
      name: "",
      condition: "",
      targetPatientGroup: "",
      description: "",
      icon: TEMPLATE_ICONS[0],
    });
    setSelections({});
    const list = await fetchTemplates();
    setTemplates(list);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[var(--text-primary)]">{tr("tplTitle")}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{tr("tplSubtitle")}</p>
        <p className="mt-3 rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 px-4 py-3 text-xs text-[var(--text-secondary)]">
          {tr("tplDisclaimer")}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-1 min-w-0">
          {step === "edit" && (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label htmlFor="tpl-filter" className="sr-only">
                  {tr("search")}
                </label>
                <input
                  id="tpl-filter"
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={tr("tplFilterPlaceholder")}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm sm:max-w-md"
                />
                <button
                  type="button"
                  onClick={handleStartReview}
                  className={`${btnPrimary} shrink-0`}
                >
                  {tr("tplReviewSave")} ({selectedRows.length})
                </button>
              </div>

              {validationErrors.length > 0 && step === "edit" && (
                <ul className="mb-4 space-y-1 text-sm text-[var(--danger)]">
                  {validationErrors.map((err) => (
                    <li key={err}>{err}</li>
                  ))}
                </ul>
              )}

              <MedicationSelectionTable
                drugs={drugs}
                selections={selections}
                onSelectionChange={updateSelection}
                filter={filter}
              />
            </>
          )}

          {step === "review" && (
            <ReviewStep
              items={buildDrugItems()}
              onBack={() => setStep("edit")}
              onConfirm={handleProceedToSave}
            />
          )}

          {step === "save" && (
            <SaveStep
              form={form}
              onChange={setForm}
              items={buildDrugItems()}
              errors={validationErrors}
              duplicateConfirm={duplicateConfirm}
              saving={saving}
              onBack={() => {
                setStep("review");
                setDuplicateConfirm(false);
                setValidationErrors([]);
              }}
              onSave={() => handleSave(duplicateConfirm)}
            />
          )}
        </div>

        <TemplateCardsSidebar templates={templates} />
      </div>
    </div>
  );
}

function ReviewStep({
  items,
  onBack,
  onConfirm,
}: {
  items: TemplateDrugItem[];
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { tr } = useLocale();

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-6">
      <h2 className="font-serif text-xl text-[var(--text-primary)]">{tr("tplReviewTitle")}</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{tr("tplReviewHint")}</p>

      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li
            key={item.drugId}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-4"
          >
            <p className="font-medium text-[var(--text-primary)]">{item.drugName}</p>
            <dl className="mt-2 grid gap-1 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-[var(--text-muted)]">{tr("quantity")}</dt>
                <dd>{item.quantity}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-[var(--text-muted)]">{tr("tplFrequency")}</dt>
                <dd>{item.frequency}</dd>
              </div>
              {item.instructions && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-[var(--text-muted)]">{tr("instructions")}</dt>
                  <dd>{item.instructions}</dd>
                </div>
              )}
            </dl>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs text-[var(--warning)]">{tr("tplDisclaimer")}</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className={btnSecondary}>
          {tr("tplBack")}
        </button>
        <button type="button" onClick={onConfirm} className={btnPrimary}>
          {tr("tplConfirmReview")}
        </button>
      </div>
    </div>
  );
}

function SaveStep({
  form,
  onChange,
  items,
  errors,
  duplicateConfirm,
  saving,
  onBack,
  onSave,
}: {
  form: TemplateFormState;
  onChange: (form: TemplateFormState) => void;
  items: TemplateDrugItem[];
  errors: string[];
  duplicateConfirm: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  const { tr } = useLocale();

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-6">
      <h2 className="font-serif text-xl text-[var(--text-primary)]">{tr("tplSaveTitle")}</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{tr("tplSaveHint")}</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">
            {tr("tplTemplateName")} *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder={tr("tplNamePlaceholder")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">
            {tr("tplCondition")} *
          </label>
          <input
            type="text"
            value={form.condition}
            onChange={(e) => onChange({ ...form, condition: e.target.value })}
            placeholder={tr("tplConditionPlaceholder")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">
            {tr("tplPatientGroup")}
          </label>
          <input
            type="text"
            value={form.targetPatientGroup}
            onChange={(e) => onChange({ ...form, targetPatientGroup: e.target.value })}
            placeholder={tr("tplPatientGroupPlaceholder")}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-[var(--text-secondary)]">
            {tr("tplDescription")}
          </label>
          <textarea
            value={form.description}
            onChange={(e) => onChange({ ...form, description: e.target.value })}
            placeholder={tr("tplDescriptionPlaceholder")}
            rows={3}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-[var(--text-secondary)]">{tr("tplIcon")}</label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATE_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => onChange({ ...form, icon })}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xl ${
                  form.icon === icon
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)]"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        {tr("tplDrugsIncluded")}: {items.length}
      </p>

      {errors.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-[var(--danger)]">
          {errors.map((err) => (
            <li key={err}>{err}</li>
          ))}
        </ul>
      )}

      {duplicateConfirm && (
        <p className="mt-4 rounded-lg border border-[var(--warning)]/40 bg-[var(--warning)]/10 p-3 text-sm text-[var(--text-secondary)]">
          {tr("tplDuplicateConfirm")}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className={btnSecondary} disabled={saving}>
          {tr("tplBack")}
        </button>
        <button type="button" onClick={onSave} className={btnPrimary} disabled={saving}>
          {saving
            ? tr("tplSaving")
            : duplicateConfirm
              ? tr("tplSaveDuplicate")
              : tr("tplSaveTemplate")}
        </button>
      </div>
    </div>
  );
}
