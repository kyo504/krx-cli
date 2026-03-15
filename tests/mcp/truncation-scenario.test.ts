import { describe, it, expect } from "vitest";
import { successResult } from "../../src/mcp/tools/result.js";
import { applyPipeline } from "../../src/utils/data-pipeline.js";

/**
 * Scenario tests for MCP tool result truncation.
 *
 * When a full market listing exceeds the 1MB tool result limit,
 * the LLM should still be able to retrieve ALL data by:
 *   Strategy A: Using 'fields' to reduce row size so all rows fit
 *   Strategy B: Using 'offset' + 'limit' to paginate through chunks
 */

// Generate a large dataset simulating a full KOSPI stock listing
function generateLargeDataset(
  rowCount: number,
  fieldsPerRow: number,
): Record<string, string>[] {
  return Array.from({ length: rowCount }, (_, i) => {
    const row: Record<string, string> = {
      ISU_CD: `KR700${String(i).padStart(4, "0")}0`,
      ISU_NM: `종목_${i}`,
      MKT_NM: i % 2 === 0 ? "KOSPI" : "KOSDAQ",
      TDD_CLSPRC: String(10000 + i * 100),
      FLUC_RT: (Math.random() * 10 - 5).toFixed(2),
    };
    // Add extra fields to increase row size
    for (let f = 0; f < fieldsPerRow - 5; f++) {
      row[`EXTRA_FIELD_${f}`] = "x".repeat(150);
    }
    return row;
  });
}

describe("Truncation scenario: full list retrieval strategies", () => {
  // Large dataset: 500 rows × 30 fields → well over 1MB
  const FULL_DATA = generateLargeDataset(500, 30);

  it("full dataset exceeds 1MB and gets truncated with metadata", () => {
    const result = successResult(FULL_DATA);
    const parsed = JSON.parse(result.content[0]!.text) as {
      data: unknown[];
      _truncated: { total: number; returned: number; message: string };
    };

    expect(parsed._truncated).toBeDefined();
    expect(parsed._truncated.total).toBe(500);
    expect(parsed._truncated.returned).toBeLessThan(500);
    expect(parsed._truncated.message).toContain("offset=");
    expect(parsed._truncated.message).toContain("fields");
  });

  it("Strategy A: using fields reduces size so all rows fit", () => {
    // Simulate LLM selecting only essential fields
    const essentialFields = new Set([
      "ISU_CD",
      "ISU_NM",
      "TDD_CLSPRC",
      "FLUC_RT",
    ]);
    const narrowed = FULL_DATA.map((row) => {
      const filtered: Record<string, string> = {};
      for (const key of Object.keys(row)) {
        if (essentialFields.has(key)) {
          filtered[key] = row[key]!;
        }
      }
      return filtered;
    });

    const result = successResult(narrowed);
    const parsed = JSON.parse(result.content[0]!.text);

    // Should NOT be truncated — all 500 rows fit
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(500);
  });

  it("Strategy B: paginating with offset+limit retrieves all data", () => {
    const allCollected: Record<string, unknown>[] = [];
    const pageSize = 100;
    let offset = 0;

    // Simulate multiple tool calls with offset+limit
    while (offset < FULL_DATA.length) {
      const page = applyPipeline(FULL_DATA, {
        offset,
        limit: pageSize,
      }) as Record<string, string>[];

      const result = successResult(page);
      const parsed = JSON.parse(result.content[0]!.text);

      // Each page should fit within the limit (not truncated)
      if (Array.isArray(parsed)) {
        allCollected.push(...parsed);
      } else {
        // Even if a single page is truncated, collect what we got
        allCollected.push(...(parsed.data as Record<string, unknown>[]));
      }

      offset += pageSize;
    }

    // All 500 rows should be collected across pages
    expect(allCollected.length).toBe(500);

    // Verify data integrity: first and last rows match
    expect((allCollected[0] as Record<string, string>).ISU_CD).toBe(
      FULL_DATA[0]!.ISU_CD,
    );
    expect((allCollected[499] as Record<string, string>).ISU_CD).toBe(
      FULL_DATA[499]!.ISU_CD,
    );
  });

  it("Strategy B: each page is within 1MB", () => {
    const pageSize = 100;

    for (let offset = 0; offset < FULL_DATA.length; offset += pageSize) {
      const page = applyPipeline(FULL_DATA, {
        offset,
        limit: pageSize,
      }) as Record<string, string>[];

      const result = successResult(page);
      const bytes = Buffer.byteLength(result.content[0]!.text, "utf-8");

      expect(bytes).toBeLessThan(1_000_000);
    }
  });

  it("truncation metadata suggests correct offset for next page", () => {
    const result = successResult(FULL_DATA);
    const parsed = JSON.parse(result.content[0]!.text) as {
      data: unknown[];
      _truncated: { total: number; returned: number; message: string };
    };

    const returned = parsed._truncated.returned;

    // The message should suggest the correct offset for the next request
    expect(parsed._truncated.message).toContain(`offset=${returned}`);

    // Using the suggested offset should give us the next chunk
    const nextPage = applyPipeline(FULL_DATA, {
      offset: returned,
      limit: returned,
    });
    expect(nextPage.length).toBeGreaterThan(0);
    expect(nextPage.length).toBeLessThanOrEqual(returned);
  });
});

describe("applyPipeline offset", () => {
  const data = Array.from({ length: 10 }, (_, i) => ({
    id: String(i),
    value: String(i * 10),
  }));

  it("offset skips first N rows", () => {
    const result = applyPipeline(data, { offset: 3 });
    expect(result.length).toBe(7);
    expect(result[0]).toEqual({ id: "3", value: "30" });
  });

  it("offset + limit gives a window", () => {
    const result = applyPipeline(data, { offset: 2, limit: 3 });
    expect(result.length).toBe(3);
    expect(result[0]).toEqual({ id: "2", value: "20" });
    expect(result[2]).toEqual({ id: "4", value: "40" });
  });

  it("offset beyond data length returns empty", () => {
    const result = applyPipeline(data, { offset: 100 });
    expect(result.length).toBe(0);
  });

  it("no offset returns all data", () => {
    const result = applyPipeline(data, {});
    expect(result.length).toBe(10);
  });
});
