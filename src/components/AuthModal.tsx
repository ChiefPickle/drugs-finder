"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useLocale } from "@/lib/i18n/context";
import { btnGhost, btnPrimary, btnSecondary, inputClass } from "@/lib/ui";

export function AuthModal() {
  const { user, login, register, logout } = useAuth();
  const { tr } = useLocale();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-[var(--text-secondary)] sm:inline">
          {tr("welcome")}, {user.name}
        </span>
        <button type="button" onClick={() => logout()} className={btnGhost}>
          {tr("logout")}
        </button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result =
      mode === "login"
        ? await login(email, password)
        : await register(name, email, password);

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setPassword("");
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={btnPrimary}>
        {tr("login")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8">
            <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
              {tr("authTitle")}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{tr("authSubtitle")}</p>

            <div className="mt-6 flex gap-2 border-b border-[var(--border)] pb-4">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    mode === m
                      ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {m === "login" ? tr("signIn") : tr("register")}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {mode === "register" && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={tr("name")}
                  required
                  className={inputClass}
                />
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tr("email")}
                required
                className={inputClass}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tr("password")}
                required
                minLength={8}
                className={inputClass}
              />
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className={`${btnPrimary} flex-1 py-2.5`}>
                  {mode === "login" ? tr("signIn") : tr("createAccount")}
                </button>
                <button type="button" onClick={() => setOpen(false)} className={btnSecondary}>
                  {tr("close")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
