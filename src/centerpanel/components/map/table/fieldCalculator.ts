export interface FieldCalculationProgram {
  expression: string;
  referencedFields: string[];
  execute: (properties: Readonly<Record<string, unknown>>) => string | number | boolean | null;
}

export interface FieldCalculationOptions {
  allowedIdentifiers?: readonly string[];
}

export interface AppliedFieldCalculation {
  featureCollection: GeoJSON.FeatureCollection;
  fieldName: string;
  referencedFields: string[];
  nullCount: number;
  totalValueCount: number;
  errorCount: number;
  warnings: string[];
}

type ScalarValue = string | number | boolean | null;

type TokenKind = "number" | "string" | "identifier" | "operator" | "paren" | "comma" | "eof";

interface Token {
  kind: TokenKind;
  value: string;
  position: number;
}

type ExpressionNode =
  | { kind: "literal"; value: ScalarValue }
  | { kind: "identifier"; name: string }
  | { kind: "unary"; operator: "+" | "-" | "!"; operand: ExpressionNode }
  | {
      kind: "binary";
      operator: "+" | "-" | "*" | "/" | "%" | "==" | "!=" | ">" | ">=" | "<" | "<=" | "&&" | "||";
      left: ExpressionNode;
      right: ExpressionNode;
    }
  | { kind: "call"; name: string; args: ExpressionNode[] };

const RESERVED_IDENTIFIERS = new Set([
  "__proto__",
  "constructor",
  "document",
  "eval",
  "function",
  "functionconstructor",
  "global",
  "globalthis",
  "process",
  "prototype",
  "require",
  "this",
  "window",
]);

function roundValue(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

const FIELD_FUNCTIONS = {
  abs: (...args: ScalarValue[]): ScalarValue => {
    const value = asFiniteNumber(args[0]);
    return value === null ? null : Math.abs(value);
  },
  ceil: (...args: ScalarValue[]): ScalarValue => {
    const value = asFiniteNumber(args[0]);
    return value === null ? null : Math.ceil(value);
  },
  floor: (...args: ScalarValue[]): ScalarValue => {
    const value = asFiniteNumber(args[0]);
    return value === null ? null : Math.floor(value);
  },
  round: (...args: ScalarValue[]): ScalarValue => {
    const value = asFiniteNumber(args[0]);
    const digits = asFiniteNumber(args[1]) ?? 0;
    return value === null ? null : roundValue(value, Math.max(0, Math.floor(digits)));
  },
  sqrt: (...args: ScalarValue[]): ScalarValue => {
    const value = asFiniteNumber(args[0]);
    return value === null || value < 0 ? null : Math.sqrt(value);
  },
  pow: (...args: ScalarValue[]): ScalarValue => {
    const left = asFiniteNumber(args[0]);
    const right = asFiniteNumber(args[1]);
    return left === null || right === null ? null : Math.pow(left, right);
  },
  min: (...args: ScalarValue[]): ScalarValue => {
    const numbers = args.map((value) => asFiniteNumber(value)).filter((value): value is number => value !== null);
    return numbers.length > 0 ? Math.min(...numbers) : null;
  },
  max: (...args: ScalarValue[]): ScalarValue => {
    const numbers = args.map((value) => asFiniteNumber(value)).filter((value): value is number => value !== null);
    return numbers.length > 0 ? Math.max(...numbers) : null;
  },
  coalesce: (...args: ScalarValue[]): ScalarValue => args.find((value) => !isNullishRuntimeValue(value)) ?? null,
  lower: (...args: ScalarValue[]): ScalarValue => {
    const value = args[0];
    return typeof value === "string" ? value.toLowerCase() : null;
  },
  upper: (...args: ScalarValue[]): ScalarValue => {
    const value = args[0];
    return typeof value === "string" ? value.toUpperCase() : null;
  },
  concat: (...args: ScalarValue[]): ScalarValue => args
    .filter((value) => !isNullishRuntimeValue(value))
    .map((value) => String(value))
    .join(""),
  len: (...args: ScalarValue[]): ScalarValue => {
    const value = args[0];
    return typeof value === "string" ? value.length : null;
  },
  if: (...args: ScalarValue[]): ScalarValue => asBoolean(args[0]) ? (args[1] ?? null) : (args[2] ?? null),
  date: (...args: ScalarValue[]): ScalarValue => normalizeTemporalValue(args[0]),
  year: (...args: ScalarValue[]): ScalarValue => {
    const date = normalizeTemporalValue(args[0]);
    return date === null ? null : new Date(date).getUTCFullYear();
  },
  month: (...args: ScalarValue[]): ScalarValue => {
    const date = normalizeTemporalValue(args[0]);
    return date === null ? null : new Date(date).getUTCMonth() + 1;
  },
  day: (...args: ScalarValue[]): ScalarValue => {
    const date = normalizeTemporalValue(args[0]);
    return date === null ? null : new Date(date).getUTCDate();
  },
} satisfies Record<string, (...args: ScalarValue[]) => ScalarValue>;

export const ALLOWED_FIELD_FUNCTIONS = Object.keys(FIELD_FUNCTIONS).sort();

export class FieldCalculationError extends Error {
  readonly position: number;

  constructor(message: string, position: number) {
    super(message);
    this.name = "FieldCalculationError";
    this.position = position;
  }
}

function isIdentifierStart(character: string): boolean {
  return /^[A-Za-z_]$/.test(character);
}

function isIdentifierPart(character: string): boolean {
  return /^[A-Za-z0-9_]$/.test(character);
}

function isNullishRuntimeValue(value: unknown): value is null {
  return value == null
    || (typeof value === "number" && !Number.isFinite(value))
    || (typeof value === "string" && value.trim() === "");
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!/^[-+]?\d+(?:\.\d+)?$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTemporalValue(value: unknown): string | null {
  if (value instanceof Date) {
    const timestamp = value.getTime();
    return Number.isNaN(timestamp) ? null : value.toISOString();
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function asBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.trim().length > 0;
  return false;
}

function normalizeScalarValue(value: unknown): ScalarValue {
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return normalizeTemporalValue(value);
  return null;
}

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const character = expression[index]!;
    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if ((character === "." && /\d/.test(expression[index + 1] ?? "")) || /\d/.test(character)) {
      const start = index;
      index += 1;
      while (/\d/.test(expression[index] ?? "")) index += 1;
      if (expression[index] === ".") {
        index += 1;
        while (/\d/.test(expression[index] ?? "")) index += 1;
      }
      tokens.push({ kind: "number", value: expression.slice(start, index), position: start });
      continue;
    }

    if (character === "\"" || character === "'") {
      const quote = character;
      const start = index;
      index += 1;
      let value = "";
      while (index < expression.length) {
        const current = expression[index]!;
        if (current === "\\") {
          const escaped = expression[index + 1] ?? "";
          const escapeMap: Record<string, string> = {
            "\\": "\\",
            "\"": "\"",
            "'": "'",
            n: "\n",
            r: "\r",
            t: "\t",
          };
          value += escapeMap[escaped] ?? escaped;
          index += 2;
          continue;
        }
        if (current === quote) {
          index += 1;
          tokens.push({ kind: "string", value, position: start });
          break;
        }
        value += current;
        index += 1;
      }
      if (tokens[tokens.length - 1]?.position !== start) {
        throw new FieldCalculationError("Unterminated string literal.", start);
      }
      continue;
    }

    if (isIdentifierStart(character)) {
      const start = index;
      index += 1;
      while (isIdentifierPart(expression[index] ?? "")) index += 1;
      tokens.push({ kind: "identifier", value: expression.slice(start, index), position: start });
      continue;
    }

    const twoCharacterOperator = expression.slice(index, index + 2);
    if ([">=", "<=", "==", "!=", "&&", "||"].includes(twoCharacterOperator)) {
      tokens.push({ kind: "operator", value: twoCharacterOperator, position: index });
      index += 2;
      continue;
    }

    if (["+", "-", "*", "/", "%", "!", ">", "<"].includes(character)) {
      tokens.push({ kind: "operator", value: character, position: index });
      index += 1;
      continue;
    }

    if (character === "(") {
      tokens.push({ kind: "paren", value: character, position: index });
      index += 1;
      continue;
    }

    if (character === ")") {
      tokens.push({ kind: "paren", value: character, position: index });
      index += 1;
      continue;
    }

    if (character === ",") {
      tokens.push({ kind: "comma", value: character, position: index });
      index += 1;
      continue;
    }

    if (character === ".") {
      throw new FieldCalculationError("Property access is not allowed in field calculations.", index);
    }

    throw new FieldCalculationError(`Unsupported token \"${character}\" in expression.`, index);
  }

  tokens.push({ kind: "eof", value: "", position: expression.length });
  return tokens;
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: readonly Token[]) {}

  parse(): ExpressionNode {
    const expression = this.parseOrExpression();
    this.expect("eof");
    return expression;
  }

  private parseOrExpression(): ExpressionNode {
    let node = this.parseAndExpression();
    while (this.matchOperator("||")) {
      node = { kind: "binary", operator: "||", left: node, right: this.parseAndExpression() };
    }
    return node;
  }

  private parseAndExpression(): ExpressionNode {
    let node = this.parseEqualityExpression();
    while (this.matchOperator("&&")) {
      node = { kind: "binary", operator: "&&", left: node, right: this.parseEqualityExpression() };
    }
    return node;
  }

  private parseEqualityExpression(): ExpressionNode {
    let node = this.parseComparisonExpression();
    while (true) {
      if (this.matchOperator("==")) {
        node = { kind: "binary", operator: "==", left: node, right: this.parseComparisonExpression() };
        continue;
      }
      if (this.matchOperator("!=")) {
        node = { kind: "binary", operator: "!=", left: node, right: this.parseComparisonExpression() };
        continue;
      }
      return node;
    }
  }

  private parseComparisonExpression(): ExpressionNode {
    let node = this.parseAdditiveExpression();
    while (true) {
      if (this.matchOperator(">=")) {
        node = { kind: "binary", operator: ">=", left: node, right: this.parseAdditiveExpression() };
        continue;
      }
      if (this.matchOperator("<=")) {
        node = { kind: "binary", operator: "<=", left: node, right: this.parseAdditiveExpression() };
        continue;
      }
      if (this.matchOperator(">")) {
        node = { kind: "binary", operator: ">", left: node, right: this.parseAdditiveExpression() };
        continue;
      }
      if (this.matchOperator("<")) {
        node = { kind: "binary", operator: "<", left: node, right: this.parseAdditiveExpression() };
        continue;
      }
      return node;
    }
  }

  private parseAdditiveExpression(): ExpressionNode {
    let node = this.parseMultiplicativeExpression();
    while (true) {
      if (this.matchOperator("+")) {
        node = { kind: "binary", operator: "+", left: node, right: this.parseMultiplicativeExpression() };
        continue;
      }
      if (this.matchOperator("-")) {
        node = { kind: "binary", operator: "-", left: node, right: this.parseMultiplicativeExpression() };
        continue;
      }
      return node;
    }
  }

  private parseMultiplicativeExpression(): ExpressionNode {
    let node = this.parseUnaryExpression();
    while (true) {
      if (this.matchOperator("*")) {
        node = { kind: "binary", operator: "*", left: node, right: this.parseUnaryExpression() };
        continue;
      }
      if (this.matchOperator("/")) {
        node = { kind: "binary", operator: "/", left: node, right: this.parseUnaryExpression() };
        continue;
      }
      if (this.matchOperator("%")) {
        node = { kind: "binary", operator: "%", left: node, right: this.parseUnaryExpression() };
        continue;
      }
      return node;
    }
  }

  private parseUnaryExpression(): ExpressionNode {
    if (this.matchOperator("!")) {
      return { kind: "unary", operator: "!", operand: this.parseUnaryExpression() };
    }
    if (this.matchOperator("+")) {
      return { kind: "unary", operator: "+", operand: this.parseUnaryExpression() };
    }
    if (this.matchOperator("-")) {
      return { kind: "unary", operator: "-", operand: this.parseUnaryExpression() };
    }
    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): ExpressionNode {
    const token = this.current();

    if (token.kind === "number") {
      this.index += 1;
      return { kind: "literal", value: Number(token.value) };
    }

    if (token.kind === "string") {
      this.index += 1;
      return { kind: "literal", value: token.value };
    }

    if (token.kind === "identifier") {
      this.index += 1;
      const lowered = token.value.toLowerCase();
      if (lowered === "true") return { kind: "literal", value: true };
      if (lowered === "false") return { kind: "literal", value: false };
      if (lowered === "null") return { kind: "literal", value: null };
      if (RESERVED_IDENTIFIERS.has(lowered)) {
        throw new FieldCalculationError(`Identifier \"${token.value}\" is not allowed in field calculations.`, token.position);
      }
      if (this.matchParen("(")) {
        const args: ExpressionNode[] = [];
        if (!this.matchParen(")")) {
          do {
            args.push(this.parseOrExpression());
          } while (this.matchComma());
          this.expectParen(")");
        }
        return { kind: "call", name: lowered, args };
      }
      return { kind: "identifier", name: token.value };
    }

    if (this.matchParen("(")) {
      const expression = this.parseOrExpression();
      this.expectParen(")");
      return expression;
    }

    throw new FieldCalculationError("Unexpected token in expression.", token.position);
  }

  private current(): Token {
    return this.tokens[this.index]!;
  }

  private matchOperator(operator: string): boolean {
    const token = this.current();
    if (token.kind === "operator" && token.value === operator) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private matchParen(paren: "(" | ")"): boolean {
    const token = this.current();
    if (token.kind === "paren" && token.value === paren) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private matchComma(): boolean {
    const token = this.current();
    if (token.kind === "comma") {
      this.index += 1;
      return true;
    }
    return false;
  }

  private expect(kind: TokenKind): void {
    const token = this.current();
    if (token.kind !== kind) {
      throw new FieldCalculationError(`Expected ${kind} but found \"${token.value || token.kind}\".`, token.position);
    }
  }

  private expectParen(paren: ")"): void {
    if (!this.matchParen(paren)) {
      const token = this.current();
      throw new FieldCalculationError(`Expected \"${paren}\" but found \"${token.value || token.kind}\".`, token.position);
    }
  }
}

function collectReferencedFields(node: ExpressionNode, fields: Set<string>): void {
  if (node.kind === "identifier") {
    fields.add(node.name);
    return;
  }
  if (node.kind === "unary") {
    collectReferencedFields(node.operand, fields);
    return;
  }
  if (node.kind === "binary") {
    collectReferencedFields(node.left, fields);
    collectReferencedFields(node.right, fields);
    return;
  }
  if (node.kind === "call") {
    node.args.forEach((arg) => collectReferencedFields(arg, fields));
  }
}

function evaluateExpression(node: ExpressionNode, properties: Readonly<Record<string, unknown>>): ScalarValue {
  switch (node.kind) {
    case "literal":
      return node.value;
    case "identifier":
      return normalizeScalarValue(properties[node.name]);
    case "unary": {
      const value = evaluateExpression(node.operand, properties);
      if (node.operator === "!") return !asBoolean(value);
      const numericValue = asFiniteNumber(value);
      if (numericValue === null) return null;
      return node.operator === "+" ? numericValue : -numericValue;
    }
    case "binary": {
      if (node.operator === "&&") return asBoolean(evaluateExpression(node.left, properties)) && asBoolean(evaluateExpression(node.right, properties));
      if (node.operator === "||") return asBoolean(evaluateExpression(node.left, properties)) || asBoolean(evaluateExpression(node.right, properties));

      const left = evaluateExpression(node.left, properties);
      const right = evaluateExpression(node.right, properties);

      if (node.operator === "+") {
        if (isNullishRuntimeValue(left) || isNullishRuntimeValue(right)) return null;
        const leftNumber = asFiniteNumber(left);
        const rightNumber = asFiniteNumber(right);
        if (leftNumber !== null && rightNumber !== null) return leftNumber + rightNumber;
        return `${left}${right}`;
      }

      if (["-", "*", "/", "%"].includes(node.operator)) {
        const leftNumber = asFiniteNumber(left);
        const rightNumber = asFiniteNumber(right);
        if (leftNumber === null || rightNumber === null) return null;
        if (node.operator === "-") return leftNumber - rightNumber;
        if (node.operator === "*") return leftNumber * rightNumber;
        if (node.operator === "/") return rightNumber === 0 ? null : leftNumber / rightNumber;
        return rightNumber === 0 ? null : leftNumber % rightNumber;
      }

      if ([">", ">=", "<", "<="].includes(node.operator)) {
        const leftNumber = asFiniteNumber(left);
        const rightNumber = asFiniteNumber(right);
        if (leftNumber === null || rightNumber === null) return false;
        if (node.operator === ">") return leftNumber > rightNumber;
        if (node.operator === ">=") return leftNumber >= rightNumber;
        if (node.operator === "<") return leftNumber < rightNumber;
        return leftNumber <= rightNumber;
      }

      if (node.operator === "==") return left === right;
      if (node.operator === "!=") return left !== right;
      return null;
    }
    case "call": {
      const evaluator = FIELD_FUNCTIONS[node.name];
      if (!evaluator) {
        throw new FieldCalculationError(`Function \"${node.name}\" is not allowed in field calculations.`, 0);
      }
      return evaluator(...node.args.map((arg) => evaluateExpression(arg, properties)));
    }
  }
}

export function isValidDerivedFieldName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value.trim());
}

export function compileFieldCalculation(
  expression: string,
  options: FieldCalculationOptions = {},
): FieldCalculationProgram {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new FieldCalculationError("Enter an expression before creating a derived field.", 0);
  }

  const ast = new Parser(tokenize(trimmed)).parse();
  const referencedFields = [...new Set<string>()];
  const referencedFieldSet = new Set<string>();
  collectReferencedFields(ast, referencedFieldSet);
  const allowedIdentifiers = options.allowedIdentifiers ? new Set(options.allowedIdentifiers) : null;
  referencedFieldSet.forEach((fieldName) => {
    if (allowedIdentifiers && !allowedIdentifiers.has(fieldName)) {
      throw new FieldCalculationError(`Field \"${fieldName}\" is not available for calculation.`, 0);
    }
    referencedFields.push(fieldName);
  });

  return {
    expression: trimmed,
    referencedFields,
    execute: (properties) => evaluateExpression(ast, properties),
  };
}

export function applyFieldCalculation(input: {
  features: readonly GeoJSON.Feature[];
  fieldName: string;
  program: FieldCalculationProgram;
}): AppliedFieldCalculation {
  let nullCount = 0;
  let errorCount = 0;

  const features = input.features.map((feature) => {
    const properties = feature.properties && typeof feature.properties === "object" && !Array.isArray(feature.properties)
      ? { ...(feature.properties as Record<string, unknown>) }
      : {};
    let value: ScalarValue = null;
    try {
      value = normalizeScalarValue(input.program.execute(properties));
    } catch {
      errorCount += 1;
      value = null;
    }
    if (value === null) nullCount += 1;
    properties[input.fieldName] = value;
    return {
      ...feature,
      properties,
    };
  });

  const warnings: string[] = [];
  if (errorCount > 0) warnings.push(`${errorCount.toLocaleString()} feature calculation(s) produced null due to evaluation errors.`);
  if (nullCount > 0) warnings.push(`${nullCount.toLocaleString()} feature value(s) are null in the derived field.`);

  return {
    featureCollection: {
      type: "FeatureCollection",
      features,
    },
    fieldName: input.fieldName,
    referencedFields: input.program.referencedFields,
    nullCount,
    totalValueCount: input.features.length,
    errorCount,
    warnings,
  };
}