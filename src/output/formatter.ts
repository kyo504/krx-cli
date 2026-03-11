export type OutputFormat = "json" | "table" | "ndjson";

export function detectOutputFormat(explicit?: string): OutputFormat {
  if (explicit) {
    return explicit as OutputFormat;
  }
  return process.stdout.isTTY ? "table" : "json";
}

export function formatOutput(
  data: readonly Record<string, unknown>[],
  format: OutputFormat,
  fields?: readonly string[],
): string {
  const filtered = fields ? filterFields(data, fields) : data;

  switch (format) {
    case "json":
      return JSON.stringify(filtered, null, 2);
    case "ndjson":
      return filtered.map((row) => JSON.stringify(row)).join("\n");
    case "table":
      return formatTable(filtered);
  }
}

function filterFields(
  data: readonly Record<string, unknown>[],
  fields: readonly string[],
): readonly Record<string, unknown>[] {
  return data.map((row) => {
    const filtered: Record<string, unknown> = {};
    for (const field of fields) {
      if (field in row) {
        filtered[field] = row[field];
      }
    }
    return filtered;
  });
}

function formatTable(data: readonly Record<string, unknown>[]): string {
  if (data.length === 0) return "(no data)";

  const firstRow = data[0];
  if (!firstRow) return "(no data)";

  const keys = Object.keys(firstRow);
  const widths = keys.map((key) => {
    const values = data.map((row) => String(row[key] ?? ""));
    return Math.max(key.length, ...values.map((v) => v.length));
  });

  const header = keys.map((k, i) => k.padEnd(widths[i] ?? 0)).join("  ");
  const separator = widths.map((w) => "-".repeat(w)).join("  ");
  const rows = data.map((row) =>
    keys
      .map((k, i) => String(row[k] ?? "").padEnd(widths[i] ?? 0))
      .join("  "),
  );

  return [header, separator, ...rows].join("\n");
}

export function writeOutput(output: string): void {
  process.stdout.write(output + "\n");
}

export function writeError(message: string): void {
  process.stderr.write(`Error: ${message}\n`);
}
