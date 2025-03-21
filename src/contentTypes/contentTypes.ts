import {
  AnySchemaType,
  ArraySchemaType,
  BooleanSchemaType,
  IntegerSchemaType,
  NullSchemaType,
  NumberSchemaType,
  ObjectSchemaType,
  SchemaOf,
  SomeSchemaType,
  StringSchemaType,
} from "./jsonSchema.types.js"
import isEqual from "lodash/isEqual.js"
import { isNonNullable } from "../helpers.js"
import { KNOWN_EXTENSIONS } from "./extensions.js"

// order matters, from concrete to abstract
export const CONTENT_TYPES = {
  // BASE null
  null: {
    tags: ["empty", "in:body"] as const,
    type: "null",
    schemaFromValue: (value) => {
      if (value === null) return { type: "null" }
      return false
    },
    matchSchema: (schema): schema is NullSchemaType => schema.type === "null",
  },
  // BASE boolean
  boolean: {
    tags: ["in:body"] as const,
    type: "boolean",
    schemaFromValue: (value) => {
      if (typeof value === "boolean") return { type: "boolean" }
      return false
    },
    matchSchema: (schema): schema is BooleanSchemaType =>
      schema.type === "boolean",
  },
  // BASE number
  float: {
    tags: ["in:body", "in:query", "in:header"] as const,
    type: "number",
    schemaFromValue: (value) => {
      if (
        typeof value !== "number" ||
        isNaN(value) ||
        Number.isInteger(value)
      ) {
        return false
      }

      const asString = (value as number).toString()
      const numOfDecimalPlaces =
        asString.split(".")[1]?.length ?? // if it contains dot, take the length of decimal part
        (Number(asString.split("-")[1]) || 0) // if it's small number like 1e-9 take the exponent. If neither it's 0

      const precision =
        10 ** (Math.floor(value as number).toString().length - 1)

      return {
        type: "number",
        minimum: Math.floor((value as number) / precision) * precision,
        maximum: Math.ceil((value as number) / precision) * precision,
        multipleOf: 10 ** -numOfDecimalPlaces,
      }
    },
    matchSchema: (
      schema,
    ): schema is NumberSchemaType & { multipleOf: number } =>
      !!(
        schema.type === "number" &&
        schema.multipleOf &&
        schema.multipleOf < 1
      ),
    merge: (...schemas): NumberSchemaType => {
      const hasMin = schemas.every((schema) => schema.minimum !== undefined)
      const hasMax = schemas.every((schema) => schema.maximum !== undefined)
      return {
        type: "number",
        minimum: hasMin
          ? Math.min(...schemas.map((s) => s.minimum!))
          : undefined,
        maximum: hasMax
          ? Math.max(...schemas.map((s) => s.maximum!))
          : undefined,
        multipleOf: Math.min(
          ...schemas.map((s) => s.multipleOf).filter(isNonNullable),
        ),
      }
    },
  },
  integer: {
    tags: ["number", "in:url", "in:body", "in:query", "in:header"] as const,
    aliases: ["int"],
    type: "integer",
    schemaFromValue: (value) => {
      if (typeof value !== "number" || !Number.isInteger(value)) return false
      const precision =
        10 ** (Math.floor(value as number).toString().length - 1)

      return {
        type: "integer",
        minimum: Math.floor((value as number) / precision) * precision,
        maximum: Math.ceil((value as number) / precision) * precision,
      }
    },
    matchSchema: (schema): schema is IntegerSchemaType =>
      schema.type === "integer",
    merge: (...schemas) => {
      const hasMin = schemas.every((schema) => schema.minimum !== undefined)
      const hasMax = schemas.every((schema) => schema.maximum !== undefined)
      return {
        type: "integer",
        minimum: hasMin
          ? Math.min(...schemas.map((s) => s.minimum!))
          : undefined,
        maximum: hasMax
          ? Math.max(...schemas.map((s) => s.maximum!))
          : undefined,
      }
    },
  },
  number: {
    tags: ["in:body", "in:query", "in:header"] as const,
    type: "number",
    schemaFromValue: (value): NumberSchemaType | false => {
      // in normal detection this function can't be called because either it's integer or float that are parsed first
      // but if it's called somewhere directly we'll reuse the previous logic and force type number
      const base =
        CONTENT_TYPES.integer.schemaFromValue(value) ||
        CONTENT_TYPES.float.schemaFromValue(value)
      if (!base) return false

      return {
        ...base,
        type: "number",
      }
    },
    matchSchema: (schema): schema is NumberSchemaType =>
      schema.type === "number" || schema.type === "integer",
    merge: (...schemas): NumberSchemaType => {
      const hasMin = schemas.every((schema) => schema.minimum !== undefined)
      const hasMax = schemas.every((schema) => schema.maximum !== undefined)
      const hasMultipleOf = schemas.every(
        (schema) => schema.multipleOf !== undefined,
      )

      return {
        type: "number",
        minimum: hasMin
          ? Math.min(...schemas.map((s) => s.minimum!))
          : undefined,
        maximum: hasMax
          ? Math.max(...schemas.map((s) => s.maximum!))
          : undefined,
        multipleOf: hasMultipleOf
          ? Math.min(...schemas.map((s) => s.multipleOf!))
          : undefined,
      }
    },
  },
  // BASE string
  booleanString: {
    tags: ["in:body", "in:query", "in:header"] as const,
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      if (!["true", "false"].includes(value)) return false
      return {
        type: "string",
        format: "boolean",
        enum: ["true", "false"],
      }
    },
    matchSchema: (schema): schema is StringSchemaType & { format: "boolean" } =>
      schema.type === "string" && schema.format === "boolean",
  },
  uuid: {
    tags: ["in:body", "in:url", "in:query", "in:header"] as const,
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      const REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!value.match(REGEX)) return false

      return { type: "string", format: "uuid" }
    },
    matchSchema: (schema): schema is StringSchemaType & { format: "uuid" } =>
      schema.type === "string" && schema.format === "uuid",
  },
  date: {
    tags: ["in:body", "in:url", "in:query", "in:header"] as const,
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      const REGEX = /^(\d{4})(-(\d{2}))??(-(\d{2}))??$/
      if (!value.match(REGEX)) return false
      return { type: "string", format: "date" }
    },
    matchSchema: (schema): schema is StringSchemaType & { format: "date" } =>
      schema.type === "string" && schema.format === "date",
  },
  datetime: {
    tags: ["in:body", "in:query", "in:header"] as const,
    aliases: ["date-time"],
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      const REGEX =
        /^(\d{4})(-(\d{2}))??(-(\d{2}))??(T(\d{2}):(\d{2})(:(\d{2}))??(\.(\d+))??(([\+\-]{1}\d{2}:\d{2})|Z)??)??$/
      if (!value.match(REGEX)) return false
      return { type: "string", format: "date-time" }
    },
    matchSchema: (
      schema,
    ): schema is StringSchemaType & { format: "date-time" } =>
      schema.type === "string" && schema.format === "date-time",
  },
  utcDateTimeString: {
    tags: ["in:body", "in:query", "in:header"] as const,
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      const REGEX =
        /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s([0-3]\d)\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s([0-3]\d\d\d)\s([0-2]\d):([0-5]\d):([0-5]\d)\sGMT$/
      if (!value.match(REGEX)) return false
      return {
        type: "string",
        format: "utc-date-time",
      }
    },
    matchSchema: (
      schema,
    ): schema is StringSchemaType & { format: "utc-date-time" } =>
      schema.type === "string" && schema.format === "utc-date-time",
  },
  hex: {
    tags: ["in:body", "in:url"] as const,
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      const REGEX = /^[0-9a-f]{4,}$/i
      if (!value.match(REGEX)) return false
      return {
        type: "string",
        format: "hex",
      }
    },
    matchSchema: (schema): schema is StringSchemaType & { format: "hex" } =>
      schema.type === "string" && schema.format === "hex",
  },
  base64: {
    tags: ["in:body", "in:url"] as const,
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      // https://stackoverflow.com/a/8571649/1795309
      const REGEX = /^([a-z0-9+/]{4})*([a-z0-9+/]{3}=|[a-z0-9+/]{2}==)?$/i
      if (!value.match(REGEX)) return false

      // we consider it base64 if it decodes to ascii
      const decodesToAscii = !!Buffer.from(value, "base64")
        .toString("utf-8")
        .match(/^[\x00-\x7F]*$/)
      if (!decodesToAscii) return false

      return {
        type: "string",
        format: "base64",
      }
    },
    matchSchema: (schema): schema is StringSchemaType & { format: "base64" } =>
      schema.type === "string" && schema.format === "base64",
  },
  // add phone, ...
  gituri: {
    // needs to be before email because it is technically valid email address
    tags: ["in:body"] as const,
    aliases: ["ssh-uri"],
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      const REGEX = /git@[\w\d-.]+\.\w+:([a-z-]+)+\/?([a-z-]+)*(\.git)?/i
      if (!value.match(REGEX)) return false
      return {
        type: "string",
        format: "git-uri",
      }
    },
    matchSchema: (schema): schema is StringSchemaType & { format: "git-uri" } =>
      schema.type === "string" && schema.format === "git-uri",
  },
  // todo add uri-reference for relative paths https://json-schema.org/understanding-json-schema/reference/string#resource-identifiers
  // todo uri should be absolute
  uri: {
    tags: ["in:body"] as const,
    aliases: ["url", "uri-template"],
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      const REGEX = /^(?:[a-z]+:)?\/\/[^\s/$.?#].[^\s]*$/i
      if (!value.match(REGEX)) return false
      return { type: "string", format: "uri" }
    },
    matchSchema: (schema): schema is StringSchemaType & { format: "uri" } =>
      schema.type === "string" && schema.format === "uri",
  },
  email: {
    tags: ["in:body"] as const,
    type: "string",
    // https://regexr.com/2rhq7
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      const REGEX =
        /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i
      if (!value.match(REGEX)) return false
      return { type: "string", format: "email" }
    },
    matchSchema: (schema): schema is StringSchemaType & { format: "email" } =>
      schema.type === "string" && schema.format === "email",
  },
  filename: {
    tags: ["in:body"] as const,
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      if (!value.includes(".")) return false
      // checking if extension is known mime type
      const extension = value.split(".").at(-1)!.toLowerCase()
      if (!KNOWN_EXTENSIONS.includes(extension)) return false
      return { type: "string", format: "filename" }
    },
    matchSchema: (
      schema,
    ): schema is StringSchemaType & { format: "filename" } =>
      schema.type === "string" && schema.format === "filename",
  },
  string: {
    tags: ["in:body", "in:query", "in:header"] as const,
    type: "string",
    schemaFromValue: (value) => {
      if (typeof value !== "string") return false
      return {
        type: "string",
        minLength: value.length,
        maxLength: value.length,
      }
    },
    matchSchema: (schema): schema is StringSchemaType =>
      schema.type === "string",
    merge: (...schemas) => {
      // sometimes we may be merging strings without length (eg email). In that case don't include it
      const hasMin = schemas.every((schema) => schema.minLength !== undefined)
      const hasMax = schemas.every((schema) => schema.maxLength !== undefined)

      return {
        type: "string",
        minLength: hasMin
          ? Math.min(...schemas.map((s) => s.minLength!))
          : undefined,
        maxLength: hasMax
          ? Math.max(...schemas.map((s) => s.maxLength!))
          : undefined,
      }
    },
  },
  // BASE array
  array: {
    type: "array",
    tags: ["in:body"] as const,
    schemaFromValue: (value) => {
      if (!Array.isArray(value)) return false

      const schemas = value
        .map((item) => schemaFromValue(item))
        .filter(isNonNullable)

      if (schemas.length === 0) {
        return { type: "array", minItems: value.length, maxItems: value.length }
      }

      const merged = mergeSchemas(...schemas)

      return {
        type: "array",
        items: merged.length === 1 ? merged[0]! : { anyOf: merged },
        minItems: value.length,
        maxItems: value.length,
      }
    },
    matchSchema: (schema): schema is ArraySchemaType => schema.type === "array",
    merge: (...schemas) => {
      const hasMin = schemas.every((schema) => schema.minItems !== undefined)
      const hasMax = schemas.every((schema) => schema.maxItems !== undefined)

      const items = schemas
        .flatMap((schema) =>
          schema.items && "anyOf" in schema.items
            ? schema.items.anyOf
            : [schema.items],
        )
        .filter(isNonNullable)
      const merged = mergeSchemas(...items)

      return {
        type: "array",
        items:
          merged.length === 0
            ? undefined
            : merged.length === 1
              ? merged[0]!
              : { anyOf: merged },
        minItems: hasMin
          ? Math.min(...schemas.map((s) => s.minItems!))
          : undefined,
        maxItems: hasMax
          ? Math.max(...schemas.map((s) => s.maxItems!))
          : undefined,
      }
    },
  },
  // BASE object
  object: {
    type: "object",
    tags: ["in:body"] as const,
    schemaFromValue: (value) => {
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false
      }

      const entries = Object.entries(value)
        .map(([key, value]) => {
          const schema = schemaFromValue(value)
          return schema ? ([key, schema] as const) : undefined
        })
        .filter(isNonNullable)

      const properties = Object.fromEntries(entries)

      return {
        type: "object",
        properties,
        required: Object.keys(properties),
      }
    },
    matchSchema: (schema): schema is ObjectSchemaType =>
      schema.type === "object",
    merge: (...schemas) => {
      const allPropNames = schemas
        .flatMap((schema) => Object.keys(schema.properties ?? {}))
        .filter((value, index, array) => array.indexOf(value) === index)

      const propEntries = allPropNames.map((name) => {
        const propSchemas = schemas
          .map((s) => s.properties?.[name])
          .filter(isNonNullable)
        const merged = mergeSchemas(...propSchemas)
        return [
          name,
          merged.length === 1 ? merged[0]! : { anyOf: merged },
        ] as const
      })
      const properties = Object.fromEntries(propEntries)

      const required = allPropNames.filter((name) =>
        schemas.every((s) => s.required?.includes(name)),
      )

      return {
        type: "object",
        properties,
        required,
      }
    },
  },
} satisfies Record<
  string,
  {
    [Type in SomeSchemaType["type"]]: {
      tags: string[]
      aliases?: string[]
      type: Type
      matchSchema: (schema: SchemaOf<Type>) => schema is SchemaOf<Type>
      schemaFromValue: (value: unknown) => SchemaOf<Type> | false
      merge?: (...schemas: SchemaOf<Type>[]) => SchemaOf<Type>
    }
  }[SomeSchemaType["type"]]
>

export const getType = (typeName: string) => {
  const name = typeName.toLowerCase()
  if (name in CONTENT_TYPES) {
    return CONTENT_TYPES[name as keyof typeof CONTENT_TYPES]
  }
  const match = Object.entries(CONTENT_TYPES).find(([type, details]) => {
    return "aliases" in details && details.aliases?.includes(name)
  })
  return match?.[1]
}

export const schemaFromValue = (
  input: unknown,
  tag?: string,
): SomeSchemaType | undefined => {
  const possibleTypes = Object.entries(CONTENT_TYPES).filter(
    ([, details]) =>
      tag === undefined || (details.tags as string[]).includes(tag),
  )
  for (const type of possibleTypes) {
    const schema = type[1].schemaFromValue(input)
    if (schema) return schema
  }
  return undefined
}

export const mergeSchemas = (
  ...schemas: (AnySchemaType | SomeSchemaType)[]
): SomeSchemaType[] => {
  // for each schema create a list of possible types using matchSchema
  // that usuall will mean something like (email | string)
  const typeEntries = Object.entries(CONTENT_TYPES)
  const schemasWithTypes = schemas
    .flatMap((schema) =>
      ("anyOf" in schema ? schema.anyOf : [schema])?.map((s) => ({
        schema: schema as SomeSchemaType,
        types: typeEntries.filter(
          // todo findout why type.matchSchema(never)
          // @ts-ignore
          ([, type]) => type.matchSchema(s),
        ),
      })),
    )
    .filter(isNonNullable)

  // create a map of type and their counts, and then take the one with highest count
  // while perserving the order in case of tie
  const typeCounts = schemasWithTypes.reduce(
    (acc, { types }) => {
      for (const [typeName, type] of types) {
        acc[typeName] = (acc[typeName] ?? 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const priority = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)

  // for each type ordered by priority merge the schemas
  const mergedSchemas: Record<string, SomeSchemaType> = {}

  for (const { schema, types } of schemasWithTypes) {
    const typeName = priority.find((name) =>
      types.find(([typeName]) => typeName === name),
    )
    if (!typeName) continue

    const type = getType(typeName)
    const mergeFn =
      type && "merge" in type
        ? (type.merge as (...schemas: SomeSchemaType[]) => SomeSchemaType)
        : (schema: SomeSchemaType) => schema

    mergedSchemas[typeName] = mergeFn(
      schema,
      ...[mergedSchemas[typeName]].filter(isNonNullable),
    )
  }
  return Object.values(mergedSchemas).flat()
}

export function fitsSchema(
  sample: AnySchemaType | SomeSchemaType,
  predicate: AnySchemaType | SomeSchemaType,
): boolean {
  if ("anyOf" in sample && sample.anyOf) {
    return sample.anyOf.some((s) => fitsSchema(s, predicate))
  }
  if ("anyOf" in predicate && predicate.anyOf) {
    return predicate.anyOf.some((p) => fitsSchema(sample, p))
  }
  if (
    !("type" in sample) ||
    !("type" in predicate) ||
    sample.type !== predicate.type
  )
    return false
  const merged = mergeSchemas(sample, predicate)
  if (merged.length > 1) return false
  // if predicate is superset of sample it means sample fits wholy the predicate
  return isEqual(merged[0], predicate)
}
