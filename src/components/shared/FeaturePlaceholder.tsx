export function FeaturePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="rounded-lg border border-sa-border bg-surface px-6 py-8 sm:px-8">
        <h1 className="font-display text-3xl text-sa-primary sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-sa-secondary">Waiting on backend wiring</p>
        <p className="mt-4 text-sa-muted">{description}</p>
      </div>
    </section>
  );
}
