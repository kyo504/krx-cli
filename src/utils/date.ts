export function formatDateToYYYYMMDD(date: Date): string {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** Returns the most recent KRX trading day in YYYYMMDD. Dates computed in KST (UTC+9). */
export function getRecentTradingDate(): string {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS);
  const day = nowKst.getUTCDay();
  const daysBack = day === 0 ? 2 : day === 6 ? 1 : day === 1 ? 3 : 1;
  const targetKst = new Date(nowKst.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const yyyy = targetKst.getUTCFullYear().toString();
  const mm = (targetKst.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = targetKst.getUTCDate().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function parseYYYYMMDD(str: string): Date {
  const year = parseInt(str.substring(0, 4));
  const month = parseInt(str.substring(4, 6)) - 1;
  const day = parseInt(str.substring(6, 8));
  return new Date(year, month, day);
}

export function getTradingDays(from: string, to: string): readonly string[] {
  const fromDate = parseYYYYMMDD(from);
  const toDate = parseYYYYMMDD(to);

  const days: string[] = [];
  let current = new Date(fromDate);

  while (current <= toDate) {
    if (!isWeekend(current)) {
      days.push(formatDateToYYYYMMDD(current));
    }
    current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
  }

  return days;
}
