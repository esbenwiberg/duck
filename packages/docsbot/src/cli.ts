#!/usr/bin/env bun
/**
 * docsbot CLI
 *
 * Usage:
 *   docsbot generate    [--target <dir>] [--output <dir>] [--force] [--incremental]
 *   docsbot validate    [--target <dir>] [--output <dir>] [--skip <checks>]
 *   docsbot screenshots --app <url> --manifest <path> [--output <dir>] [--incremental]
 */

import { resolve, join } from "path";
import { existsSync, readFileSync } from "fs";
import { findSourceFiles } from "./parser/glob.ts";
import { parseFiles } from "./parser/parse.ts";
import { generateAgentDocs } from "./generator/generate.ts";
import { loadManifest } from "./screenshotter/manifest.ts";
import { captureScenarios, loadScreenshotSnapshot } from "./screenshotter/capture.ts";
import {
  checkDocsDrift,
  checkScreenshots,
  checkDocExamples,
  checkLlmReview,
  loadScreenshotHashes,
  printResults,
} from "./validator/validate.ts";
import { getHeadCommit, getChangedFiles, isGitRepo } from "./git.ts";
import type { DocSnapshot, DocbotConfig } from "./types.ts";

// ---------------------------------------------------------------------------
// Glob matching (minimal — supports * and ** wildcards)
// ---------------------------------------------------------------------------

function matchGlob(pattern: string, filePath: string): boolean {
  // Convert glob pattern to regex
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, "\\$&") // escape regex special chars
    .replace(/\*\*/g, "\x00")              // temporarily replace **
    .replace(/\*/g, "[^/]*")              // * → match within segment
    .replace(/\x00/g, ".*");              // ** → match any path
  return new RegExp(`^${escaped}$`).test(filePath);
}

// ---------------------------------------------------------------------------
// Arg parsing (no deps — keep it simple)
// ---------------------------------------------------------------------------

function arg(args: string[], flag: string, defaultValue?: string): string | undefined {
  const i = args.indexOf(flag);
  if (i === -1) return defaultValue;
  return args[i + 1];
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

// ---------------------------------------------------------------------------
// Config loading
// ---------------------------------------------------------------------------

function loadConfig(configPath?: string): DocbotConfig {
  const paths = configPath
    ? [resolve(configPath)]
    : [join(process.cwd(), "docsbot.config.json")];

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        return JSON.parse(readFileSync(p, "utf8")) as DocbotConfig;
      } catch {
        // malformed config — ignore and use defaults
      }
    }
  }
  return {};
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function cmdGenerate(args: string[]) {
  const config = loadConfig(arg(args, "--config"));
  const targetDir = resolve(arg(args, "--target") ?? config.target ?? ".");
  const outputDir = resolve(arg(args, "--output") ?? config.output ?? "docs/agent");
  const force = hasFlag(args, "--force");
  const incremental = hasFlag(args, "--incremental");

  console.log(`\nGenerating agent docs`);
  console.log(`  source : ${targetDir}`);
  console.log(`  output : ${outputDir}\n`);

  // Incremental: determine which files changed since last snapshot
  const cwd = process.cwd();
  const headCommit = isGitRepo(cwd) ? getHeadCommit(cwd) : null;

  let filesToProcess: Set<string> | undefined;

  if (incremental && headCommit) {
    const snapshotPath = join(outputDir, "docsbot-snapshot.json");
    const snapshot: DocSnapshot = existsSync(snapshotPath)
      ? JSON.parse(readFileSync(snapshotPath, "utf8"))
      : { generatedAt: "", modules: {} };

    if (snapshot.lastCommit) {
      const changedFiles = getChangedFiles(snapshot.lastCommit, cwd);
      if (changedFiles.length === 0) {
        console.log("  incremental: no changed files since last run\n");
        filesToProcess = new Set();
      } else {
        filesToProcess = new Set(changedFiles.map((f) => resolve(cwd, f)));
        console.log(
          `  incremental: ${changedFiles.length} changed file(s) since ${snapshot.lastCommit.slice(0, 7)}`
        );
      }
    } else {
      console.log("  incremental: no previous commit in snapshot — running full scan");
    }
  }

  const allFiles = findSourceFiles(targetDir);
  const files =
    filesToProcess !== undefined
      ? allFiles.filter((f) => filesToProcess!.has(resolve(f)))
      : allFiles;

  console.log(
    `  found ${allFiles.length} source file(s)${filesToProcess !== undefined ? `, processing ${files.length}` : ""}`
  );

  const modules = parseFiles(files, targetDir);
  const { generated, skipped } = await generateAgentDocs(
    modules,
    outputDir,
    force,
    headCommit ?? undefined
  );

  console.log(`\n  generated: ${generated.length} module(s)`);
  console.log(`  skipped  : ${skipped.length} module(s) (unchanged)`);
  console.log("\nDone.\n");
}

async function cmdValidate(args: string[]) {
  const config = loadConfig(arg(args, "--config"));
  const targetDir = resolve(arg(args, "--target") ?? config.target ?? ".");
  const outputDir = resolve(arg(args, "--output") ?? config.output ?? "docs/agent");
  const screenshotsDir = resolve(
    arg(args, "--screenshots") ?? config.screenshotsDir ?? "docs/screenshots"
  );
  const skip = (arg(args, "--skip") ?? "").split(",").filter(Boolean);

  console.log(`\nValidating docs`);
  console.log(`  source      : ${targetDir}`);
  console.log(`  agent docs  : ${outputDir}`);
  console.log(`  screenshots : ${screenshotsDir}\n`);

  const files = findSourceFiles(targetDir);
  const modules = parseFiles(files, targetDir);

  const snapshotPath = join(outputDir, "docsbot-snapshot.json");
  const snapshot: DocSnapshot = existsSync(snapshotPath)
    ? JSON.parse(readFileSync(snapshotPath, "utf8"))
    : { generatedAt: "", modules: {} };

  const results = [];

  if (!skip.includes("drift")) {
    results.push(checkDocsDrift(modules, snapshot, outputDir));
  }

  if (!skip.includes("screenshots")) {
    const storedHashes = loadScreenshotHashes(screenshotsDir);
    results.push(checkScreenshots(screenshotsDir, storedHashes));
  }

  if (!skip.includes("examples")) {
    const indexPath = join(outputDir, "index.md");
    results.push(checkDocExamples(indexPath));
  }

  if (!skip.includes("llm")) {
    results.push(await checkLlmReview(modules, snapshot));
  }

  printResults(results);

  const failed = results.filter((r) => !r.passed).length;
  process.exit(failed > 0 ? 1 : 0);
}

async function cmdScreenshots(args: string[]) {
  const config = loadConfig(arg(args, "--config"));
  const screenshotsCfg = config.screenshots ?? {};

  const appUrl = arg(args, "--app") ?? screenshotsCfg.app ?? "http://localhost:5173";
  const manifestPath = resolve(
    arg(args, "--manifest") ?? screenshotsCfg.manifest ?? "scenarios.yaml"
  );
  const screenshotsDir = resolve(
    arg(args, "--screenshots") ?? config.screenshotsDir ?? "docs/screenshots"
  );
  const outputDir = resolve(arg(args, "--output") ?? config.userDocsDir ?? "docs/user");
  const screenshotUrl = arg(args, "--screenshot-url");
  const incremental = hasFlag(args, "--incremental");

  console.log(`\nCapturing screenshots`);
  console.log(`  app      : ${appUrl}`);
  console.log(`  manifest : ${manifestPath}`);
  console.log(`  output   : ${outputDir}\n`);

  // Incremental: check if any UI-related files changed
  const cwd = process.cwd();
  const headCommit = isGitRepo(cwd) ? getHeadCommit(cwd) : null;

  if (incremental && headCommit) {
    const existingSnapshot = loadScreenshotSnapshot(screenshotsDir);
    const watchGlobs =
      existingSnapshot.watchGlobs.length > 0
        ? existingSnapshot.watchGlobs
        : (screenshotsCfg.watchGlobs ?? []);

    if (existingSnapshot.lastCommit && watchGlobs.length > 0) {
      const changedFiles = getChangedFiles(existingSnapshot.lastCommit, cwd);
      const uiChanged = changedFiles.some((file) =>
        watchGlobs.some((pattern) => matchGlob(pattern, file))
      );

      if (!uiChanged) {
        console.log("  screenshots up to date, skipping (no UI files changed)\n");
        return;
      }
      console.log(`  incremental: UI files changed — re-capturing all scenarios`);
    } else if (!existingSnapshot.lastCommit) {
      console.log("  incremental: no previous commit in snapshot — capturing all scenarios");
    }
  }

  const scenarios = loadManifest(manifestPath);
  const watchGlobs = screenshotsCfg.watchGlobs ?? [];
  await captureScenarios(
    scenarios,
    appUrl,
    screenshotsDir,
    outputDir,
    screenshotUrl,
    headCommit ?? undefined,
    watchGlobs
  );

  console.log(`\nCaptured ${scenarios.length} scenario(s). Done.\n`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

const [, , command, ...rest] = process.argv;

switch (command) {
  case "generate":
    await cmdGenerate(rest);
    break;
  case "validate":
    await cmdValidate(rest);
    break;
  case "screenshots":
    await cmdScreenshots(rest);
    break;
  default:
    console.log(`docsbot — auto documentation agent

Commands:
  generate    Parse source and generate agent docs
  validate    Validate docs against source (drift, screenshots, examples, LLM review)
  screenshots Capture UI screenshots and generate user-facing docs

Options:
  --target <dir>       Source directory to parse (default: .)
  --output <dir>       Output directory for agent docs (default: docs/agent)
  --screenshots <dir>  Screenshots directory (default: docs/screenshots)
  --force              Re-generate all docs even if unchanged
  --incremental        Only process files changed since last run (requires git)
  --skip <checks>      Comma-separated list of checks to skip: drift,screenshots,examples,llm
  --app <url>          App URL for screenshots (default: http://localhost:5173)
  --manifest <path>    Scenario manifest YAML (default: scenarios.yaml)
  --screenshot-url     URL prefix for screenshot image links in markdown
  --config <path>      Path to docsbot.config.json (default: ./docsbot.config.json)
`);
    process.exit(1);
}
