export function HomeStripSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <li
          key={index}
          className="flex-[0_0_clamp(190px,20vw,260px)] snap-start"
          aria-hidden="true"
        >
          <div className="mb-4 aspect-[4/5] animate-pulse rounded-[4px] bg-[#f1e7d4]" />
          <div className="mb-2 h-4 w-3/5 animate-pulse rounded-sm bg-[#f1e7d4]" />
          <div className="h-3 w-2/5 animate-pulse rounded-sm bg-[#f1e7d4]" />
        </li>
      ))}
    </>
  );
}
