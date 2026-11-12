import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { Profiler, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WishlistHeartButton } from "./WishlistHeartButton";
import { WishlistStatusScope } from "./WishlistStatusScope";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const IDS = [
  "0b6b2c1e-8a4f-4d2e-9c1a-1f2e3d4c5b6a",
  "1c7c3d2f-9b5a-4e3f-8d2b-2a3b4c5d6e7f",
  "2d8d4e3a-ac6b-4f4a-9e3c-3b4c5d6e7f8a",
];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("WishlistStatusScope", () => {
  it("settles after the cards register (no endless re-render loop)", async () => {
    let commits = 0;
    render(
      <Profiler id="scope" onRender={() => commits++}>
        <WishlistStatusScope>
          {IDS.map((id) => (
            <WishlistHeartButton key={id} productId={id} />
          ))}
        </WishlistStatusScope>
      </Profiler>,
      { wrapper },
    );

    // Let the batched register flush (setTimeout 0) and anything it triggers run.
    const counts: number[] = [];
    for (let i = 0; i < 6; i++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      counts.push(commits);
    }
    const settled = counts[2];

    // A loop keeps re-rendering on every timer tick; a settled scope stops.
    expect(counts[5]).toBe(settled);
    expect(settled).toBeLessThan(10);
  });
});
