import { readFileSync, existsSync } from "fs";
import { parse as parseYaml } from "yaml";
import type { Scenario } from "../types.ts";

/**
 * Load and validate a scenario manifest from a YAML file.
 */
export function loadManifest(manifestPath: string): Scenario[] {
  if (!existsSync(manifestPath)) {
    throw new Error(`Scenario manifest not found: ${manifestPath}`);
  }

  const raw = readFileSync(manifestPath, "utf8");
  const data = parseYaml(raw) as { scenarios: Scenario[] };

  if (!Array.isArray(data?.scenarios)) {
    throw new Error("Manifest must have a top-level `scenarios` array");
  }

  return data.scenarios;
}
