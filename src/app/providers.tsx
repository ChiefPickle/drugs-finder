"use client";

import { LocaleProvider } from "@/lib/i18n/context";
import { AuthProvider } from "@/lib/auth/context";
import { PrescriptionProvider } from "@/lib/prescription/context";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <PrescriptionProvider>
          {children}
          <ServiceWorkerRegister />
        </PrescriptionProvider>
      </AuthProvider>
    </LocaleProvider>
  );
}
