"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { customerSignIn } from "@/app/[lang]/account/login/actions";

export function CustomerLoginForm({
  lang,
  dict,
  next,
}: {
  lang: Locale;
  dict: Dictionary;
  next?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await customerSignIn(formData);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div>
      <p className="eyebrow">{dict.account.eyebrow}</p>
      <h1 className="font-display mt-3 text-4xl tracking-tight">
        {dict.account.signin_title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {dict.account.signin_subtitle}
      </p>

      <form action={onSubmit} className="mt-8 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-7">
        <input type="hidden" name="lang" value={lang} />
        {next && <input type="hidden" name="next" value={next} />}
        <label className="block">
          <span className="text-sm font-medium">{dict.account.email}</span>
          <input name="email" type="email" autoComplete="email" autoFocus required className="input mt-2" />
        </label>
        <label className="block">
          <span className="text-sm font-medium">{dict.account.password}</span>
          <input name="password" type="password" autoComplete="current-password" required className="input mt-2" />
        </label>
        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background hover:bg-accent disabled:opacity-60"
        >
          {pending ? dict.account.signing_in : dict.account.sign_in}
          {!pending && <ArrowRight className="h-4 w-4" />}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {dict.account.no_account}{" "}
        <Link href={`/${lang}/account/signup`} className="text-accent hover:underline">
          {dict.account.create_account}
        </Link>
      </p>
    </div>
  );
}
