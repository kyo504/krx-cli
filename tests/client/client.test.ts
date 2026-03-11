import { describe, it, expect, vi, beforeEach } from "vitest";
import { krxFetch, BASE_URL } from "../../src/client/client.js";

describe("krxFetch", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends POST with correct headers and body", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        OutBlock_1: [{ BAS_DD: "20240105", IDX_NM: "코스피" }],
      }),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await krxFetch({
      endpoint: "/svc/apis/idx/kospi_dd_trd",
      params: { basDd: "20240105" },
      apiKey: "test-key",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE_URL}/svc/apis/idx/kospi_dd_trd`,
      {
        method: "POST",
        headers: {
          AUTH_KEY: "test-key",
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ basDd: "20240105" }),
      },
    );

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      BAS_DD: "20240105",
      IDX_NM: "코스피",
    });
  });

  it("returns error on non-ok response without JSON body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => {
          throw new Error("not json");
        },
      }),
    );

    const result = await krxFetch({
      endpoint: "/svc/apis/idx/kospi_dd_trd",
      params: { basDd: "20240105" },
      apiKey: "bad-key",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("403");
    expect(result.errorCode).toBeUndefined();
  });

  it("parses error body with respMsg and respCode on 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({
          respMsg: "Unauthorized API Call",
          respCode: "401",
        }),
      }),
    );

    const result = await krxFetch({
      endpoint: "/svc/apis/esg/esg_index_info",
      params: { basDd: "20240105" },
      apiKey: "test-key",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Unauthorized API Call");
    expect(result.errorCode).toBe("401");
  });

  it("returns error when OutBlock_1 is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ unexpected: "format" }),
      }),
    );

    const result = await krxFetch({
      endpoint: "/svc/apis/idx/kospi_dd_trd",
      params: { basDd: "20240105" },
      apiKey: "test-key",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("OutBlock_1");
  });

  it("returns empty data array on error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => {
          throw new Error("not json");
        },
      }),
    );

    const result = await krxFetch({
      endpoint: "/svc/apis/idx/kospi_dd_trd",
      params: { basDd: "20240105" },
      apiKey: "test-key",
    });

    expect(result.data).toEqual([]);
  });
});
