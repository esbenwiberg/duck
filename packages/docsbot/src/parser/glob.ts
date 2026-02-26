import { readdirSync, statSync } from "fs";
import { join, extname } from "path";

const EXTENSIONS = new Set([".ts", ".tsx"]);
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", "coverage"]);

/**
 * Recursively find all TypeScript source files under a directory.
 * Ignores node_modules, dist, .git, coverage.
 */
export function findSourceFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(current: string) {
    for (const entry of readdirSync(current)) {
      if (IGNORE_DIRS.has(entry)) continue;
      const full = join(current, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (EXTENSIONS.has(extname(entry))) {
        results.push(full);
      }
    }
  }

  walk(dir);
  return results;
}
