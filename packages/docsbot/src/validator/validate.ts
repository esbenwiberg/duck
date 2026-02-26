import { readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import type { ParsedModule, DocSnapshot, ValidationResult } from "../types.ts";
import { reviewDocs } from "../generator/llm.ts";
import { hashImage } from "../screenshotter/capture.ts";

// ---------------------------------------------------------------------------
// Check 1: Docs match source (drift detection)
// ---------------------------------------------------------------------------

/**
 * Verify that every module's content hash in the snapshot still matches
 * the current source file. Flags modules that have changed since last generate.
 */
export function checkDocsDrift(
  modules: ParsedModule[],
  snapshot: DocSnapshot,
  outputDir: string
): ValidationResult {
  const issues: string[] = [];

  for (const mod of modules) {
    const snap = snapshot.modules[mod.moduleId];
    if (!snap) {
      // No doc generated for this module — only flag if it has exports
      if (mod.functions.length > 0 || mod.types.length > 0 || mod.classes.length > 0) {
        issues.push(`${mod.moduleId}: not yet documented`);
      }
      continue;
    }
    if (snap.contentHash !== mod.contentHash) {
      issues.push(`${mod.moduleId}: source changed since docs were generated`);
    }
    if (!existsSync(snap.docPath)) {
      issues.push(`${mod.moduleId}: doc file missing (${snap.docPath})`);
    }
  }

  return {
    check: "docs-drift",
    passed: issues.length === 0,
    message:
      issues.length === 0
        ? "All docs are up to date with source"
        : `${issues.length} module(s) have drifted`,
    details: issues,
  };
}

// ---------------------------------------------------------------------------
// Check 2: Screenshots are current
// ---------------------------------------------------------------------------

/**
 * Re-capture a screenshot for a single scenario and compare its hash
 * against the stored hash. Returns true if the image changed.
 *
 * We store hashes in a sidecar JSON next to screenshots.
 */
export function loadScreenshotHashes(screenshotsDir: string): Record<string, string> {
  const hashFile = join(screenshotsDir, "hashes.json");
  if (!existsSync(hashFile)) return {};
  return JSON.parse(readFileSync(hashFile, "utf8"));
}

export function checkScreenshots(
  screenshotsDir: string,
  storedHashes: Record<string, string>
): ValidationResult {
  const issues: string[] = [];

  for (const [id, storedHash] of Object.entries(storedHashes)) {
    const pngPath = join(screenshotsDir, `${id}.png`);
    if (!existsSync(pngPath)) {
      issues.push(`${id}: screenshot file missing`);
      continue;
    }
    const currentHash = hashImage(pngPath);
    if (currentHash !== storedHash) {
      issues.push(`${id}: screenshot has changed — re-run screenshots to update docs`);
    }
  }

  return {
    check: "screenshots-current",
    passed: issues.length === 0,
    message:
      issues.length === 0
        ? "All screenshots match stored hashes"
        : `${issues.length} screenshot(s) changed`,
    details: issues,
  };
}

// ---------------------------------------------------------------------------
// Check 3: Doc code examples execute
// ---------------------------------------------------------------------------

const CODE_BLOCK_RE = /```(?:typescript|ts|javascript|js)\n([\s\S]*?)```/g;

/**
 * Extract and run fenced TypeScript/JavaScript code blocks from a markdown file.
 * Each block is run in isolation via `bun eval`.
 */
export function checkDocExamples(docPath: string): ValidationResult {
  if (!existsSync(docPath)) {
    return {
      check: "doc-examples",
      passed: false,
      message: `Doc file not found: ${docPath}`,
    };
  }

  const content = readFileSync(docPath, "utf8");
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  CODE_BLOCK_RE.lastIndex = 0;
  while ((match = CODE_BLOCK_RE.exec(content)) !== null) {
    blocks.push(match[1]);
  }

  if (blocks.length === 0) {
    return {
      check: "doc-examples",
      passed: true,
      message: "No executable code blocks found",
    };
  }

  const issues: string[] = [];
  for (let i = 0; i < blocks.length; i++) {
    try {
      execSync(`bun eval "${blocks[i].replace(/"/g, '\\"')}"`, {
        timeout: 10_000,
        stdio: "pipe",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      issues.push(`Block ${i + 1}: ${msg.slice(0, 200)}`);
    }
  }

  return {
    check: "doc-examples",
    passed: issues.length === 0,
    message:
      issues.length === 0
        ? `All ${blocks.length} code block(s) executed successfully`
        : `${issues.length}/${blocks.length} code block(s) failed`,
    details: issues,
  };
}

// ---------------------------------------------------------------------------
// Check 4: LLM review
// ---------------------------------------------------------------------------

/**
 * Run an LLM review pass on each documented module.
 * Compares doc content against original source code.
 */
export async function checkLlmReview(
  modules: ParsedModule[],
  snapshot: DocSnapshot
): Promise<ValidationResult> {
  const issues: string[] = [];

  for (const mod of modules) {
    const snap = snapshot.modules[mod.moduleId];
    if (!snap || !existsSync(snap.docPath)) continue;

    const sourceCode = readFileSync(mod.filePath, "utf8");
    const docs = readFileSync(snap.docPath, "utf8");

    const found = await reviewDocs(sourceCode, docs);
    if (found.length > 0) {
      issues.push(`${mod.moduleId}:`);
      found.forEach((issue) => issues.push(`  - ${issue}`));
    }
  }

  return {
    check: "llm-review",
    passed: issues.length === 0,
    message:
      issues.length === 0
        ? "LLM review found no issues"
        : "LLM review found potential issues",
    details: issues,
  };
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export function printResults(results: ValidationResult[]): void {
  console.log("\n── Validation Report ──────────────────────────\n");
  for (const r of results) {
    const icon = r.passed ? "✓" : "✗";
    console.log(`${icon} [${r.check}] ${r.message}`);
    if (r.details?.length) {
      r.details.forEach((d) => console.log(`    ${d}`));
    }
  }
  console.log("\n────────────────────────────────────────────────");
  const failures = results.filter((r) => !r.passed).length;
  if (failures === 0) {
    console.log("All checks passed.\n");
  } else {
    console.log(`${failures} check(s) failed.\n`);
  }
}
