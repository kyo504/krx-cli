import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createServer } from "./server.js";
import { getVersion } from "../cli/commands/version.js";

const MAX_SESSIONS = 100;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface HttpServerOptions {
  readonly port: number;
  readonly host: string;
}

interface HttpServerHandle {
  readonly port: number;
  readonly close: () => Promise<void>;
}

export function startHttpServer(
  options: HttpServerOptions,
): Promise<HttpServerHandle> {
  const { port, host } = options;
  const transports = new Map<string, StreamableHTTPServerTransport>();
  const sessionTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const initializingRequests = new Set<string>();

  function touchSession(sessionId: string): void {
    const existing = sessionTimers.get(sessionId);
    if (existing) clearTimeout(existing);

    sessionTimers.set(
      sessionId,
      setTimeout(() => {
        const transport = transports.get(sessionId);
        if (transport) {
          transport.close().catch(() => {});
          transports.delete(sessionId);
        }
        sessionTimers.delete(sessionId);
      }, SESSION_TTL_MS),
    );
  }

  function removeSession(sessionId: string): void {
    transports.delete(sessionId);
    const timer = sessionTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      sessionTimers.delete(sessionId);
    }
  }

  const app = createMcpExpressApp({ host });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.get("/health", (_req: any, res: any) => {
    res.json({
      status: "ok",
      version: getVersion(),
      transport: "streamable-http",
      sessions: transports.size,
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app.all("/mcp", async (req: any, res: any) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    try {
      if (req.method === "GET" || req.method === "DELETE") {
        const transport = sessionId ? transports.get(sessionId) : undefined;
        if (!transport) {
          res.status(400).json({ error: "Invalid or missing session ID" });
          return;
        }
        if (sessionId) touchSession(sessionId);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // POST with existing session
      if (sessionId && transports.has(sessionId)) {
        const transport = transports.get(sessionId)!;
        touchSession(sessionId);
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // New session: must be initialize request
      const body = req.body;
      if (!isInitializeRequest(body)) {
        res
          .status(400)
          .json({ error: "Bad Request: not an initialize request" });
        return;
      }

      // Session limit check
      if (transports.size >= MAX_SESSIONS) {
        res.status(503).json({ error: "Too many active sessions" });
        return;
      }

      // Race guard: prevent duplicate concurrent initializations
      const guardKey = randomUUID();
      if (initializingRequests.size > 0) {
        res.status(429).json({ error: "Initialization already in progress" });
        return;
      }
      initializingRequests.add(guardKey);

      try {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (id: string) => {
            transports.set(id, transport);
            touchSession(id);
          },
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            removeSession(transport.sessionId);
          }
        };

        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } finally {
        initializingRequests.delete(guardKey);
      }
    } catch {
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  return new Promise<HttpServerHandle>((resolve, reject) => {
    let httpServer: Server;

    try {
      httpServer = app.listen(port, host, () => {
        const addr = httpServer.address() as AddressInfo;
        resolve({
          port: addr.port,
          close: () => closeServer(httpServer, transports, sessionTimers),
        });
      });
    } catch (err) {
      reject(err);
      return;
    }

    httpServer.on("error", reject);
  });
}

async function closeServer(
  httpServer: Server,
  transports: Map<string, StreamableHTTPServerTransport>,
  sessionTimers: Map<string, ReturnType<typeof setTimeout>>,
): Promise<void> {
  for (const timer of sessionTimers.values()) {
    clearTimeout(timer);
  }
  sessionTimers.clear();

  const closePromises = [...transports.values()].map((t) =>
    t.close().catch(() => {}),
  );
  await Promise.all(closePromises);
  transports.clear();

  return new Promise<void>((resolve, reject) => {
    httpServer.close((err) => (err ? reject(err) : resolve()));
  });
}
