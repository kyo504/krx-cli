import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import { formatDateToYYYYMMDD } from "../utils/date.js";

const CACHE_DIR = path.join(os.homedir(), ".krx-cli", "cache");
const DATE_FORMAT = /^\d{8}$/;

function isValidCacheDate(date: string): boolean {
  return DATE_FORMAT.test(date);
}

function getCacheKey(endpoint: string, params: Record<string, string>): string {
  const sortedEntries = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const raw = `${endpoint}:${JSON.stringify(sortedEntries)}`;
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

function getCachePath(date: string, key: string): string {
  return path.join(CACHE_DIR, date, `${key}.json`);
}

function isToday(dateStr: string): boolean {
  const today = formatDateToYYYYMMDD(new Date());
  return dateStr === today;
}

export function getCached<T>(
  endpoint: string,
  params: Record<string, string>,
): readonly T[] | null {
  const date = params["basDd"];
  if (!date || !isValidCacheDate(date) || isToday(date)) {
    return null;
  }

  const key = getCacheKey(endpoint, params);
  const cachePath = getCachePath(date, key);

  try {
    const raw = fs.readFileSync(cachePath, "utf-8");
    return JSON.parse(raw) as readonly T[];
  } catch (err) {
    if (err instanceof Error && err.message.includes("ENOENT")) {
      return null;
    }
    process.stderr.write(`[krx-cli] cache read failed: ${String(err)}\n`);
    return null;
  }
}

export function setCached<T>(
  endpoint: string,
  params: Record<string, string>,
  data: readonly T[],
): void {
  const date = params["basDd"];
  if (!date || !isValidCacheDate(date) || isToday(date)) {
    return;
  }

  const key = getCacheKey(endpoint, params);
  const cachePath = getCachePath(date, key);
  const dir = path.dirname(cachePath);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(cachePath, JSON.stringify(data), "utf-8");
  } catch (err) {
    process.stderr.write(`[krx-cli] cache write failed: ${String(err)}\n`);
  }
}

export function clearCache(): { files: number; directories: number } {
  let files = 0;
  let directories = 0;

  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { files, directories };
    }

    const dateDirs = fs.readdirSync(CACHE_DIR);
    for (const dateDir of dateDirs) {
      const dirPath = path.join(CACHE_DIR, dateDir);
      const stat = fs.statSync(dirPath);
      if (stat.isDirectory()) {
        const cacheFiles = fs.readdirSync(dirPath);
        files += cacheFiles.length;
        fs.rmSync(dirPath, { recursive: true, force: true });
        directories += 1;
      }
    }
  } catch (err) {
    process.stderr.write(`[krx-cli] cache clear failed: ${String(err)}\n`);
  }

  return { files, directories };
}

export function getCacheStatus(): {
  totalFiles: number;
  totalSize: number;
  dates: number;
} {
  let totalFiles = 0;
  let totalSize = 0;
  let dates = 0;

  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { totalFiles, totalSize, dates };
    }

    const dateDirs = fs.readdirSync(CACHE_DIR);
    for (const dateDir of dateDirs) {
      const dirPath = path.join(CACHE_DIR, dateDir);
      const stat = fs.statSync(dirPath);
      if (stat.isDirectory()) {
        dates += 1;
        const cacheFiles = fs.readdirSync(dirPath);
        for (const file of cacheFiles) {
          const fileStat = fs.statSync(path.join(dirPath, file));
          totalFiles += 1;
          totalSize += fileStat.size;
        }
      }
    }
  } catch (err) {
    process.stderr.write(`[krx-cli] cache status failed: ${String(err)}\n`);
  }

  return { totalFiles, totalSize, dates };
}
