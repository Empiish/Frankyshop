"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { signOut } from "@/app/admin/signout/action";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          await signOut();
        })
      }
      className={
        compact
          ? "flex h-9 items-center gap-1.5 rounded-full px-3 text-sm hover:bg-surface-muted"
          : "mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-surface-muted"
      }
      disabled={pending}
    >
      <LogOut className="h-3.5 w-3.5" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
