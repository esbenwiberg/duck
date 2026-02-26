import ts from "typescript";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { relative } from "path";
import type {
  ParsedModule,
  ParsedFunction,
  ParsedType,
  ParsedClass,
  ParsedParam,
} from "../types.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function typeToString(checker: ts.TypeChecker, node: ts.Node): string {
  const type = checker.getTypeAtLocation(node);
  return checker.typeToString(type);
}

function getJsDoc(node: ts.Node): { description?: string; examples?: string[] } {
  const tags = ts.getJSDocTags(node);
  const comments = ts.getJSDocCommentsAndTags(node);

  let description: string | undefined;
  const examples: string[] = [];

  for (const c of comments) {
    if (ts.isJSDoc(c) && c.comment) {
      description = typeof c.comment === "string" ? c.comment : c.comment.map((p) => (typeof p === "string" ? p : p.text)).join("");
    }
  }

  for (const tag of tags) {
    if (tag.tagName.text === "example" && tag.comment) {
      const text = typeof tag.comment === "string" ? tag.comment : tag.comment.map((p) => (typeof p === "string" ? p : p.text)).join("");
      examples.push(text.trim());
    }
  }

  return { description, examples: examples.length ? examples : undefined };
}

function parseParams(
  checker: ts.TypeChecker,
  params: ts.NodeArray<ts.ParameterDeclaration>
): ParsedParam[] {
  return params.map((p) => ({
    name: p.name.getText(),
    type: p.type ? p.type.getText() : typeToString(checker, p),
    optional: !!p.questionToken || !!p.initializer,
  }));
}

function parseFunction(
  checker: ts.TypeChecker,
  node: ts.FunctionDeclaration | ts.MethodDeclaration | ts.ArrowFunction,
  nameOverride?: string
): ParsedFunction | null {
  const name =
    nameOverride ??
    (node.name ? node.name.getText() : undefined);
  if (!name) return null;

  const { description, examples } = getJsDoc(node);
  const isExported =
    ts.isFunctionDeclaration(node) &&
    node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

  const kind = ts.isFunctionDeclaration(node)
    ? "function"
    : ts.isMethodDeclaration(node)
    ? "method"
    : "arrow";

  const src = node.getSourceFile();
  const start = src.getLineAndCharacterOfPosition(node.getStart());
  const end = src.getLineAndCharacterOfPosition(node.getEnd());

  const sig = checker.getSignatureFromDeclaration(node);
  const returnType = sig
    ? checker.typeToString(checker.getReturnTypeOfSignature(sig))
    : "unknown";

  return {
    kind,
    name,
    exported: !!isExported,
    async: !!node.modifiers?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword),
    params: parseParams(checker, node.parameters),
    returnType,
    description,
    examples,
    lineStart: start.line + 1,
    lineEnd: end.line + 1,
  };
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export function parseFile(filePath: string, rootDir: string): ParsedModule {
  const content = readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.ESNext,
    true
  );

  // We need a full program for type information
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    jsx: ts.JsxEmit.ReactJSX,
  });
  const checker = program.getTypeChecker();
  const src = program.getSourceFile(filePath)!;

  const functions: ParsedFunction[] = [];
  const types: ParsedType[] = [];
  const classes: ParsedClass[] = [];

  function visit(node: ts.Node) {
    // Function declarations
    if (ts.isFunctionDeclaration(node) && node.name) {
      const fn = parseFunction(checker, node);
      if (fn) functions.push(fn);
    }

    // Variable declarations that are arrow functions
    if (ts.isVariableStatement(node)) {
      const exported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      for (const decl of node.declarationList.declarations) {
        if (
          decl.initializer &&
          ts.isArrowFunction(decl.initializer) &&
          ts.isIdentifier(decl.name)
        ) {
          const fn = parseFunction(checker, decl.initializer, decl.name.getText());
          if (fn) functions.push({ ...fn, exported: !!exported });
        }
      }
    }

    // Interface declarations
    if (ts.isInterfaceDeclaration(node)) {
      const exported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      const { description } = getJsDoc(node);
      const members: ParsedParam[] = node.members
        .filter(ts.isPropertySignature)
        .map((m) => ({
          name: m.name.getText(),
          type: m.type?.getText() ?? "unknown",
          optional: !!m.questionToken,
          description: getJsDoc(m).description,
        }));
      types.push({
        kind: "interface",
        name: node.name.getText(),
        exported: !!exported,
        description,
        members,
      });
    }

    // Type alias declarations
    if (ts.isTypeAliasDeclaration(node)) {
      const exported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      const { description } = getJsDoc(node);
      types.push({
        kind: "type",
        name: node.name.getText(),
        exported: !!exported,
        description,
        members: [],
      });
    }

    // Class declarations
    if (ts.isClassDeclaration(node) && node.name) {
      const exported = node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      const { description } = getJsDoc(node);
      const methods: ParsedFunction[] = [];
      for (const member of node.members) {
        if (ts.isMethodDeclaration(member)) {
          const fn = parseFunction(checker, member);
          if (fn) methods.push(fn);
        }
      }
      classes.push({
        kind: "class",
        name: node.name.getText(),
        exported: !!exported,
        description,
        methods,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(src);

  return {
    filePath,
    moduleId: relative(rootDir, filePath),
    functions,
    types,
    classes,
    contentHash: hash(content),
  };
}

/**
 * Parse all TypeScript files matching the given paths.
 * @param filePaths Absolute paths to .ts/.tsx files
 * @param rootDir Root directory for computing relative module IDs
 */
export function parseFiles(filePaths: string[], rootDir: string): ParsedModule[] {
  return filePaths.map((f) => parseFile(f, rootDir));
}
