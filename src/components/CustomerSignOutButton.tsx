"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import type { Locale } from "@/i18n/config";
import { customerSignOut } from "@/app/[lang]/account/signout/action";

export function CustomerSignOutButton({ lang, label }: { lang: Locale; label: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() => startTransition(() => customerSignOut(lang))}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-4 text-sm hover:bg-surface-muted disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "…" : label}
    </button>
  );
}
