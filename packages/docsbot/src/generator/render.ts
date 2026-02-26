import type { ParsedModule, ParsedFunction, ParsedType, ParsedClass, ParsedConstant } from "../types.ts";

// ---------------------------------------------------------------------------
// Prompt builders — convert parsed metadata into LLM prompts
// ---------------------------------------------------------------------------

function functionPrompt(fn: ParsedFunction): string {
  const params = fn.params
    .map((p) => `  - \`${p.name}${p.optional ? "?" : ""}: ${p.type}\``)
    .join("\n");

  const exportKind = fn.defaultExport
    ? "default export"
    : fn.exported
    ? "named export"
    : "not exported";

  return `
### \`${fn.name}\`

**Kind:** ${fn.kind}${fn.async ? " (async)" : ""}
**Export:** ${exportKind} (import as: ${fn.defaultExport ? `\`import ${fn.name} from '...'\`` : `\`import { ${fn.name} } from '...'\``})
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
  const methodDetails = c.methods.map((m) => functionPrompt(m)).join("\n\n");
  const exportKind = c.exported ? "named export (import as `import { " + c.name + " } from '...'`)" : "not exported";
  return `
### \`${c.name}\` (class)

**Export:** ${exportKind}
${c.description ?? ""}

#### Methods

${methodDetails || "  (none)"}
`.trim();
}

/**
 * Build the full LLM prompt for generating agent docs for a module.
 */
export function buildModulePrompt(module: ParsedModule): string {
  const sections: string[] = [
    `Generate API reference documentation for the module \`${module.moduleId}\`.`,
    `Use ONLY the structured metadata below — do not infer or invent signatures, parameters, or return types.`,
    `Every parameter name, type, and return type MUST exactly match what is listed in the metadata.`,
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

  if (module.constants.length) {
    sections.push("## Exported Constants");
    module.constants.forEach((con) => {
      sections.push(`### \`${con.name}\`\n\n**Type:** \`${con.type}\`${con.description ? `\n\n${con.description}` : ""}`);
    });
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
