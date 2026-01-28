import { writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { aiProfilesData } from "../lib/ai-profiles-seeder";
import type { AIProfileSeed } from "../models/AIProfile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type RoutePrefix = "girl" | "boy" | "companion" | "character";

const groupByRoute = aiProfilesData.reduce<Record<RoutePrefix, AIProfileSeed[]>>(
  (acc, profile) => {
    acc[profile.routePrefix].push(profile);
    return acc;
  },
  {
    girl: [],
    boy: [],
    companion: [],
    character: [],
  }
);

const serialize = (value: unknown, level = 0): string => {
  const indent = (depth: number) => "  ".repeat(depth);

  if (value instanceof Date) {
    return `new Date(${JSON.stringify(value.toISOString())})`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value
      .map((item) => `${indent(level + 1)}${serialize(item, level + 1)},`)
      .join("\n");
    return `[\n${items}\n${indent(level)}]`;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(
        ([key, val]) =>
          `${indent(level + 1)}${key}: ${serialize(val, level + 1)},`
      )
      .join("\n");
    return `{\n${entries}\n${indent(level)}}`;
  }

  if (typeof value === "string") {
    return JSON.stringify(value);
  }

  return String(value);
};

const buildFileContent = (
  variableName: string,
  profiles: AIProfileSeed[]
): string => {
  return `import type { AIProfileSeed } from "@/models/AIProfile";

export const ${variableName}: AIProfileSeed[] = ${serialize(profiles)};
`;
};

const targets: Array<{ route: RoutePrefix; file: string; varName: string }> = [
  { route: "girl", file: "../lib/data/girls.ts", varName: "girlProfiles" },
  { route: "boy", file: "../lib/data/boys.ts", varName: "boyProfiles" },
  {
    route: "companion",
    file: "../lib/data/lgbtq.ts",
    varName: "lgbtqProfiles",
  },
];

targets.forEach(({ route, file, varName }) => {
  const absolutePath = path.join(__dirname, file);
  const content = buildFileContent(varName, groupByRoute[route]);
  writeFileSync(absolutePath, content);
  console.log(`Wrote ${groupByRoute[route].length} profiles to ${file}`);
});


