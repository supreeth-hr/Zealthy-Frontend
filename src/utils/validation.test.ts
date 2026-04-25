import { isValidIsoDateOnly } from "./validation";

describe("isValidIsoDateOnly", () => {
  it("returns true for a valid calendar date", () => {
    expect(isValidIsoDateOnly("2026-04-25")).toBe(true);
  });

  it("accepts leap day in a leap year", () => {
    expect(isValidIsoDateOnly("2024-02-29")).toBe(true);
  });

  it("rejects leap day in a non-leap year", () => {
    expect(isValidIsoDateOnly("2023-02-29")).toBe(false);
  });

  it("rejects out-of-range month and day values", () => {
    expect(isValidIsoDateOnly("2026-13-01")).toBe(false);
    expect(isValidIsoDateOnly("2026-04-31")).toBe(false);
    expect(isValidIsoDateOnly("2026-00-10")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isValidIsoDateOnly("04-25-2026")).toBe(false);
    expect(isValidIsoDateOnly("2026/04/25")).toBe(false);
    expect(isValidIsoDateOnly("")).toBe(false);
  });
});
