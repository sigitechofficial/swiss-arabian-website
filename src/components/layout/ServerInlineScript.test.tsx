import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ServerInlineScript } from "./ServerInlineScript";

describe("ServerInlineScript", () => {
  it("is in the server HTML, where the browser runs it", () => {
    expect(renderToString(<ServerInlineScript html="window.__x=1" />)).toBe("<script>window.__x=1</script>");
  });

  it("is never created by a browser render (no React 'script tag' warning)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(<ServerInlineScript html="window.__x=1" />);
    expect(container.querySelector("script")).toBeNull();
    expect(error).not.toHaveBeenCalled();
    error.mockRestore();
  });
});
