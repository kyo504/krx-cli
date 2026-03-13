import { describe, it, expect, afterEach } from "vitest";
import { startHttpServer } from "../../src/mcp/http-server.js";

const HOST = "127.0.0.1";

type ServerHandle = Awaited<ReturnType<typeof startHttpServer>>;

function baseUrl(handle: ServerHandle): string {
  return `http://${HOST}:${handle.port}`;
}

describe("MCP HTTP Server", () => {
  let handle: ServerHandle | undefined;

  afterEach(async () => {
    if (handle) {
      await handle.close();
      handle = undefined;
    }
  });

  it("should start and stop without error", async () => {
    handle = await startHttpServer({ port: 0, host: HOST });
    expect(handle).toBeDefined();
    expect(handle.port).toBeGreaterThan(0);
    expect(handle.close).toBeTypeOf("function");
  });

  it("GET /health returns status ok", async () => {
    handle = await startHttpServer({ port: 0, host: HOST });

    const res = await fetch(`${baseUrl(handle)}/health`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.transport).toBe("streamable-http");
    expect(body.version).toBeTypeOf("string");
  });

  it("POST /mcp with non-initialize request returns 400", async () => {
    handle = await startHttpServer({ port: 0, host: HOST });

    const res = await fetch(`${baseUrl(handle)}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
    });

    expect(res.status).toBe(400);
  });

  it("GET /mcp without session ID returns 400", async () => {
    handle = await startHttpServer({ port: 0, host: HOST });

    const res = await fetch(`${baseUrl(handle)}/mcp`);
    expect(res.status).toBe(400);
  });

  it("DELETE /mcp without session ID returns 400", async () => {
    handle = await startHttpServer({ port: 0, host: HOST });

    const res = await fetch(`${baseUrl(handle)}/mcp`, { method: "DELETE" });
    expect(res.status).toBe(400);
  });

  it("POST /mcp initialize creates session", async () => {
    handle = await startHttpServer({ port: 0, host: HOST });

    const res = await fetch(`${baseUrl(handle)}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "initialize",
        id: 1,
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" },
        },
      }),
    });

    expect(res.status).toBe(200);
    const sessionId = res.headers.get("mcp-session-id");
    expect(sessionId).toBeTruthy();
  });
});
