#!/usr/bin/env bun
/**
 * docsbot CLI
 *
 * Usage:
 *   docsbot generate  [--target <dir>] [--output <dir>] [--force]
 *   docsbot validate  [--target <dir>] [--output <dir>] [--skip <checks>]
 *   docsbot screenshots --app <url> --manifest <path> [--output <dir>]
 */

import { resolve, join } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { findSourceFiles } from "./parser/glob.ts";
import { parseFiles } from "./parser/parse.ts";
import { generateAgentDocs } from "./generator/generate.ts";
import { loadManifest } from "./screenshotter/manifest.ts";
import { captureScenarios, hashImage } from "./screenshotter/capture.ts";
import {
  checkDocsDrift,
  checkScreenshots,
  checkDocExamples,
  checkLlmReview,
  loadScreenshotHashes,
  printResults,
} from "./validator/validate.ts";
import type { DocSnapshot } from "./types.ts";

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
// Commands
// ---------------------------------------------------------------------------

async function cmdGenerate(args: string[]) {
  const targetDir = resolve(arg(args, "--target") ?? ".");
  const outputDir = resolve(arg(args, "--output") ?? "docs/agent");
  const force = hasFlag(args, "--force");

  console.log(`\nGenerating agent docs`);
  console.log(`  source : ${targetDir}`);
  console.log(`  output : ${outputDir}\n`);

  const files = findSourceFiles(targetDir);
  console.log(`  found ${files.length} source file(s)`);

  const modules = parseFiles(files, targetDir);
  const { generated, skipped } = await generateAgentDocs(modules, outputDir, force);

  console.log(`\n  generated: ${generated.length} module(s)`);
  console.log(`  skipped  : ${skipped.length} module(s) (unchanged)`);
  console.log("\nDone.\n");
}

async function cmdValidate(args: string[]) {
  const targetDir = resolve(arg(args, "--target") ?? ".");
  const outputDir = resolve(arg(args, "--output") ?? "docs/agent");
  const screenshotsDir = resolve(arg(args, "--screenshots") ?? "docs/screenshots");
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
  const appUrl = arg(args, "--app") ?? "http://localhost:5173";
  const manifestPath = resolve(arg(args, "--manifest") ?? "scenarios.yaml");
  const screenshotsDir = resolve(arg(args, "--screenshots") ?? "docs/screenshots");
  const outputDir = resolve(arg(args, "--output") ?? "docs/user");

  console.log(`\nCapturing screenshots`);
  console.log(`  app      : ${appUrl}`);
  console.log(`  manifest : ${manifestPath}`);
  console.log(`  output   : ${outputDir}\n`);

  const scenarios = loadManifest(manifestPath);
  const captures = await captureScenarios(scenarios, appUrl, screenshotsDir, outputDir);

  // Save screenshot hashes for future validation
  const hashes: Record<string, string> = {};
  for (const { scenario, screenshotPath } of captures) {
    hashes[scenario.id] = hashImage(screenshotPath);
  }
  const hashFile = join(screenshotsDir, "hashes.json");
  writeFileSync(hashFile, JSON.stringify(hashes, null, 2));
  console.log(`  saved screenshot hashes → ${hashFile}`);

  console.log(`\nCaptured ${captures.length} scenario(s). Done.\n`);
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
  --skip <checks>      Comma-separated list of checks to skip: drift,screenshots,examples,llm
  --app <url>          App URL for screenshots (default: http://localhost:5173)
  --manifest <path>    Scenario manifest YAML (default: scenarios.yaml)
`);
    process.exit(1);
}
