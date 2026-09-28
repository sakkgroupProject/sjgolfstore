export type VariantOptionDefinition = { name: string; values: string[] };

export function normalizeOptionValues(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseOptionMap(value: unknown): Record<string, string> {
  let candidate = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return {};
    }
  }
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return {};

  return Object.fromEntries(
    Object.entries(candidate).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function normalizedWords(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function inferOptionValue(title: string, values: string[]): string | undefined {
  const normalizedTitle = ` ${normalizedWords(title)} `;
  const matches = values
    .map((value) => ({ value, words: normalizedWords(value) }))
    .filter(({ words }) => words && normalizedTitle.includes(` ${words} `));
  if (!matches.length) return undefined;

  const longestMatch = Math.max(...matches.map(({ words }) => words.length));
  const bestMatches = matches.filter(({ words }) => words.length === longestMatch);
  return bestMatches.length === 1 ? bestMatches[0].value : undefined;
}

export function normalizeVariantOptions(
  value: unknown,
  title: string,
  definitions: VariantOptionDefinition[],
): Record<string, string> {
  const stored = parseOptionMap(value);
  const normalized: Record<string, string> = {};

  for (const definition of definitions) {
    const key = Object.keys(stored).find((candidate) => candidate.toLowerCase() === definition.name.toLowerCase());
    const storedValue = key ? stored[key] : undefined;
    const matchedValue = storedValue && definition.values.includes(storedValue)
      ? storedValue
      : inferOptionValue(title, definition.values);
    if (matchedValue) normalized[definition.name] = matchedValue;
  }

  return normalized;
}