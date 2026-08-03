/**
 * Announcement Bar — prototype marquee on terra
 */
export function AnnouncementBar() {
  const message =
    "Orders placed after 26 May, 12:00 PM ship after the Eid holidays · Free shipping over $150";

  return (
    <div className="overflow-hidden bg-terra py-2 font-sans text-[11.5px] font-medium uppercase tracking-[0.16em] text-white">
      <div className="sa-marquee-track flex w-max whitespace-nowrap">
        <span className="px-10">{message}</span>
        <span className="px-10" aria-hidden>
          {message}
        </span>
        <span className="px-10" aria-hidden>
          {message}
        </span>
        <span className="px-10" aria-hidden>
          {message}
        </span>
      </div>
    </div>
  );
}
