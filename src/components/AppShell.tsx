"use client";

import type { ReactNode } from "react";
import { AuthModal } from "@/components/AuthModal";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SidebarNav } from "@/components/SidebarNav";
import { useLocale } from "@/lib/i18n/context";
import { btnSecondary } from "@/lib/ui";

type Tab = "search" | "favorites" | "prescription";

export function AppShell({
  tab,
  onTabChange,
  favoriteCount,
  showFavoritesActions,
  onExportFavorites,
  onImportFavorites,
  children,
  footer,
}: {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  favoriteCount: number;
  showFavoritesActions: boolean;
  onExportFavorites: () => void;
  onImportFavorites: (event: React.ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { tr } = useLocale();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] bg-[var(--bg-surface)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[var(--accent)]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M8 8h8M8 16h8" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-serif text-lg text-[var(--text-primary)]">Drug Finder</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageToggle />
            <InstallPrompt />
            <AuthModal />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-8 sm:px-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <SidebarNav tab={tab} onTabChange={onTabChange} favoriteCount={favoriteCount} />
          {showFavoritesActions && (
            <div className="mt-6 space-y-2 border-t border-[var(--border)] pt-6">
              <button type="button" onClick={onExportFavorites} className={`${btnSecondary} w-full`}>
                {tr("exportFavorites")}
              </button>
              <label className={`${btnSecondary} block w-full cursor-pointer text-center`}>
                {tr("importFavorites")}
                <input type="file" accept=".json" className="hidden" onChange={onImportFavorites} />
              </label>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-8 lg:hidden">
            <SidebarNav tab={tab} onTabChange={onTabChange} favoriteCount={favoriteCount} />
          </div>

          <div className="mb-8">
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--text-muted)]">
              {tr("appSubtitle")}
            </p>
            <h1 className="font-serif mt-2 text-3xl font-normal tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {tr("appTitle")}
            </h1>
            <p className="mt-3 max-w-xl leading-relaxed text-[var(--text-secondary)]">
              {tr("appDescription")}
            </p>
          </div>

          {showFavoritesActions && (
            <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
              <button type="button" onClick={onExportFavorites} className={btnSecondary}>
                {tr("exportFavorites")}
              </button>
              <label className={`${btnSecondary} cursor-pointer`}>
                {tr("importFavorites")}
                <input type="file" accept=".json" className="hidden" onChange={onImportFavorites} />
              </label>
            </div>
          )}

          {children}

          <footer className="mt-12 border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--text-muted)]">
            {footer}
          </footer>
        </main>
      </div>
    </div>
  );
}
