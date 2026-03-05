import { describe, it, expect } from "vitest";
import { isValidUUID, isValidURL } from "./api-helpers";

describe("isValidUUID", () => {
  it("accepts valid UUIDs", () => {
    expect(isValidUUID("9c4d9d91-9458-413a-9049-c00daa128b62")).toBe(true);
    expect(isValidUUID("00000000-0000-0000-0000-000000000000")).toBe(true);
  });

  it("rejects invalid UUIDs", () => {
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("")).toBe(false);
    expect(isValidUUID("9c4d9d91-9458-413a-9049")).toBe(false);
    expect(isValidUUID("' OR 1=1 --")).toBe(false);
    expect(isValidUUID("9c4d9d91-9458-413a-9049-c00daa128b62; DROP TABLE users")).toBe(false);
  });
});

describe("isValidURL", () => {
  it("accepts valid http/https URLs", () => {
    expect(isValidURL("https://github.com/user")).toBe(true);
    expect(isValidURL("http://example.com")).toBe(true);
  });

  it("accepts empty strings", () => {
    expect(isValidURL("")).toBe(true);
  });

  it("rejects javascript: URLs", () => {
    expect(isValidURL("javascript:alert('xss')")).toBe(false);
  });

  it("rejects data: URLs", () => {
    expect(isValidURL("data:text/html,<h1>XSS</h1>")).toBe(false);
  });

  it("rejects invalid URLs", () => {
    expect(isValidURL("not-a-url")).toBe(false);
  });
});
