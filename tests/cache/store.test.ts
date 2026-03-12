import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Mock the cache directory
vi.mock("node:os", async () => {
  const actual = await vi.importActual<typeof import("node:os")>("node:os");
  return {
    ...actual,
    homedir: () => path.join(os.tmpdir(), "krx-cli-test-home"),
  };
});

// Mock date to control "today"
vi.mock("../../src/utils/date.js", () => ({
  formatDateToYYYYMMDD: () => "20260312",
}));

import {
  getCached,
  setCached,
  clearCache,
  getCacheStatus,
} from "../../src/cache/store.js";

const TEST_HOME = path.join(os.tmpdir(), "krx-cli-test-home");
const TEST_CACHE = path.join(TEST_HOME, ".krx-cli", "cache");

describe("cache store", () => {
  beforeEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
  });

  afterEach(() => {
    fs.rmSync(TEST_HOME, { recursive: true, force: true });
  });

  describe("getCached", () => {
    it("returns null when no cache exists", () => {
      const result = getCached("/svc/apis/sto/stk_bydd_trd", {
        basDd: "20260310",
      });
      expect(result).toBeNull();
    });

    it("returns null for today's date (no cache)", () => {
      // Today is mocked as 20260312
      const result = getCached("/svc/apis/sto/stk_bydd_trd", {
        basDd: "20260312",
      });
      expect(result).toBeNull();
    });

    it("returns cached data for past dates", () => {
      const data = [{ ISU_NM: "삼성전자", TDD_CLSPRC: "75000" }];
      setCached("/svc/apis/sto/stk_bydd_trd", { basDd: "20260310" }, data);

      const result = getCached("/svc/apis/sto/stk_bydd_trd", {
        basDd: "20260310",
      });
      expect(result).toEqual(data);
    });

    it("returns null when params don't match", () => {
      const data = [{ ISU_NM: "삼성전자" }];
      setCached("/svc/apis/sto/stk_bydd_trd", { basDd: "20260310" }, data);

      const result = getCached("/svc/apis/sto/stk_bydd_trd", {
        basDd: "20260309",
      });
      expect(result).toBeNull();
    });

    it("rejects invalid date format (path traversal prevention)", () => {
      const result = getCached("/svc/apis/sto/stk_bydd_trd", {
        basDd: "../../../etc",
      });
      expect(result).toBeNull();
    });
  });

  describe("setCached", () => {
    it("does not cache today's data", () => {
      const data = [{ ISU_NM: "test" }];
      setCached("/svc/apis/sto/stk_bydd_trd", { basDd: "20260312" }, data);

      const result = getCached("/svc/apis/sto/stk_bydd_trd", {
        basDd: "20260312",
      });
      expect(result).toBeNull();
    });

    it("does not cache when no basDd param", () => {
      const data = [{ ISU_NM: "test" }];
      setCached("/svc/apis/sto/stk_isu_base_info", {}, data);

      const result = getCached("/svc/apis/sto/stk_isu_base_info", {});
      expect(result).toBeNull();
    });

    it("rejects invalid date format for setCached", () => {
      const data = [{ ISU_NM: "test" }];
      setCached("/svc/apis/sto/stk_bydd_trd", { basDd: "../../hack" }, data);

      const datePath = path.join(TEST_CACHE, "../../hack");
      expect(fs.existsSync(datePath)).toBe(false);
    });

    it("creates cache directory structure", () => {
      const data = [{ ISU_NM: "test" }];
      setCached("/svc/apis/sto/stk_bydd_trd", { basDd: "20260310" }, data);

      const datePath = path.join(TEST_CACHE, "20260310");
      expect(fs.existsSync(datePath)).toBe(true);
    });
  });

  describe("clearCache", () => {
    it("returns zero counts when no cache exists", () => {
      const result = clearCache();
      expect(result).toEqual({ files: 0, directories: 0 });
    });

    it("clears all cached data", () => {
      setCached("/endpoint1", { basDd: "20260310" }, [{ a: "1" }]);
      setCached("/endpoint2", { basDd: "20260309" }, [{ b: "2" }]);

      const result = clearCache();
      expect(result.files).toBeGreaterThan(0);
      expect(result.directories).toBeGreaterThan(0);

      // Verify cache is empty
      const status = getCacheStatus();
      expect(status.totalFiles).toBe(0);
    });
  });

  describe("getCacheStatus", () => {
    it("returns zero when no cache", () => {
      const status = getCacheStatus();
      expect(status).toEqual({ totalFiles: 0, totalSize: 0, dates: 0 });
    });

    it("reports correct counts", () => {
      setCached("/endpoint1", { basDd: "20260310" }, [{ a: "1" }]);
      setCached("/endpoint2", { basDd: "20260310" }, [{ b: "2" }]);
      setCached("/endpoint3", { basDd: "20260309" }, [{ c: "3" }]);

      const status = getCacheStatus();
      expect(status.totalFiles).toBe(3);
      expect(status.dates).toBe(2);
      expect(status.totalSize).toBeGreaterThan(0);
    });
  });
});
