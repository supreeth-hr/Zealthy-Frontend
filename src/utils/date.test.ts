import {
  expandRecurringDates,
  expandRecurringDateTimes,
  formatDate,
  formatUtcDateTimeToLocal,
  isWithinNextSevenDays,
  isWithinThreeMonths,
  localDateTimeFieldsToUtcIso,
  utcDateTimeToLocalFields,
} from "./date";

describe("date utils", () => {
  describe("isWithinNextSevenDays", () => {
    const now = Date.UTC(2026, 0, 1, 0, 0, 0);

    it("returns true for dates inside and on both boundaries", () => {
      expect(isWithinNextSevenDays(new Date(now).toISOString(), now)).toBe(true);
      expect(isWithinNextSevenDays(new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), now)).toBe(true);
    });

    it("returns false for past dates or dates beyond seven days", () => {
      expect(isWithinNextSevenDays(new Date(now - 1).toISOString(), now)).toBe(false);
      expect(isWithinNextSevenDays(new Date(now + 7 * 24 * 60 * 60 * 1000 + 1).toISOString(), now)).toBe(false);
    });
  });

  describe("isWithinThreeMonths", () => {
    const now = Date.UTC(2026, 0, 1, 0, 0, 0);
    const threeMonthsMs = 90 * 24 * 60 * 60 * 1000;

    it("returns true for dates inside and on boundary", () => {
      expect(isWithinThreeMonths(new Date(now).toISOString(), now)).toBe(true);
      expect(isWithinThreeMonths(new Date(now + threeMonthsMs).toISOString(), now)).toBe(true);
    });

    it("returns false for dates outside range", () => {
      expect(isWithinThreeMonths(new Date(now - 1000).toISOString(), now)).toBe(false);
      expect(isWithinThreeMonths(new Date(now + threeMonthsMs + 1000).toISOString(), now)).toBe(false);
    });
  });

  describe("expandRecurringDateTimes", () => {
    const baseNow = Date.UTC(2026, 0, 1, 0, 0, 0);

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns empty array for invalid start date", () => {
      expect(expandRecurringDateTimes("not-a-date", "daily")).toEqual([]);
    });

    it("returns one instance for repeat=none when within three months", () => {
      jest.spyOn(Date, "now").mockReturnValue(baseNow);
      const start = new Date(baseNow + 24 * 60 * 60 * 1000).toISOString();
      expect(expandRecurringDateTimes(start, "none")).toEqual([start]);
    });

    it("returns no instances for repeat=none when outside three months", () => {
      jest.spyOn(Date, "now").mockReturnValue(baseNow);
      const outsideWindow = new Date(baseNow + 91 * 24 * 60 * 60 * 1000).toISOString();
      expect(expandRecurringDateTimes(outsideWindow, "none")).toEqual([]);
    });

    it("expands recurring weekly values and excludes past entries", () => {
      jest.spyOn(Date, "now").mockReturnValue(baseNow);
      const twoWeeksAgo = new Date(baseNow - 14 * 24 * 60 * 60 * 1000).toISOString();
      const results = expandRecurringDateTimes(twoWeeksAgo, "weekly");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toBe(new Date(baseNow).toISOString());
      expect(new Date(results[results.length - 1]).getTime()).toBeLessThanOrEqual(baseNow + 90 * 24 * 60 * 60 * 1000);
    });
  });

  describe("expandRecurringDates", () => {
    const baseNow = Date.UTC(2026, 0, 1, 0, 0, 0);

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns YYYY-MM-DD values for recurring schedules", () => {
      jest.spyOn(Date, "now").mockReturnValue(baseNow);
      const start = new Date(baseNow).toISOString().slice(0, 10);
      const results = expandRecurringDates(start, "monthly");

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toBe("2026-01-01");
      expect(results.every((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))).toBe(true);
    });

    it("returns empty array for invalid input", () => {
      expect(expandRecurringDates("bad-date", "daily")).toEqual([]);
    });
  });

  describe("localDateTimeFieldsToUtcIso", () => {
    it("converts valid local fields to an ISO string", () => {
      const result = localDateTimeFieldsToUtcIso("2026-04-25", "13:45");
      expect(result).not.toBeNull();
      expect(typeof result).toBe("string");
      expect(result?.endsWith("Z")).toBe(true);
    });

    it("returns null for malformed values or out-of-range parts", () => {
      expect(localDateTimeFieldsToUtcIso("2026/04/25", "13:45")).toBeNull();
      expect(localDateTimeFieldsToUtcIso("2026-04-25", "25:00")).toBeNull();
      expect(localDateTimeFieldsToUtcIso("2026-13-25", "13:45")).toBeNull();
    });
  });

  describe("utcDateTimeToLocalFields", () => {
    it("returns empty fields for empty or invalid inputs", () => {
      expect(utcDateTimeToLocalFields("")).toEqual({ date: "", time: "" });
      expect(utcDateTimeToLocalFields("not-a-date")).toEqual({ date: "", time: "" });
    });

    it("parses utc-like values into local date/time field strings", () => {
      const result = utcDateTimeToLocalFields("2026-01-02T03:04:00");
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.time).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("formatUtcDateTimeToLocal", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("returns empty string for empty input", () => {
      expect(formatUtcDateTimeToLocal("   ")).toBe("");
    });

    it("returns original input for invalid values", () => {
      expect(formatUtcDateTimeToLocal("invalid")).toBe("invalid");
    });

    it("formats valid input via Date.toLocaleString", () => {
      const localeSpy = jest.spyOn(Date.prototype, "toLocaleString").mockReturnValue("formatted-local");
      expect(formatUtcDateTimeToLocal("2026-01-02T03:04:00")).toBe("formatted-local");
      expect(localeSpy).toHaveBeenCalled();
    });
  });

  describe("formatDate", () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("treats ISO-like values as UTC calendar dates", () => {
      const spy = jest.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("iso-date");
      expect(formatDate("2026-04-26T00:00:00Z")).toBe("iso-date");
      expect(spy).toHaveBeenCalledWith(undefined, { timeZone: "UTC" });
    });

    it("uses default locale formatting for non-ISO-like inputs", () => {
      const spy = jest.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("local-date");
      expect(formatDate("April 26 2026")).toBe("local-date");
      expect(spy).toHaveBeenCalledWith();
    });
  });
});
