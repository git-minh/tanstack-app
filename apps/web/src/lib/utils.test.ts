import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility function", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional class names", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes and resolve conflicts", () => {
    // Later classes should override earlier ones for the same property
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("should handle undefined and null values", () => {
    expect(cn("foo", undefined, "bar", null, "baz")).toBe("foo bar baz");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
  });

  it("should handle array of class names", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("should handle object with boolean values", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });
});
