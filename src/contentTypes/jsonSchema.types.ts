// https://www.learnjsonschema.com/2020-12/core/
export type AnySchemaType = {
  $schema?: string;
  $id?: string;
  $ref?: string;
  $comment?: string;
  $defs?: Record<string, SomeSchemaType>;
  $vocabulary?: Record<string, boolean>;
  $dynamicRef?: string;
  $dynamicAnchor?: string;
  $anchor?: string;
  // Applicators
  if?: SomeSchemaType;
  then?: SomeSchemaType;
  else?: SomeSchemaType;
  allOf?: SomeSchemaType[];
  anyOf?: SomeSchemaType[];
  oneOf?: SomeSchemaType[];
  not?: SomeSchemaType;
  // Meta data
  title?: string;
  description?: string;
  // default - defined in each type
  // examples - defined in each type
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
};

export type ObjectSchemaType = AnySchemaType & {
  type: "object";
  properties?: Record<string, AnySchemaType | SomeSchemaType>;
  required?: string[];
  default?: object;
  examples?: object[];
  enum?: object[];
  const?: object;
  patternProperties?: Record<string, SomeSchemaType>;
  additionalProperties?: false | SomeSchemaType;
  unevaluatedProperties?: SomeSchemaType | false;
  propertyNames?: { pattern: string };
  minProperties?: number;
  maxProperties?: number;
  dependentRequired?: Record<string, string[]>;
  dependentSchemas?: Record<string, SomeSchemaType>;
  dependencies?: Record<string, SomeSchemaType | string[]>;
};
export type ArraySchemaType = AnySchemaType & {
  type: "array";
  items?: AnySchemaType | SomeSchemaType;
  unevaluatedItems?: AnySchemaType | SomeSchemaType | false;
  default?: any[];
  examples?: any[][];
  enum?: any[][];
  const?: any[];
  contains?: SomeSchemaType;
  minContains?: number;
  maxContains?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: true;
};
export type TupleSchemaType = ArraySchemaType & {
  prefixItems: SomeSchemaType[];
};
export type NumberSchemaType = AnySchemaType & {
  type: "number";
  default?: number;
  examples?: number[];
  enum?: number[];
  const?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number | boolean;
  exclusiveMaximum?: number | boolean;
  multipleOf?: number;
};
export type IntegerSchemaType = Omit<NumberSchemaType, "type"> & {
  type: "integer";
};
export type StringSchemaType = AnySchemaType & {
  type: "string";
  default?: string;
  examples?: string[];
  enum?: string[];
  const?: string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string; // todo safeguard it somehow to our allowed list
};
export type BooleanSchemaType = AnySchemaType & {
  type: "boolean";
  default?: string;
  examples?: string[];
  enum?: boolean[];
  const?: boolean;
};
export type NullSchemaType = AnySchemaType & {
  type: "null";
  default?: null;
  examples?: null[];
  enum?: null[];
  const?: null;
};

export type SomeSchemaType =
  | ObjectSchemaType
  // | TupleSchemaType // todo tuples are not supported yet
  | ArraySchemaType
  | NumberSchemaType
  | IntegerSchemaType
  | StringSchemaType
  | BooleanSchemaType
  | NullSchemaType;

export type SchemaOf<Type extends SomeSchemaType["type"]> = Extract<
  SomeSchemaType,
  { type: Type }
>;
