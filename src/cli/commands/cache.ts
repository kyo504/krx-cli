import { Command } from "commander";
import { clearCache, getCacheStatus } from "../../cache/store.js";
import { writeOutput } from "../../output/formatter.js";

export function registerCacheCommand(program: Command): void {
  const cache = program
    .command("cache")
    .description("Manage API response cache");

  cache
    .command("status")
    .description("Show cache status")
    .action(() => {
      const status = getCacheStatus();
      writeOutput(
        JSON.stringify(
          {
            dates: status.dates,
            files: status.totalFiles,
            sizeBytes: status.totalSize,
            sizeMB: Math.round((status.totalSize / 1024 / 1024) * 100) / 100,
          },
          null,
          2,
        ),
      );
    });

  cache
    .command("clear")
    .description("Clear all cached data")
    .action(() => {
      const result = clearCache();
      writeOutput(
        JSON.stringify(
          {
            cleared: true,
            files: result.files,
            directories: result.directories,
          },
          null,
          2,
        ),
      );
    });
}
