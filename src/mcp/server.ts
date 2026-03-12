import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createCategoryTools } from "./tools/index.js";
import { createSchemaTool } from "./tools/schema-tool.js";
import { createRateLimitTool } from "./tools/rate-limit-tool.js";
import { createSearchTool } from "./tools/search-tool.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "krx-cli",
    version: "1.2.0",
  });

  const allTools = [
    ...createCategoryTools(),
    createSchemaTool(),
    createRateLimitTool(),
    createSearchTool(),
  ];

  for (const tool of allTools) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (args) => {
      return tool.handler(args as Record<string, unknown>);
    });
  }

  return server;
}
