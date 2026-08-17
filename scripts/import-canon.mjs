import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SOURCES = [
  ["atlas-001", "Atlas_Creed_001_The_Creator.docx", "The Creator"],
  ["atlas-002", "Atlas_Creed_002_The_Covenant.docx", "The Covenant"],
  ["atlas-003", "Atlas_Creed_003_The_Heart.docx", "The Heart"],
  ["atlas-004", "Atlas_Creed_004_The_Mind.docx", "The Mind"],
  [
    "atlas-005",
    "Atlas_005_Intelligence_Architecture.docx",
    "The Intelligence Architecture",
  ],
  [
    "atlas-006",
    "Atlas_006_Voice_Presence_Adaptive_Persona.docx",
    "Voice, Presence & Adaptive Persona",
  ],
  [
    "atlas-007",
    "Atlas_007_Thinking_Learning_Wisdom_Architecture.docx",
    "Thinking, Learning & Wisdom Architecture",
  ],
  [
    "atlas-008",
    "Atlas_008_Expertise_Codex_Mastery_Architecture.docx",
    "Expertise Codex & Mastery Architecture",
  ],
  [
    "atlas-009",
    "Atlas_009_Atlas_Architect_Autonomous_Software_Engineering.docx",
    "Atlas Architect & Autonomous Software Engineering",
  ],
  [
    "atlas-010",
    "Atlas_010_Judgment_Authority_Decision_Architecture.docx",
    "Judgment, Authority & Decision Architecture",
  ],
  [
    "atlas-011",
    "Atlas_011_Master_Constitution_Core_Operating_System.docx",
    "The Master Constitution & Core Operating System",
  ],
];

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : (process.argv[index + 1] ?? null);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeXml(value) {
  return value
    .replaceAll(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replaceAll(/&#([0-9]+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function paragraphsOf(sourcePath) {
  const xml = execFileSync("unzip", ["-p", sourcePath, "word/document.xml"], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  const paragraphs = [];
  for (const paragraph of xml.matchAll(/<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g)) {
    const inner = paragraph[1] ?? "";
    let text = "";
    for (const token of inner.matchAll(
      /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\b[^>]*\/?\s*>|<w:(?:br|cr)\b[^>]*\/?\s*>/g,
    )) {
      if (token[1] !== undefined) text += decodeXml(token[1]);
      else if (token[0].startsWith("<w:tab")) text += "\t";
      else text += "\n";
    }
    const normalized = text
      .replaceAll("\u00a0", " ")
      .replaceAll(/[ \t]+/g, " ")
      .replaceAll(/ *\n */g, "\n")
      .trim();
    if (normalized) {
      paragraphs.push({
        text: normalized,
        style: inner.match(/<w:pStyle\s+w:val="([^"]+)"\s*\/>/)?.[1] ?? null,
      });
    }
  }
  return paragraphs;
}

function statedMetadata(paragraphs) {
  const values = paragraphs.map((paragraph) => paragraph.text);
  const valueAfter = (label) => {
    const index = values.findIndex(
      (paragraph) => paragraph.toLowerCase() === label.toLowerCase(),
    );
    return index === -1 ? null : (values[index + 1] ?? null);
  };
  const versionLine = values.find((paragraph) =>
    /VERSION\s+\d/i.test(paragraph),
  );
  const version =
    valueAfter("Version") ??
    versionLine?.match(/VERSION\s+([\d.]+)/i)?.[1] ??
    null;
  const ratified =
    valueAfter("Ratified") ??
    versionLine?.match(/RATIFIED\s+(.+)$/i)?.[1] ??
    null;
  const effectiveDate = ratified ? new Date(`${ratified} UTC`) : null;
  return {
    authority: valueAfter("Authority"),
    classification: valueAfter("Classification"),
    effectiveDate:
      effectiveDate && !Number.isNaN(effectiveDate.valueOf())
        ? effectiveDate.toISOString().slice(0, 10)
        : null,
    version,
  };
}

function sectionsOf(documentId, paragraphs) {
  const documentNumber = Number(documentId.slice(-3));
  const numbered = documentNumber >= 5;
  if (numbered) {
    const sections = [];
    let current = null;
    let expectedOrdinal = 1;
    for (const entry of paragraphs) {
      const paragraph = entry.text;
      const heading = paragraph.match(/^(\d+)\.\s+(.+)$/);
      const ordinal = heading ? Number(heading[1]) : null;
      if (
        heading &&
        ordinal === expectedOrdinal &&
        entry.style === "Heading1"
      ) {
        if (current) sections.push(current);
        current = {
          id: `${documentId}-s${heading[1].padStart(2, "0")}`,
          ordinal,
          title: heading[2],
          text: "",
        };
        expectedOrdinal += 1;
      } else if (current) {
        current.text += `${current.text ? "\n\n" : ""}${paragraph}`;
      }
    }
    if (current) sections.push(current);
    return sections;
  }

  const coreIndex = paragraphs.findIndex(
    (paragraph) => paragraph.text.toUpperCase() === "CORE PREMISE",
  );
  const coreText =
    coreIndex === -1 ? "" : (paragraphs[coreIndex + 1]?.text ?? "");
  const content = paragraphs.slice(coreIndex === -1 ? 0 : coreIndex + 2);
  const sections = coreText
    ? [
        {
          id: `${documentId}-s00`,
          ordinal: 0,
          title: "Core Premise",
          text: coreText,
        },
      ]
    : [];
  let current = null;
  for (let index = 0; index < content.length; index += 1) {
    const paragraph = content[index]?.text;
    if (!paragraph || /^[━─—_=-]{5,}$/.test(paragraph)) continue;
    const nextIsDivider = /^[━─—_=-]{5,}$/.test(content[index + 1]?.text ?? "");
    if (nextIsDivider) {
      if (current) sections.push(current);
      const ordinal = sections.length;
      current = {
        id: `${documentId}-s${String(ordinal).padStart(2, "0")}`,
        ordinal,
        title: paragraph,
        text: "",
      };
    } else if (current) {
      current.text += `${current.text ? "\n\n" : ""}${paragraph}`;
    }
  }
  if (current) sections.push(current);
  return sections;
}

const sourceDirectory = argument("--source-dir");
const outputPath = argument("--out") ?? "data/canon/registry.json";
if (!sourceDirectory) {
  throw new Error(
    "Usage: node scripts/import-canon.mjs --source-dir <private-docx-directory> [--out <registry.json>]",
  );
}

const documents = SOURCES.map(([id, filename, title]) => {
  const sourcePath = path.join(sourceDirectory, filename);
  const source = readFileSync(sourcePath);
  const paragraphs = paragraphsOf(sourcePath);
  const metadata = statedMetadata(paragraphs);
  const sections = sectionsOf(id, paragraphs).map((section) => ({
    ...section,
    checksum: sha256(`${section.title}\n${section.text}`),
  }));
  if (sections.length === 0) {
    throw new Error(`${filename} did not produce any canonical sections`);
  }
  const normalizedText = sections
    .map((section) => `${section.title}\n${section.text}`)
    .join("\n\n");
  return {
    id,
    title,
    version: metadata.version,
    status: "active",
    effectiveDate: metadata.effectiveDate,
    authority: metadata.authority ?? "Founder-approved foundational canon",
    source: "private_original_docx",
    sourceReference: filename,
    sourceChecksum: sha256(source),
    normalizedChecksum: sha256(normalizedText),
    sensitivity: "PRIVATE",
    provenance:
      "Source DOCX supplied by Neil Stutes; normalized deterministically without retaining the binary in the repository.",
    ingestedAt: "2026-08-17T00:00:00.000Z",
    supersedes: [],
    supersededBy: null,
    amendments: [],
    statedClassification: metadata.classification,
    sections,
  };
});

const registry = {
  schemaVersion: 1,
  registryId: "atlas-foundational-canon",
  documents,
};
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(registry, null, 2)}\n`);
process.stdout.write(
  `Imported ${documents.length} documents and ${documents.reduce((sum, document) => sum + document.sections.length, 0)} sections to ${outputPath}.\n`,
);
