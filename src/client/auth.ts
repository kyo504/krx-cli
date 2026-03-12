import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { CATEGORIES, type CategoryId } from "./endpoints.js";
import { krxFetch } from "./client.js";
import { getRecentTradingDate } from "../utils/date.js";

const CONFIG_DIR = path.join(os.homedir(), ".krx-cli");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface Config {
  readonly apiKey?: string;
  readonly serviceStatus?: Record<
    string,
    { approved: boolean; checkedAt: string }
  >;
}

function readConfig(): Config {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

function writeConfig(config: Config): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function getApiKey(): string | undefined {
  return process.env["KRX_API_KEY"] ?? readConfig().apiKey;
}

export function saveApiKey(apiKey: string): void {
  const config = readConfig();
  writeConfig({ ...config, apiKey });
}

export interface ServiceStatus {
  readonly approved: boolean;
  readonly checkedAt: string;
  readonly error?: string;
}

export async function checkCategoryApproval(
  apiKey: string,
  categoryId: CategoryId,
): Promise<ServiceStatus> {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    return { approved: false, checkedAt: new Date().toISOString() };
  }

  const basDd = getRecentTradingDate();

  try {
    const result = await krxFetch({
      endpoint: category.probeEndpoint,
      params: { basDd },
      apiKey,
    });

    const status: ServiceStatus = {
      approved: result.success,
      checkedAt: new Date().toISOString(),
      ...(result.error ? { error: result.error } : {}),
    };

    const config = readConfig();
    const serviceStatus = { ...config.serviceStatus, [categoryId]: status };
    writeConfig({ ...config, serviceStatus });

    return status;
  } catch {
    return { approved: false, checkedAt: new Date().toISOString() };
  }
}

export async function checkAllCategories(
  apiKey: string,
): Promise<Record<CategoryId, ServiceStatus>> {
  const results = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const status = await checkCategoryApproval(apiKey, cat.id);
      return [cat.id, status] as const;
    }),
  );

  return Object.fromEntries(results) as Record<CategoryId, ServiceStatus>;
}

export function getCachedServiceStatus(): Record<string, ServiceStatus> {
  return readConfig().serviceStatus ?? {};
}
