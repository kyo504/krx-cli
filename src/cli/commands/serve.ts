import { Command } from "commander";
import { startHttpServer } from "../../mcp/http-server.js";
import { writeError } from "../../output/formatter.js";
import { getApiKey } from "../../client/auth.js";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

function parsePort(v: string): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(
      `Invalid port: "${v}". Must be an integer between 1 and 65535.`,
    );
  }
  return n;
}

export function registerServeCommand(program: Command): void {
  program
    .command("serve")
    .description("Start Streamable HTTP MCP server")
    .option("-p, --port <port>", "port to listen on", parsePort, 3000)
    .option("--host <host>", "host to bind to", "127.0.0.1")
    .action(async (opts: { port: number; host: string }) => {
      const { port, host } = opts;

      if (!getApiKey()) {
        process.stderr.write(
          "Warning: AUTH_KEY not set. Tool calls will fail until configured.\n",
        );
      }

      if (!LOOPBACK_HOSTS.has(host)) {
        process.stderr.write(
          `Warning: Binding to ${host} exposes the MCP server on all network interfaces without DNS rebinding protection.\n`,
        );
      }

      const handle = await startHttpServer({ port, host });

      process.stderr.write(
        `MCP server listening on http://${host}:${handle.port}/mcp\n`,
      );

      const shutdown = async () => {
        process.stderr.write("\nShutting down MCP server...\n");
        try {
          await handle.close();
        } catch (err) {
          writeError(err instanceof Error ? err.message : String(err));
        }
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    });
}
