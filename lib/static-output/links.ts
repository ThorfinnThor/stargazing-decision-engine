import { existsSync, readdirSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

export interface BrokenStaticReference {
  source: string;
  reference: string;
  targetPath: string;
}

export interface StaticOutputValidation {
  htmlFiles: number;
  references: number;
  broken: BrokenStaticReference[];
  localeParityGaps: Array<{ source: string; expected: string }>;
}

function walkFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

function toPublicPath(outputDirectory: string, file: string) {
  const path = relative(outputDirectory, file).split(sep).join("/");
  if (path === "index.html") return "/";
  if (path.endsWith("/index.html")) return `/${path.slice(0, -"index.html".length)}`;
  if (path.endsWith(".html")) return `/${path.slice(0, -".html".length)}`;
  return `/${path}`;
}

function decodeAttribute(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", '"');
}

export function extractStaticReferences(html: string) {
  return [...html.matchAll(/\b(?:href|src)=(?:"([^"]*)"|'([^']*)')/gi)]
    .map((match) => decodeAttribute(match[1] ?? match[2] ?? ""))
    .filter(Boolean);
}

export function resolveExportedTarget(outputDirectory: string, pathname: string) {
  let decoded: string;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  const relativePath = decoded.replace(/^\/+/, "");
  const candidates = decoded.endsWith("/")
    ? [`${relativePath}index.html`]
    : [relativePath, `${relativePath}.html`, `${relativePath}/index.html`];

  for (const candidate of candidates) {
    const absolute = resolve(outputDirectory, candidate);
    const boundary = relative(outputDirectory, absolute);
    if (boundary.startsWith("..") || isAbsolute(boundary)) continue;
    if (existsSync(absolute)) return absolute;
  }
  return null;
}

export function validateStaticOutput(outputDirectory: string, siteOrigin: string): StaticOutputValidation {
  const origin = new URL(siteOrigin).origin;
  const htmlFiles = walkFiles(outputDirectory).filter((file) => file.endsWith(".html"));
  const broken: BrokenStaticReference[] = [];
  let references = 0;

  for (const file of htmlFiles) {
    const source = toPublicPath(outputDirectory, file);
    const base = new URL(source, `${origin}/`);
    for (const reference of extractStaticReferences(readFileSync(file, "utf8"))) {
      let target: URL;
      try {
        target = new URL(reference, base);
      } catch {
        broken.push({ source, reference, targetPath: "invalid-url" });
        continue;
      }
      if (target.origin !== origin || !["http:", "https:"].includes(target.protocol)) continue;
      references += 1;
      if (!resolveExportedTarget(outputDirectory, target.pathname)) {
        broken.push({ source, reference, targetPath: target.pathname });
      }
    }
  }

  const localeParityGaps = htmlFiles.flatMap((file) => {
    const source = toPublicPath(outputDirectory, file);
    if (!source.startsWith("/en/")) return [];
    const expected = source.replace(/^\/en\//, "/de/");
    return resolveExportedTarget(outputDirectory, expected)
      ? []
      : [{ source, expected }];
  });

  return { htmlFiles: htmlFiles.length, references, broken, localeParityGaps };
}
