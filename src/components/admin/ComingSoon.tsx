export function ComingSoon({
  title,
  blurb,
  eta,
}: {
  title: string;
  blurb: string;
  eta: string;
}) {
  return (
    <div>
      <p className="eyebrow">{eta}</p>
      <h1 className="font-display mt-2 text-4xl tracking-tight">{title}</h1>
      <p className="mt-3 max-w-2xl text-base text-muted-foreground">{blurb}</p>
      <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface-muted px-6 py-16 text-center">
        <p className="font-display text-2xl">Coming soon.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          The schema and storefront wiring are already in place — just the admin UI to do.
        </p>
      </div>
    </div>
  );
}
