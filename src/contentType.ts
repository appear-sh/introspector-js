// https://datatracker.ietf.org/doc/html/draft-bhutton-json-schema-00#section-4.2.1
type JSON_TYPES =
  | "null"
  | "undefined"
  | "boolean"
  | "number"
  | "string"
  | "object"
  | "array";

// split based on camelCase, snake_case, kebab-case, ...
const tokenize = (input: string) => {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase => "camel Case"
    .toLowerCase()
    .split(/[-_\s]/) // split on space, underscore, dash
    .filter(Boolean);
};

// order matters, from concrete to abstract
export const CONTENT_TYPES = {
  // BASE undefined
  undefined: {
    tags: ["undefined", "empty"] as const,
    base: "undefined",
    match: (input: unknown) => typeof input === "undefined",
  },
  // BASE null
  null: {
    tags: ["null", "empty"] as const,
    base: "null",
    match: (input: unknown) => input === null,
  },
  // BASE boolean
  boolean: {
    tags: ["boolean"] as const,
    base: "boolean",
    match: (input: unknown) => typeof input === "boolean",
  },
  // BASE number
  float: {
    tags: ["number"] as const,
    base: "number",
    match: (input: unknown) =>
      !isNaN(Number(input)) && !Number.isInteger(Number(input)),
  },
  int: {
    tags: ["number", "url-variable"] as const,
    aliases: ["integer"],
    base: "number",
    match: (input: unknown) =>
      !isNaN(Number(input)) && Number.isInteger(Number(input)),
  },
  number: {
    tags: ["number"] as const,
    base: "number",
    match: (input: unknown) => !isNaN(Number(input)),
  },
  // BASE string
  booleanString: {
    tags: ["boolean"] as const,
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" && ["true", "false"].includes(input),
  },
  uuid: {
    tags: ["id", "url-variable"] as const,
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" &&
      !!input.match(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      ),
  },
  datetime: {
    tags: ["date"] as const,
    aliases: ["date-time"],
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" &&
      !!input.match(
        /^(\d{4})(-(\d{2}))??(-(\d{2}))??(T(\d{2}):(\d{2})(:(\d{2}))??(\.(\d+))??(([\+\-]{1}\d{2}:\d{2})|Z)??)??$/
      ),
    propMatch: (propName: string) => {
      // updated_at, created_at, ...
      const tokens = tokenize(propName);
      return tokens.length >= 2 && tokens.at(-1) === "at";
    },
  },
  date: {
    tags: ["date", "url-variable"] as const,
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" &&
      !!input.match(/^(\d{4})(-(\d{2}))??(-(\d{2}))??$/),
  },
  hex: {
    tags: ["id", "url-variable"] as const,
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" && !!input.match(/^[0-9a-f]{4,}$/i),
  },
  base64: {
    tags: ["id", "url-variable"] as const,
    base: "string",
    match: (input: unknown) => {
      if (typeof input !== "string") return false;
      // https://stackoverflow.com/a/8571649/1795309
      const isBase64 = input.match(
        /^([a-z0-9+/]{4})*([a-z0-9+/]{3}=|[a-z0-9+/]{2}==)?$/i
      );
      if (!isBase64) return false;
      // we consider it base64 if it decodes to ascii
      return !!Buffer.from(input, "base64")
        .toString("utf-8")
        .match(/^[\x00-\x7F]*$/);
    },
  },
  // add phone, ...
  gituri: {
    // needs to be before email because it is technically valid email address
    tags: ["uri"] as const,
    aliases: ["ssh-uri"],
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" &&
      !!input.match(/git@[\w\d-.]+\.\w+:([a-z-]+)+\/?([a-z-]+)*(\.git)?/i),
  },
  uri: {
    tags: ["uri"] as const,
    aliases: ["url", "uri-template"],
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" &&
      !!input.match(/^(?:[a-z]+:)?\/\/[^\s/$.?#].[^\s]*$/i),
    propMatch: (propName: string) => {
      // great_url
      const tokens = tokenize(propName);
      return tokens.at(-1) === "url" || tokens.at(-1) === "uri";
    },
  },
  email: {
    tags: ["email"] as const,
    base: "string",
    // https://regexr.com/2rhq7
    match: (input: unknown) =>
      typeof input === "string" &&
      !!input.match(
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
      ),
    propMatch: (propName: string) => {
      // if last word === email, return true
      return tokenize(propName).at(-1) === "email";
    },
  },
  word: {
    tags: ["string"] as const,
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" && input.trim().split(" ").length === 1,
  },
  sentence: {
    tags: ["string"] as const,
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" &&
      input.includes(".") &&
      input
        .split(".")
        .map((x) => x.trim())
        .filter(Boolean).length === 1,
  },
  paragraph: {
    tags: ["string"] as const,
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" &&
      input.includes(".") &&
      input
        .split(".")
        .map((x) => x.trim())
        .filter(Boolean).length < 7,
  },
  text: {
    tags: ["string"] as const,
    base: "string",
    match: (input: unknown) =>
      typeof input === "string" && input.trim().length > 20,
  },
  string: {
    tags: ["string"] as const,
    base: "string",
    match: (input: unknown) => typeof input === "string",
  },
  // id is a specific content type that can never match directly, only through propMatch as upgrade from string
  // it shows just as an id, but example is uuid as it's common value
  id: {
    tags: ["id", "string"] as const,
    base: "string",
    match: (input: unknown) => false,
    propMatch: (propName: string) => {
      return tokenize(propName).at(-1) === "id";
    },
  },
} satisfies Record<
  string,
  {
    tags: string[]; // to be used for identifying various categories - eg "id" in place as consts
    aliases?: string[]; // known aliases of the type when we map from imports and other sources
    base: JSON_TYPES;
    match: (input: unknown) => boolean;
    propMatch?: (propName: string) => boolean;
  }
>;

export const getType = (typeName: string) => {
  const name = typeName.toLowerCase();
  if (name in CONTENT_TYPES) {
    return {
      type: name as keyof typeof CONTENT_TYPES,
      ...CONTENT_TYPES[name as keyof typeof CONTENT_TYPES],
    };
  }
  const match = Object.entries(CONTENT_TYPES).find(([type, details]) => {
    return "aliases" in details && details.aliases?.includes(name);
  });

  if (match) {
    return { type: match[0] as keyof typeof CONTENT_TYPES, ...match[1] };
  }

  return undefined;
};

export const identifyTypeFromPropName = (
  base: JSON_TYPES,
  propName?: string
) => {
  if (!propName) return undefined;

  // optional detection from prop name
  // so for example if we have `something_url` and detected type is string, we can upgrade it to uri
  // or `updated_at` as string can be upgraded to datetime
  const propMatch = Object.entries(CONTENT_TYPES).find(
    ([type, details]) =>
      "propMatch" in details &&
      details.base === base &&
      details.propMatch(propName)
  );
  if (!propMatch) return undefined;

  return {
    type: propMatch[0] as keyof typeof CONTENT_TYPES,
    ...propMatch[1],
  };
};

export const identifyType = (input: unknown, propName?: string) => {
  const match = Object.entries(CONTENT_TYPES).find(([type, details]) =>
    details.match(input)
  );
  if (!match) return undefined;
  // if it's base type try also prop matchers to make it more specific
  if (propName && match[0] === match[1].base) {
    const propMatch = identifyTypeFromPropName(match[1].base, propName);
    if (propMatch) return propMatch;
  }
  return { type: match[0] as keyof typeof CONTENT_TYPES, ...match[1] };
};
