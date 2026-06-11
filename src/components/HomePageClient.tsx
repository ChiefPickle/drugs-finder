"use client";

import { useEffect, useMemo, useState } from "react";
import { drugs } from "@/lib/drugs";
import { createDrugSearchIndex, searchDrugs } from "@/lib/search";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";
import { exportFavorites, importFavorites } from "@/lib/favorites";
import { searchInputClass } from "@/lib/ui";
import { AppShell } from "@/components/AppShell";
import { DrugTable } from "@/components/DrugTable";
import { PrescriptionPanel } from "@/components/PrescriptionPanel";
import { TemplateBuilderPanel } from "@/components/TemplateBuilderPanel";
import { QuickSearchTags } from "@/components/QuickSearchTags";
import type { Drug } from "@/types/drug";

type Tab = "search" | "favorites" | "prescription" | "templates";

export default function HomePageClient() {
  const { tr, locale } = useLocale();
  const { favoriteIds, setFavoriteIds } = useAuth();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("search");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const searchIndex = useMemo(() => createDrugSearchIndex(drugs), []);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const searchResults = useMemo(
    () => searchDrugs(searchIndex, query, 80),
    [searchIndex, query]
  );

  const favoriteDrugs = useMemo(
    () =>
      favoriteIds
        .map((id) => drugs.find((d) => d.id === id))
        .filter((d): d is Drug => Boolean(d)),
    [favoriteIds]
  );

  const displayedDrugs = tab === "favorites" ? favoriteDrugs : searchResults;

  const emptyMessage =
    tab === "favorites"
      ? tr("emptyFavorites")
      : query.trim()
        ? tr("emptySearch")
        : tr("emptySearchPrompt");

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const ids = await importFavorites(file);
      setFavoriteIds(ids);
    } catch {
      alert(tr("invalidFavoritesFile"));
    }
    event.target.value = "";
  };

  return (
    <AppShell
      tab={tab}
      onTabChange={setTab}
      favoriteCount={favoriteIds.length}
      showFavoritesActions={tab !== "prescription" && tab !== "templates"}
      onExportFavorites={() => exportFavorites(favoriteIds)}
      onImportFavorites={handleImport}
      footer={
        <>
          {offline && (
            <p className="mb-2 text-[var(--warning)]">{tr("offlineReady")}</p>
          )}
          {tr("footerSource")} · {drugs.length.toLocaleString(locale === "he" ? "he-IL" : "en-US")}{" "}
          {tr("drugsCount")}
        </>
      }
    >
      {tab === "search" && (
        <div className="mb-8">
          <label htmlFor="search" className="sr-only">
            {tr("search")}
          </label>
          <input
            id="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr("searchPlaceholder")}
            className={searchInputClass}
            autoFocus
          />
          <QuickSearchTags
            onSelect={(term) => {
              setQuery(term);
              setExpandedId(null);
            }}
          />
          {query.trim() && (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {searchResults.length} {tr("results")}
            </p>
          )}
        </div>
      )}

      {tab === "prescription" ? (
        <PrescriptionPanel />
      ) : tab === "templates" ? (
        <TemplateBuilderPanel drugs={drugs} />
      ) : (
        <DrugTable
          drugs={displayedDrugs}
          emptyMessage={emptyMessage}
          expandedId={expandedId}
          onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
        />
      )}
    </AppShell>
  );
}
