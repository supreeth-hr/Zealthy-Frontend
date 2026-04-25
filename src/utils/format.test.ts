import { formatTitleCaseLabel } from "./format";

describe("formatTitleCaseLabel", () => {
  it("normalizes to title case and trims surrounding whitespace", () => {
    expect(formatTitleCaseLabel("  hELLo ")).toBe("Hello");
  });

  it("returns empty string for empty or whitespace-only input", () => {
    expect(formatTitleCaseLabel("")).toBe("");
    expect(formatTitleCaseLabel("   ")).toBe("");
  });

  it("handles already-capitalized values", () => {
    expect(formatTitleCaseLabel("World")).toBe("World");
  });
});
