import type { RuntimeValue } from "../../../domain/models/RuntimeValue";

type TokenType = "number" | "string" | "identifier" | "operator" | "paren";

interface Token {
  type: TokenType;
  value: string;
}

const OPERATOR_PRECEDENCE: Record<string, number> = {
  O: 1,
  Y: 2,
  NO: 3,
  "=": 4,
  "<>": 4,
  "<": 4,
  ">": 4,
  "<=": 4,
  ">=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "/": 6,
  "%": 6,
};

const RIGHT_ASSOCIATIVE = new Set(["NO"]);

export class ExpressionEvaluator {
  evaluate(
    expression: string,
    variables: Map<string, RuntimeValue>,
    lineNumber?: number
  ): RuntimeValue {
    const tokens = tokenize(expression);
    const rpn = toRpn(tokens);
    return evaluateRpn(rpn, variables, lineNumber);
  }
}

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    const next = expression[index + 1];

    if (/\s/.test(char)) {
      index++;
      continue;
    }

    if (char === '"') {
      let value = "";
      index++;

      while (index < expression.length && expression[index] !== '"') {
        value += expression[index];
        index++;
      }

      if (index >= expression.length) {
        throw new Error(`Cadena sin cerrar en la expresión.`);
      }

      index++;

      tokens.push({
        type: "string",
        value,
      });

      continue;
    }

    if (isStartOfNegativeNumber(expression, index, tokens) || /\d/.test(char)) {
      let value = char;
      index++;

      while (index < expression.length && /[\d.]/.test(expression[index])) {
        value += expression[index];
        index++;
      }

      tokens.push({
        type: "number",
        value,
      });

      continue;
    }

    if (char === "<" && next === "=") {
      tokens.push({ type: "operator", value: "<=" });
      index += 2;
      continue;
    }

    if (char === ">" && next === "=") {
      tokens.push({ type: "operator", value: ">=" });
      index += 2;
      continue;
    }

    if (char === "<" && next === ">") {
      tokens.push({ type: "operator", value: "<>" });
      index += 2;
      continue;
    }

    if ("+-*/%=<>".includes(char)) {
      tokens.push({
        type: "operator",
        value: char,
      });
      index++;
      continue;
    }

    if ("()".includes(char)) {
      tokens.push({
        type: "paren",
        value: char,
      });
      index++;
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let value = char;
      index++;

      while (index < expression.length && /\w/.test(expression[index])) {
        value += expression[index];
        index++;
      }

      const normalized = normalizeWord(value);

      if (normalized === "y") {
        tokens.push({ type: "operator", value: "Y" });
        continue;
      }

      if (normalized === "o") {
        tokens.push({ type: "operator", value: "O" });
        continue;
      }

      if (normalized === "no") {
        tokens.push({ type: "operator", value: "NO" });
        continue;
      }

      tokens.push({
        type: "identifier",
        value,
      });

      continue;
    }

    throw new Error(`Símbolo no soportado en expresión: "${char}"`);
  }

  return tokens;
}

function isStartOfNegativeNumber(
  expression: string,
  index: number,
  tokens: Token[]
): boolean {
  const current = expression[index];
  const next = expression[index + 1];

  if (current !== "-" || !/\d/.test(next ?? "")) {
    return false;
  }

  if (tokens.length === 0) {
    return true;
  }

  const previous = tokens[tokens.length - 1];

  return (
    previous.type === "operator" ||
    (previous.type === "paren" && previous.value === "(")
  );
}

function toRpn(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const operators: Token[] = [];

  for (const token of tokens) {
    if (
      token.type === "number" ||
      token.type === "string" ||
      token.type === "identifier"
    ) {
      output.push(token);
      continue;
    }

    if (token.type === "operator") {
      while (operators.length > 0) {
        const top = operators[operators.length - 1];

        if (top.type !== "operator") {
          break;
        }

        const currentPrecedence = OPERATOR_PRECEDENCE[token.value];
        const topPrecedence = OPERATOR_PRECEDENCE[top.value];

        const shouldPop = RIGHT_ASSOCIATIVE.has(token.value)
          ? topPrecedence > currentPrecedence
          : topPrecedence >= currentPrecedence;

        if (!shouldPop) {
          break;
        }

        output.push(operators.pop()!);
      }

      operators.push(token);
      continue;
    }

    if (token.type === "paren" && token.value === "(") {
      operators.push(token);
      continue;
    }

    if (token.type === "paren" && token.value === ")") {
      while (
        operators.length > 0 &&
        !(operators[operators.length - 1].type === "paren" &&
          operators[operators.length - 1].value === "(")
      ) {
        output.push(operators.pop()!);
      }

      const opening = operators.pop();

      if (!opening || opening.value !== "(") {
        throw new Error(`Paréntesis desbalanceados en la expresión.`);
      }
    }
  }

  while (operators.length > 0) {
    const top = operators.pop()!;

    if (top.type === "paren") {
      throw new Error(`Paréntesis desbalanceados en la expresión.`);
    }

    output.push(top);
  }

  return output;
}

function evaluateRpn(
  tokens: Token[],
  variables: Map<string, RuntimeValue>,
  lineNumber?: number
): RuntimeValue {
  const stack: RuntimeValue[] = [];

  for (const token of tokens) {
    if (token.type === "number") {
      stack.push(Number(token.value));
      continue;
    }

    if (token.type === "string") {
      stack.push(token.value);
      continue;
    }

    if (token.type === "identifier") {
      const normalized = normalizeWord(token.value);

      if (normalized === "verdadero") {
        stack.push(true);
        continue;
      }

      if (normalized === "falso") {
        stack.push(false);
        continue;
      }

      if (!variables.has(normalized)) {
        throw new Error(
          formatLineError(
            `La variable "${token.value}" no tiene valor asignado.`,
            lineNumber
          )
        );
      }

      stack.push(variables.get(normalized)!);
      continue;
    }

    if (token.type === "operator") {
      if (token.value === "NO") {
        const operand = stack.pop();

        if (operand === undefined) {
          throw new Error(
            formatLineError(`La expresión lógica está incompleta.`, lineNumber)
          );
        }

        if (typeof operand !== "boolean") {
          throw new Error(
            formatLineError(`El operador "No" requiere un valor booleano.`, lineNumber)
          );
        }

        stack.push(!operand);
        continue;
      }

      const right = stack.pop();
      const left = stack.pop();

      if (left === undefined || right === undefined) {
        throw new Error(
          formatLineError(`Expresión inválida o incompleta.`, lineNumber)
        );
      }

      stack.push(applyOperator(token.value, left, right, lineNumber));
    }
  }

  if (stack.length !== 1) {
    throw new Error(
      formatLineError(`No se pudo resolver correctamente la expresión.`, lineNumber)
    );
  }

  return stack[0];
}

function applyOperator(
  operator: string,
  left: RuntimeValue,
  right: RuntimeValue,
  lineNumber?: number
): RuntimeValue {
  switch (operator) {
    case "+":
      if (typeof left === "string" || typeof right === "string") {
        return `${renderValue(left)}${renderValue(right)}`;
      }
      validateNumbers(left, right, lineNumber);
      return (left as number) + (right as number);

    case "-":
      validateNumbers(left, right, lineNumber);
      return (left as number) - (right as number);

    case "*":
      validateNumbers(left, right, lineNumber);
      return (left as number) * (right as number);

    case "/":
      validateNumbers(left, right, lineNumber);
      if ((right as number) === 0) {
        throw new Error(formatLineError(`No se puede dividir entre cero.`, lineNumber));
      }
      return (left as number) / (right as number);

    case "%":
      validateNumbers(left, right, lineNumber);
      return (left as number) % (right as number);

    case "=":
      return areEqual(left, right);

    case "<>":
      return !areEqual(left, right);

    case "<":
      validateNumbers(left, right, lineNumber);
      return (left as number) < (right as number);

    case ">":
      validateNumbers(left, right, lineNumber);
      return (left as number) > (right as number);

    case "<=":
      validateNumbers(left, right, lineNumber);
      return (left as number) <= (right as number);

    case ">=":
      validateNumbers(left, right, lineNumber);
      return (left as number) >= (right as number);

    case "Y":
      validateBooleans(left, right, lineNumber);
      return (left as boolean) && (right as boolean);

    case "O":
      validateBooleans(left, right, lineNumber);
      return (left as boolean) || (right as boolean);

    default:
      throw new Error(
        formatLineError(`Operador no soportado: ${operator}`, lineNumber)
      );
  }
}

function validateNumbers(
  left: RuntimeValue,
  right: RuntimeValue,
  lineNumber?: number
): void {
  if (typeof left !== "number" || typeof right !== "number") {
    throw new Error(
      formatLineError(`La operación requiere valores numéricos.`, lineNumber)
    );
  }
}

function validateBooleans(
  left: RuntimeValue,
  right: RuntimeValue,
  lineNumber?: number
): void {
  if (typeof left !== "boolean" || typeof right !== "boolean") {
    throw new Error(
      formatLineError(`La operación lógica requiere valores booleanos.`, lineNumber)
    );
  }
}

function areEqual(left: RuntimeValue, right: RuntimeValue): boolean {
  return left === right;
}

function normalizeWord(value: string): string {
  return value.trim().toLowerCase();
}

function renderValue(value: RuntimeValue): string {
  if (value === null) return "Nulo";
  if (typeof value === "boolean") return value ? "Verdadero" : "Falso";
  return String(value);
}

function formatLineError(message: string, lineNumber?: number): string {
  if (!lineNumber) {
    return message;
  }

  return `[Línea ${lineNumber}] ${message}`;
}