import type { ParsedModule, ParsedFunction, ParsedType, ParsedClass } from "../types.ts";

// ---------------------------------------------------------------------------
// Prompt builders — convert parsed metadata into LLM prompts
// ---------------------------------------------------------------------------

function functionPrompt(fn: ParsedFunction): string {
  const params = fn.params
    .map((p) => `  - \`${p.name}${p.optional ? "?" : ""}: ${p.type}\``)
    .join("\n");

  return `
### \`${fn.name}\`

**Kind:** ${fn.kind}${fn.async ? " (async)" : ""}
**Exported:** ${fn.exported}
${fn.description ? `**Description:** ${fn.description}` : ""}
**Parameters:**
${params || "  (none)"}
**Returns:** \`${fn.returnType}\`
${fn.examples?.length ? `**Examples:**\n${fn.examples.map((e) => "```\n" + e + "\n```").join("\n")}` : ""}
`.trim();
}

function typePrompt(t: ParsedType): string {
  const members = t.members
    .map((m) => `  - \`${m.name}${m.optional ? "?" : ""}: ${m.type}\`${m.description ? ` — ${m.description}` : ""}`)
    .join("\n");

  return `
### \`${t.name}\` (${t.kind})

${t.description ?? ""}
**Members:**
${members || "  (none)"}
`.trim();
}

function classPrompt(c: ParsedClass): string {
  return `
### \`${c.name}\` (class)

${c.description ?? ""}
**Methods:** ${c.methods.map((m) => `\`${m.name}\``).join(", ")}
`.trim();
}

/**
 * Build the full LLM prompt for generating agent docs for a module.
 */
export function buildModulePrompt(module: ParsedModule): string {
  const sections: string[] = [
    `Generate API reference documentation for the module \`${module.moduleId}\`.`,
    `Use the structured metadata below to write accurate markdown documentation.`,
    `Include a short module overview, then document each export.`,
    ``,
  ];

  if (module.functions.length) {
    sections.push("## Functions");
    module.functions.forEach((fn) => sections.push(functionPrompt(fn)));
  }

  if (module.types.length) {
    sections.push("## Types & Interfaces");
    module.types.forEach((t) => sections.push(typePrompt(t)));
  }

  if (module.classes.length) {
    sections.push("## Classes");
    module.classes.forEach((c) => sections.push(classPrompt(c)));
  }

  return sections.join("\n\n");
}

/**
 * Build an index page prompt listing all documented modules.
 */
export function buildIndexPrompt(moduleIds: string[]): string {
  return `Generate an index page for agent API documentation covering these modules:

${moduleIds.map((m) => `- \`${m}\``).join("\n")}

Write a brief intro paragraph, then list each module with a one-line description of its purpose.
The descriptions should be inferred from the module path names.`;
}
