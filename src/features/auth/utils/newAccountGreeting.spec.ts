import { afterEach, describe, expect, it } from "vitest";

import { clearNewAccount, isNewAccount, markNewAccount, welcomeHeading } from "./newAccountGreeting";

describe("newAccountGreeting", () => {
  afterEach(() => sessionStorage.clear());

  it("greets a just-created account with Welcome", () => {
    markNewAccount(" New@Example.com ");
    expect(isNewAccount("new@example.com")).toBe(true);
    expect(welcomeHeading("Sara", true)).toBe("Welcome, Sara");
  });

  it("keeps Welcome back for anyone else", () => {
    markNewAccount("new@example.com");
    expect(isNewAccount("other@example.com")).toBe(false);
    expect(isNewAccount(null)).toBe(false);
    expect(welcomeHeading("Sara", false)).toBe("Welcome back, Sara");
    expect(welcomeHeading("", false)).toBe("Welcome back");
  });

  it("treats the next sign-in after sign-out as a return", () => {
    markNewAccount("new@example.com");
    clearNewAccount();
    expect(isNewAccount("new@example.com")).toBe(false);
  });
});
