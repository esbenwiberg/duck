/**
 * A parsed parameter or property from source code.
 */
export interface ParsedParam {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
}

/**
 * Metadata extracted from a single function or method declaration.
 */
export interface ParsedFunction {
  kind: "function" | "method" | "arrow";
  name: string;
  exported: boolean;
  async: boolean;
  params: ParsedParam[];
  returnType: string;
  /** JSDoc description if present */
  description?: string;
  /** JSDoc @example blocks */
  examples?: string[];
  lineStart: number;
  lineEnd: number;
}

/**
 * Metadata extracted from an interface or type alias.
 */
export interface ParsedType {
  kind: "interface" | "type";
  name: string;
  exported: boolean;
  description?: string;
  members: ParsedParam[];
}

/**
 * Metadata extracted from a class declaration.
 */
export interface ParsedClass {
  kind: "class";
  name: string;
  exported: boolean;
  description?: string;
  methods: ParsedFunction[];
}

/**
 * All extracted metadata for a single source file.
 */
export interface ParsedModule {
  filePath: string;
  /** Relative path used as identifier */
  moduleId: string;
  functions: ParsedFunction[];
  types: ParsedType[];
  classes: ParsedClass[];
  /** SHA-256 hash of file contents — used for drift detection */
  contentHash: string;
}

/**
 * Snapshot persisted to disk after each generate run.
 * Used to detect which modules changed between runs.
 */
export interface DocSnapshot {
  generatedAt: string;
  modules: Record<string, { contentHash: string; docPath: string }>;
}

/**
 * A single screenshot scenario defined in the manifest.
 */
export interface Scenario {
  id: string;
  description: string;
  /** URL path to navigate to */
  path: string;
  /** Optional Playwright actions to run before the screenshot */
  actions?: ScenarioAction[];
  /** Viewport override */
  viewport?: { width: number; height: number };
}

export type ScenarioAction =
  | { type: "fill"; selector: string; value: string }
  | { type: "click"; selector: string }
  | { type: "wait"; ms: number }
  | { type: "waitForSelector"; selector: string };

/**
 * Result of capturing a single scenario.
 */
export interface CapturedScenario {
  scenario: Scenario;
  screenshotPath: string;
  caption: string;
  capturedAt: string;
}

/**
 * Result of a single validation check.
 */
export interface ValidationResult {
  check: string;
  passed: boolean;
  message: string;
  details?: string[];
}
