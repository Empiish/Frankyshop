"use client";

import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { signIn } from "@/app/admin/login/actions";

export function LoginForm({ next }: { next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await signIn(formData);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <p className="font-display text-3xl tracking-tight">
        Franky<span className="text-accent">.</span> admin
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to manage products, orders and content.
      </p>

      <form action={onSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
        <input type="hidden" name="next" value={next} />
        <label className="block">
          <span className="text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            className="input mt-2"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input mt-2"
          />
        </label>
        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-colors hover:bg-accent disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
