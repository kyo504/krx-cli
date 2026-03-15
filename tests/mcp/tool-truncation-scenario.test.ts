import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/client/client.js", () => ({
  krxFetch: vi.fn(),
}));

vi.mock("../../src/client/auth.js", () => ({
  getApiKey: vi.fn(() => "test-api-key"),
}));

vi.mock("../../src/utils/date.js", () => ({
  getRecentTradingDate: vi.fn(() => "20260310"),
  getTradingDays: vi.fn(),
}));

import { krxFetch } from "../../src/client/client.js";
import { createCategoryTools } from "../../src/mcp/tools/index.js";

const mockedKrxFetch = vi.mocked(krxFetch);

/**
 * Scenario: LLM이 전체 종목 리스트를 요청했을 때
 * 1. 첫 호출 → 1MB 초과 → truncation 메타데이터 반환
 * 2. Strategy A: fields로 축소 → 전체 행 수신
 * 3. Strategy B: offset+limit 페이지네이션 → 전체 행 수신
 */

// 500행 × 30필드 = ~2MB 데이터 생성
function generateStockData(count: number): Record<string, string>[] {
  return Array.from({ length: count }, (_, i) => {
    const row: Record<string, string> = {
      BAS_DD: "20260310",
      ISU_CD: `KR700${String(i).padStart(4, "0")}0`,
      ISU_NM: `테스트종목_${String(i).padStart(4, "0")}`,
      MKT_NM: "KOSPI",
      TDD_CLSPRC: String(10000 + i * 100),
      CMPPREVDD_PRC: String((i % 200) - 100),
      FLUC_RT: (Math.random() * 10 - 5).toFixed(2),
      TDD_OPNPRC: String(9900 + i * 100),
      TDD_HGPRC: String(10200 + i * 100),
      TDD_LWPRC: String(9800 + i * 100),
      ACC_TRDVOL: String(1000000 + i * 1000),
      ACC_TRDVAL: String(50000000000 + i * 100000),
      MKTCAP: String(100000000000 + i * 1000000),
      LIST_SHRS: String(5000000 + i * 100),
      SECT_TP_NM: "보통주",
    };
    // 추가 필드로 행 크기 키우기
    for (let f = 0; f < 15; f++) {
      row[`EXTRA_${f}`] = "x".repeat(150);
    }
    return row;
  });
}

const TOTAL_ROWS = 500;
const FULL_STOCK_DATA = generateStockData(TOTAL_ROWS);

describe("Scenario: tool handler 전체 리스트 수신", () => {
  let stockTool: ReturnType<typeof createCategoryTools>[number];

  beforeEach(() => {
    vi.clearAllMocks();
    const tools = createCategoryTools();
    stockTool = tools.find((t) => t.name === "krx_stock")!;
  });

  function setupMock() {
    mockedKrxFetch.mockResolvedValue({
      success: true,
      data: FULL_STOCK_DATA,
    });
  }

  it("1. 전체 요청 → truncation 발생 + 메타데이터 포함", async () => {
    setupMock();

    const result = await stockTool.handler({
      endpoint: "stk_bydd_trd",
      date: "20260310",
    });

    const parsed = JSON.parse(result.content[0]!.text) as {
      data: Record<string, string>[];
      _truncated: { total: number; returned: number; message: string };
    };

    expect(parsed._truncated).toBeDefined();
    expect(parsed._truncated.total).toBe(TOTAL_ROWS);
    expect(parsed._truncated.returned).toBeLessThan(TOTAL_ROWS);
    expect(parsed._truncated.returned).toBeGreaterThan(0);
    expect(parsed._truncated.message).toContain("offset=");
  });

  it("2. Strategy A: fields로 필수 필드만 요청 → 전체 행 수신", async () => {
    setupMock();

    const result = await stockTool.handler({
      endpoint: "stk_bydd_trd",
      date: "20260310",
      fields: ["ISU_CD", "ISU_NM", "TDD_CLSPRC", "FLUC_RT"],
    });

    const parsed = JSON.parse(result.content[0]!.text);

    // 배열이면 truncation 없이 전체 반환된 것
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(TOTAL_ROWS);

    // 요청한 필드만 포함
    const firstRow = parsed[0] as Record<string, string>;
    expect(Object.keys(firstRow).sort()).toEqual([
      "FLUC_RT",
      "ISU_CD",
      "ISU_NM",
      "TDD_CLSPRC",
    ]);
  });

  it("3. Strategy B: offset+limit 페이지네이션으로 전체 수신", async () => {
    setupMock();

    const allRows: Record<string, string>[] = [];
    const pageSize = 100;
    let offset = 0;
    let pageCount = 0;

    while (offset < TOTAL_ROWS) {
      const result = await stockTool.handler({
        endpoint: "stk_bydd_trd",
        date: "20260310",
        offset,
        limit: pageSize,
      });

      const parsed = JSON.parse(result.content[0]!.text);

      // 페이지 크기가 제한적이므로 truncation 없이 배열 반환
      expect(Array.isArray(parsed)).toBe(true);
      allRows.push(...(parsed as Record<string, string>[]));

      pageCount++;
      offset += pageSize;
    }

    // 5페이지로 전체 500행 수신
    expect(pageCount).toBe(5);
    expect(allRows.length).toBe(TOTAL_ROWS);

    // 데이터 무결성 확인: 첫/마지막 행
    expect(allRows[0]!.ISU_CD).toBe(FULL_STOCK_DATA[0]!.ISU_CD);
    expect(allRows[499]!.ISU_CD).toBe(FULL_STOCK_DATA[499]!.ISU_CD);

    // 중복 없음 확인
    const uniqueIds = new Set(allRows.map((r) => r.ISU_CD));
    expect(uniqueIds.size).toBe(TOTAL_ROWS);
  });

  it("4. truncation 후 안내된 offset으로 나머지 수신 가능", async () => {
    setupMock();

    // 첫 번째 호출: truncation 발생
    const firstResult = await stockTool.handler({
      endpoint: "stk_bydd_trd",
      date: "20260310",
    });

    const firstParsed = JSON.parse(firstResult.content[0]!.text) as {
      data: Record<string, string>[];
      _truncated: { total: number; returned: number; message: string };
    };

    const returned = firstParsed._truncated.returned;
    const collectedRows = [...firstParsed.data];

    // 두 번째 호출: truncation 메시지에서 안내된 offset 사용
    let offset = returned;
    while (offset < TOTAL_ROWS) {
      const nextResult = await stockTool.handler({
        endpoint: "stk_bydd_trd",
        date: "20260310",
        offset,
        limit: returned,
      });

      const nextParsed = JSON.parse(nextResult.content[0]!.text);
      if (Array.isArray(nextParsed)) {
        collectedRows.push(...(nextParsed as Record<string, string>[]));
      } else {
        const truncatedPage = nextParsed as {
          data: Record<string, string>[];
          _truncated: { returned: number };
        };
        collectedRows.push(...truncatedPage.data);
      }

      offset += returned;
    }

    // 전체 데이터 수신 완료
    expect(collectedRows.length).toBe(TOTAL_ROWS);

    const uniqueIds = new Set(collectedRows.map((r) => r.ISU_CD));
    expect(uniqueIds.size).toBe(TOTAL_ROWS);
  });
});
