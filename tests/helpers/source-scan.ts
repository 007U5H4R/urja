/**
 * Static scans shared by the wording guard (TC-014) and the no-₹-literal
 * check (TC-021): list shipped source files and pull out every string a file
 * can put on screen, using the TypeScript parser (comments are not strings).
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

/** Source files under `dir` with one of `exts`, skipping tests and node_modules. */
export function sourceFiles(dir: string, exts: readonly string[]): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "node_modules" ? [] : sourceFiles(p, exts);
    if (/\.test\.(ts|tsx)$/.test(name)) return [];
    return exts.some((e) => name.endsWith(e)) ? [p] : [];
  });
}

export interface SourceString {
  /** The value at run time (escapes resolved). */
  text: string;
  /** The characters as written in the file (escapes and HTML entities intact). */
  raw: string;
}

function parse(path: string, text: string): ts.SourceFile {
  const kind = path.endsWith(".tsx") ? ts.ScriptKind.TSX : path.endsWith(".js") || path.endsWith(".mjs") ? ts.ScriptKind.JS : ts.ScriptKind.TS;
  return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, kind);
}

/** Every string literal, template chunk and JSX text in a TS/TSX/JS file, or every key and string in a JSON file. */
export function stringsIn(path: string, text: string): SourceString[] {
  if (path.endsWith(".json")) {
    const out: SourceString[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === "string") out.push({ text: v, raw: v });
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object")
        for (const [k, x] of Object.entries(v)) {
          out.push({ text: k, raw: k });
          walk(x);
        }
    };
    walk(JSON.parse(text));
    return out;
  }
  const src = parse(path, text);
  const out: SourceString[] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateMiddle(node) ||
      ts.isTemplateTail(node) ||
      ts.isJsxText(node)
    ) {
      out.push({ text: node.text, raw: node.getText(src) });
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
  return out;
}

/** JSX attributes named `inr` or `…Inr` given a number literal, e.g. `inr={186400}` or `totalInr={-5}`. */
export function literalMoneyProps(path: string, text: string): string[] {
  const src = parse(path, text);
  const out: string[] = [];
  const isNumber = (e: ts.Expression): boolean =>
    ts.isNumericLiteral(e) ||
    (ts.isPrefixUnaryExpression(e) && ts.isNumericLiteral(e.operand)) ||
    (ts.isParenthesizedExpression(e) && isNumber(e.expression));
  const visit = (node: ts.Node): void => {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(src);
      const init = node.initializer;
      if ((name === "inr" || name.endsWith("Inr")) && init && ts.isJsxExpression(init) && init.expression && isNumber(init.expression)) {
        out.push(node.getText(src));
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(src);
  return out;
}
