"use client";

import { useLocale } from "@/lib/i18n/context";
import { btnGhost } from "@/lib/ui";

export function LanguageToggle() {
  const { locale, setLocale, tr } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "he" ? "en" : "he")}
      className={btnGhost}
    >
      {tr("language")}
    </button>
  );
}
