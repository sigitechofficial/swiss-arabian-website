import { AppCard } from "@/components/ui";

export function FeaturePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16">
      <AppCard title={title} subtitle="Waiting on backend wiring">
        <p className="text-sa-muted">{description}</p>
      </AppCard>
    </section>
  );
}
