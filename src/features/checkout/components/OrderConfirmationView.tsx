export function OrderConfirmationView({ orderId }: { orderId: string }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Thank you</p>
      <h1 className="mt-3 font-display text-4xl text-sa-primary">Order confirmed</h1>
      <p className="mt-4 text-sa-muted">Reference {orderId}</p>
    </section>
  );
}
