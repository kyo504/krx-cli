import { describe, it, expect } from "vitest";
import {
  validateDate,
  validateMarket,
  validateNoInjection,
} from "../../src/validator/index.js";

describe("validateDate", () => {
  it("accepts valid YYYYMMDD date", () => {
    expect(validateDate("20240105")).toBe("20240105");
  });

  it("accepts date from 2010", () => {
    expect(validateDate("20100101")).toBe("20100101");
  });

  it("rejects non-numeric string", () => {
    expect(() => validateDate("abcdefgh")).toThrow();
  });

  it("rejects too short string", () => {
    expect(() => validateDate("2024")).toThrow();
  });

  it("rejects too long string", () => {
    expect(() => validateDate("202401051")).toThrow();
  });

  it("rejects invalid month", () => {
    expect(() => validateDate("20241301")).toThrow();
  });

  it("rejects invalid day", () => {
    expect(() => validateDate("20240132")).toThrow();
  });

  it("rejects date before 2010", () => {
    expect(() => validateDate("20090101")).toThrow();
  });

  it("rejects Feb 30", () => {
    expect(() => validateDate("20240230")).toThrow();
  });

  it("accepts Feb 29 on leap year", () => {
    expect(validateDate("20240229")).toBe("20240229");
  });

  it("rejects Feb 29 on non-leap year", () => {
    expect(() => validateDate("20230229")).toThrow();
  });
});

describe("validateMarket", () => {
  it("accepts kospi", () => {
    expect(validateMarket("kospi")).toBe("kospi");
  });

  it("accepts kosdaq", () => {
    expect(validateMarket("kosdaq")).toBe("kosdaq");
  });

  it("accepts konex", () => {
    expect(validateMarket("konex")).toBe("konex");
  });

  it("accepts krx", () => {
    expect(validateMarket("krx")).toBe("krx");
  });

  it("is case insensitive", () => {
    expect(validateMarket("KOSPI")).toBe("kospi");
  });

  it("rejects invalid market", () => {
    expect(() => validateMarket("nasdaq")).toThrow();
  });
});

describe("validateNoInjection", () => {
  it("returns null for clean input", () => {
    expect(validateNoInjection("hello")).toBeNull();
  });

  it("detects control characters", () => {
    expect(validateNoInjection("hello\x00world")).toBe(
      "Input contains control characters",
    );
  });

  it("detects path traversal", () => {
    expect(validateNoInjection("../../etc/passwd")).toBe(
      "Input contains path traversal",
    );
  });

  it("allows normal paths", () => {
    expect(validateNoInjection("some/path")).toBeNull();
  });
});
