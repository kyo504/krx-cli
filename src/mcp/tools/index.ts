import { z } from "zod/v4";
import {
  CATEGORIES,
  ENDPOINTS,
  type CategoryId,
  type EndpointDef,
} from "../../client/endpoints.js";
import { krxFetch } from "../../client/client.js";
import { getApiKey } from "../../client/auth.js";
import { validateDate } from "../../validator/index.js";

type ZodRawShape = Record<string, z.ZodType>;

interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: ZodRawShape;
  readonly handler: (args: Record<string, unknown>) => Promise<{
    content: readonly { type: string; text: string }[];
    isError?: boolean;
  }>;
}

function getEndpointShortName(path: string): string {
  return path.split("/").pop() ?? path;
}

function buildDescription(
  categoryId: CategoryId,
  endpoints: readonly EndpointDef[],
): string {
  const category = CATEGORIES.find((c) => c.id === categoryId);
  const endpointList = endpoints
    .map((e) => `- ${getEndpointShortName(e.path)}: ${e.descriptionKo}`)
    .join("\n");

  const fieldSample = endpoints[0]?.responseFields
    .slice(0, 6)
    .map((f) => `${f.name}(${f.description})`)
    .join(", ");

  return `Query KRX ${category?.name ?? categoryId} market data (${category?.nameKo ?? ""}).

Available endpoints:
${endpointList}

Common response fields: ${fieldSample}

Notes:
- Date format: YYYYMMDD (e.g., 20260310)
- Data is T-1 (previous trading day)
- All response values are strings
- Rate limit: 10,000 calls/day`;
}

function buildInputSchema(endpoints: readonly EndpointDef[]): ZodRawShape {
  const shortNames = endpoints.map((e) => getEndpointShortName(e.path));

  return {
    endpoint: z
      .enum(shortNames as [string, ...string[]])
      .describe("Endpoint short name"),
    date: z
      .string()
      .optional()
      .describe(
        "Trading date in YYYYMMDD format (default: recent trading day)",
      ),
    fields: z
      .array(z.string())
      .optional()
      .describe("Filter response to these field names only"),
  };
}

function filterFields(
  data: readonly Record<string, string>[],
  fields: readonly string[],
): readonly Record<string, string>[] {
  const fieldSet = new Set(fields);
  return data.map((row) => {
    const filtered: Record<string, string> = {};
    for (const key of Object.keys(row)) {
      if (fieldSet.has(key)) {
        filtered[key] = row[key];
      }
    }
    return filtered;
  });
}

function getRecentTradingDate(): string {
  const now = new Date();
  const day = now.getDay();
  const daysBack = day === 0 ? 2 : day === 6 ? 1 : day === 1 ? 3 : 1;
  const target = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const yyyy = target.getFullYear().toString();
  const mm = (target.getMonth() + 1).toString().padStart(2, "0");
  const dd = target.getDate().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function errorResult(message: string) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify({ error: message }) },
    ],
    isError: true,
  };
}

function createCategoryTool(categoryId: CategoryId): ToolDefinition {
  const endpoints = ENDPOINTS.filter((e) => e.category === categoryId);

  return {
    name: `krx_${categoryId}`,
    description: buildDescription(categoryId, endpoints),
    inputSchema: buildInputSchema(endpoints),
    handler: async (args) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return errorResult(
          "API key not configured. Set KRX_API_KEY environment variable.",
        );
      }

      const shortName = args.endpoint as string;
      const endpoint = endpoints.find(
        (e) => getEndpointShortName(e.path) === shortName,
      );
      if (!endpoint) {
        return errorResult(`Unknown endpoint: ${shortName}`);
      }

      const dateStr =
        (args.date as string | undefined) ?? getRecentTradingDate();

      try {
        validateDate(dateStr);
      } catch (err) {
        return errorResult(
          err instanceof Error ? err.message : "Invalid date format",
        );
      }

      const result = await krxFetch({
        endpoint: endpoint.path,
        params: { basDd: dateStr },
        apiKey,
      });

      if (!result.success) {
        return errorResult(result.error ?? "API request failed");
      }

      const fields = args.fields as string[] | undefined;
      const data = fields ? filterFields(result.data, fields) : result.data;

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  };
}

export function createCategoryTools(): readonly ToolDefinition[] {
  return CATEGORIES.map((cat) => createCategoryTool(cat.id));
}

export type { ToolDefinition };
