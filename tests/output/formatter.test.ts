import { describe, it, expect } from "vitest";
import { formatOutput } from "../../src/output/formatter.js";

const SAMPLE_DATA = [
  { IDX_NM: "코스피", CLSPRC_IDX: "2650.00", FLUC_RT: "0.5" },
  { IDX_NM: "코스피 200", CLSPRC_IDX: "350.00", FLUC_RT: "-0.2" },
];

describe("formatOutput", () => {
  describe("json", () => {
    it("outputs valid JSON", () => {
      const result = formatOutput(SAMPLE_DATA, "json");
      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].IDX_NM).toBe("코스피");
    });

    it("pretty prints with 2-space indent", () => {
      const result = formatOutput(SAMPLE_DATA, "json");
      expect(result).toContain("\n");
      expect(result).toContain("  ");
    });
  });

  describe("ndjson", () => {
    it("outputs one JSON object per line", () => {
      const result = formatOutput(SAMPLE_DATA, "ndjson");
      const lines = result.split("\n");
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0]!).IDX_NM).toBe("코스피");
      expect(JSON.parse(lines[1]!).IDX_NM).toBe("코스피 200");
    });
  });

  describe("table", () => {
    it("outputs header, separator, and rows", () => {
      const result = formatOutput(SAMPLE_DATA, "table");
      const lines = result.split("\n");
      expect(lines.length).toBeGreaterThanOrEqual(4);
      expect(lines[0]).toContain("IDX_NM");
      expect(lines[1]).toMatch(/^-+/);
    });

    it("returns (no data) for empty array", () => {
      const result = formatOutput([], "table");
      expect(result).toBe("(no data)");
    });
  });

  describe("field filtering", () => {
    it("filters to specified fields", () => {
      const result = formatOutput(SAMPLE_DATA, "json", ["IDX_NM"]);
      const parsed = JSON.parse(result);
      expect(parsed[0]).toEqual({ IDX_NM: "코스피" });
      expect(parsed[0]).not.toHaveProperty("CLSPRC_IDX");
    });

    it("ignores non-existent fields", () => {
      const result = formatOutput(SAMPLE_DATA, "json", ["NONEXISTENT"]);
      const parsed = JSON.parse(result);
      expect(parsed[0]).toEqual({});
    });
  });
});
