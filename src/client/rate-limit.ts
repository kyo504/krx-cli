import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".krx-cli");
const RATE_FILE = path.join(CONFIG_DIR, "rate-limit.json");
const DAILY_LIMIT = 10_000;
const WARNING_THRESHOLD = 0.8;

interface RateData {
  readonly date: string;
  readonly count: number;
}

function today(): string {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function readRateData(): RateData {
  try {
    const raw = fs.readFileSync(RATE_FILE, "utf-8");
    return JSON.parse(raw) as RateData;
  } catch {
    return { date: today(), count: 0 };
  }
}

function writeRateData(data: RateData): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(RATE_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function incrementCallCount(): { count: number; limit: number } {
  const data = readRateData();
  const currentDate = today();

  const newData: RateData =
    data.date === currentDate
      ? { date: currentDate, count: data.count + 1 }
      : { date: currentDate, count: 1 };

  writeRateData(newData);
  return { count: newData.count, limit: DAILY_LIMIT };
}

export function checkRateLimit(): {
  allowed: boolean;
  count: number;
  limit: number;
  warning: boolean;
} {
  const data = readRateData();
  const currentDate = today();

  const count = data.date === currentDate ? data.count : 0;
  const allowed = count < DAILY_LIMIT;
  const warning = count >= DAILY_LIMIT * WARNING_THRESHOLD;

  return { allowed, count, limit: DAILY_LIMIT, warning };
}

export function getRateLimitStatus(): {
  date: string;
  count: number;
  limit: number;
  remaining: number;
} {
  const data = readRateData();
  const currentDate = today();
  const count = data.date === currentDate ? data.count : 0;

  return {
    date: currentDate,
    count,
    limit: DAILY_LIMIT,
    remaining: DAILY_LIMIT - count,
  };
}
