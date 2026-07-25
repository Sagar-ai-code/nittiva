import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("merges class names correctly", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("handles conditional classes", () => {
    expect(cn("base", { conditional: true, ignored: false })).toBe(
      "base conditional",
    );
  });

  it("handles tailwind merge conflicts", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "other")).toBe("base other");
  });

  it("handles arrays", () => {
    expect(cn(["base", "other"], "additional")).toBe("base other additional");
  });
});
