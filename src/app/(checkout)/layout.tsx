export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-page font-sans text-sa-primary">{children}</div>
  );
}
