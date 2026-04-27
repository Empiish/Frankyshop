"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { customerSignUp } from "@/app/[lang]/account/login/actions";

export function CustomerSignUpForm({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await customerSignUp(formData);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div>
      <p className="eyebrow">{dict.account.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">
        {dict.account.signup_title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {dict.account.signup_subtitle}
      </p>

      <form action={onSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
        <input type="hidden" name="lang" value={lang} />
        <label className="block">
          <span className="text-sm font-medium">{dict.account.full_name}</span>
          <input name="full_name" autoComplete="name" required className="input mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{dict.account.phone}</span>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+255…" required className="input mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{dict.account.email}</span>
          <input name="email" type="email" autoComplete="email" required className="input mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{dict.account.password}</span>
          <input name="password" type="password" autoComplete="new-password" minLength={8} required className="input mt-2" />
          <span className="mt-1 block text-xs text-muted-foreground">{dict.account.password_hint}</span>
        </label>
        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background hover:bg-accent disabled:opacity-60"
        >
          {pending ? dict.account.creating : dict.account.create_account}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {dict.account.have_account}{" "}
        <Link href={`/${lang}/account/login`} className="text-accent hover:underline">
          {dict.account.sign_in}
        </Link>
      </p>
    </div>
  );
}
