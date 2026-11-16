import { act, renderHook } from "@testing-library/react";
import type { FormEvent } from "react";
import { describe, expect, it } from "vitest";
import { isNewsletterEmail, useNewsletterSignup } from "./useNewsletterSignup";

const submitEvent = () => ({ preventDefault: () => {} }) as unknown as FormEvent<HTMLFormElement>;

describe("useNewsletterSignup", () => {
  it("validates addresses", () => {
    expect(isNewsletterEmail("you@email.com")).toBe(true);
    expect(isNewsletterEmail(" you@email.com ")).toBe(true);
    expect(isNewsletterEmail("you@")).toBe(false);
  });

  it("accepts a valid address, flags an invalid one and resets", () => {
    const { result } = renderHook(() => useNewsletterSignup());
    act(() => result.current.onSubmit(submitEvent()));
    expect(result.current.submitted).toBe(false);
    act(() => result.current.setEmail("nope"));
    act(() => result.current.onSubmit(submitEvent()));
    expect(result.current.invalid).toBe(true);
    act(() => result.current.setEmail("you@email.com"));
    expect(result.current.invalid).toBe(false);
    act(() => result.current.onSubmit(submitEvent()));
    expect(result.current.submitted).toBe(true);
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ submitted: false, email: "" });
  });
});
