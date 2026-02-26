import { execSync } from "child_process";

/**
 * Returns the current HEAD commit SHA, or null if not in a git repo / git unavailable.
 */
export function getHeadCommit(cwd: string): string | null {
  try {
    return execSync("git rev-parse HEAD", { cwd, stdio: "pipe" })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

/**
 * Returns the list of files changed between `since` and HEAD (relative paths).
 * Returns an empty array if git is unavailable or the commit is not found.
 */
export function getChangedFiles(since: string, cwd: string): string[] {
  try {
    const output = execSync(`git diff --name-only ${since} HEAD`, {
      cwd,
      stdio: "pipe",
    })
      .toString()
      .trim();
    if (!output) return [];
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Returns true if `cwd` is inside a git repository.
 */
export function isGitRepo(cwd: string): boolean {
  try {
    execSync("git rev-parse --git-dir", { cwd, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}
