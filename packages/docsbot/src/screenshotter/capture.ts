import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { createHash as cryptoHash } from "crypto";
import type { Scenario, CapturedScenario, ScreenshotSnapshot } from "../types.ts";
import { captionScreenshot } from "../generator/llm.ts";

/**
 * Perceptual hash of a screenshot PNG for change detection.
 * Uses SHA-256 of the raw bytes — good enough for detecting any pixel change.
 */
export function hashImage(pngPath: string): string {
  const bytes = readFileSync(pngPath);
  return cryptoHash("sha256").update(bytes).digest("hex");
}

/**
 * Load the screenshot snapshot from hashes.json.
 * Backwards-compatible: if the file is a plain Record<string,string> (old format),
 * wraps it in a ScreenshotSnapshot with empty watchGlobs and no lastCommit.
 */
export function loadScreenshotSnapshot(screenshotsDir: string): ScreenshotSnapshot {
  const hashFile = join(screenshotsDir, "hashes.json");
  if (!existsSync(hashFile)) {
    return { capturedAt: "", watchGlobs: [], hashes: {} };
  }
  const raw = JSON.parse(readFileSync(hashFile, "utf8"));
  // New format has a `hashes` key; old format is a flat Record<string,string>
  if (raw && typeof raw === "object" && "hashes" in raw) {
    return raw as ScreenshotSnapshot;
  }
  // Old format — wrap it
  return { capturedAt: "", watchGlobs: [], hashes: raw as Record<string, string> };
}

/**
 * Run all scenarios from the manifest against a live app URL,
 * capture screenshots, generate captions, and write user-facing markdown docs.
 *
 * @param scenarios List of scenarios from the manifest
 * @param baseUrl The base URL of the running app (e.g. http://localhost:5173)
 * @param screenshotsDir Directory to save PNG files
 * @param outputDir Directory to write user-facing .md files
 * @param screenshotUrlBase URL prefix used in markdown image links (e.g. `/screenshots` for Docusaurus static). Defaults to absolute file path.
 * @param headCommit Current HEAD commit SHA — stored in snapshot for incremental runs
 * @param watchGlobs Glob patterns that trigger re-capture when matched files change
 */
export async function captureScenarios(
  scenarios: Scenario[],
  baseUrl: string,
  screenshotsDir: string,
  outputDir: string,
  screenshotUrlBase?: string,
  headCommit?: string,
  watchGlobs: string[] = []
): Promise<CapturedScenario[]> {
  mkdirSync(screenshotsDir, { recursive: true });
  mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const results: CapturedScenario[] = [];

  try {
    for (const scenario of scenarios) {
      console.log(`  capturing: ${scenario.id} — ${scenario.description}`);

      const context = await browser.newContext({
        viewport: scenario.viewport ?? { width: 1280, height: 800 },
      });
      const page = await context.newPage();

      await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "networkidle" });

      // Run scenario actions
      if (scenario.actions) {
        for (const action of scenario.actions) {
          if (action.type === "fill") {
            await page.fill(action.selector, action.value);
          } else if (action.type === "click") {
            await page.click(action.selector);
          } else if (action.type === "wait") {
            await page.waitForTimeout(action.ms);
          } else if (action.type === "waitForSelector") {
            await page.waitForSelector(action.selector);
          } else if (action.type === "deleteRequest") {
            await fetch(action.url, { method: "DELETE" });
          }
        }
      }

      const screenshotPath = join(screenshotsDir, `${scenario.id}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      await context.close();

      // Generate caption via LLM
      const base64 = readFileSync(screenshotPath).toString("base64");
      const caption = await captionScreenshot(scenario.description, base64);

      results.push({
        scenario,
        screenshotPath,
        caption,
        capturedAt: new Date().toISOString(),
      });
    }
  } finally {
    await browser.close();
  }

  // Write user-facing markdown doc
  writeUserDocs(results, screenshotsDir, outputDir, screenshotUrlBase);

  // Save screenshot snapshot (new ScreenshotSnapshot format)
  const hashes: Record<string, string> = {};
  for (const { scenario, screenshotPath } of results) {
    hashes[scenario.id] = hashImage(screenshotPath);
  }
  const snapshot: ScreenshotSnapshot = {
    capturedAt: new Date().toISOString(),
    watchGlobs,
    hashes,
  };
  if (headCommit) snapshot.lastCommit = headCommit;
  const hashFile = join(screenshotsDir, "hashes.json");
  writeFileSync(hashFile, JSON.stringify(snapshot, null, 2));

  return results;
}

function writeUserDocs(
  captures: CapturedScenario[],
  screenshotsDir: string,
  outputDir: string,
  screenshotUrlBase?: string
): void {
  const lines: string[] = [
    "<!-- generated by docsbot — do not edit manually -->",
    "",
    "# User Guide",
    "",
    "This guide was generated automatically from live screenshots of the application.",
    "",
  ];

  for (const { scenario, screenshotPath, caption } of captures) {
    const imgSrc = screenshotUrlBase
      ? `${screenshotUrlBase}/${basename(screenshotPath)}`
      : screenshotPath;

    lines.push(`## ${scenario.description}`, "");
    lines.push(caption, "");
    lines.push(`![${scenario.description}](${imgSrc})`, "");
  }

  const outPath = join(outputDir, "user-guide.md");
  writeFileSync(outPath, lines.join("\n"));
  console.log(`  wrote: ${outPath}`);
}
