import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface WatchlistEntry {
  readonly isuCd: string;
  readonly isuSrtCd: string;
  readonly name: string;
  readonly market: string;
}

interface AddResult {
  readonly added: boolean;
  readonly reason?: "duplicate" | "write_error";
}

interface RemoveResult {
  readonly removed: boolean;
  readonly reason?: "not_found" | "write_error";
}

function getWatchlistPath(): string {
  return path.join(os.homedir(), ".krx-cli", "watchlist.json");
}

export function getWatchlist(): readonly WatchlistEntry[] {
  const filePath = getWatchlistPath();

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as readonly WatchlistEntry[];
  } catch (err) {
    process.stderr.write(`[krx-cli] watchlist read failed: ${String(err)}\n`);
    return [];
  }
}

export function saveWatchlist(entries: readonly WatchlistEntry[]): boolean {
  const filePath = getWatchlistPath();
  const dir = path.dirname(filePath);

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(entries, null, 2), "utf-8");
    return true;
  } catch (err) {
    process.stderr.write(`[krx-cli] watchlist write failed: ${String(err)}\n`);
    return false;
  }
}

export function addToWatchlist(entry: WatchlistEntry): AddResult {
  const current = getWatchlist();

  const isDuplicate = current.some((e) => e.isuCd === entry.isuCd);
  if (isDuplicate) {
    return { added: false, reason: "duplicate" };
  }

  const saved = saveWatchlist([...current, entry]);
  return saved ? { added: true } : { added: false, reason: "write_error" };
}

export function removeFromWatchlist(nameOrCode: string): RemoveResult {
  const current = getWatchlist();

  const filtered = current.filter(
    (e) => e.isuCd !== nameOrCode && e.name !== nameOrCode,
  );

  if (filtered.length === current.length) {
    return { removed: false, reason: "not_found" };
  }

  const saved = saveWatchlist(filtered);
  return saved ? { removed: true } : { removed: false, reason: "write_error" };
}
