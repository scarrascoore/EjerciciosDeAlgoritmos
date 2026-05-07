import type { RuntimeValue } from "../../../domain/models/RuntimeValue";

type TokenType = "number" | "string" | "identifier" | "operator" | "paren";

interface Token {
  type: TokenType;
  value: string;
}

const OPERATOR_PRECEDENCE: Record<string, number> = {
  "+": 1,
  "-": 1,
  "*": 2,
  "/": 2,
  "%": 2,
};

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

    if (/[a-zA-Z_]/.test(char)) {
      let value = char;
      index++;

      while (index < expression.length && /\w/.test(expression[index])) {
        value += expression[index];
        index++;
      }

      tokens.push({
        type: "identifier",
        value,
      });

      continue;
    }

    if ("+-*/%".includes(char)) {
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
    (previous.type === "operator") ||
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

        if (
          top.type === "operator" &&
          OPERATOR_PRECEDENCE[top.value] >= OPERATOR_PRECEDENCE[token.value]
        ) {
          output.push(operators.pop()!);
        } else {
          break;
        }
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
      const lower = normalizeName(token.value);

      if (lower === "verdadero") {
        stack.push(true);
        continue;
      }

      if (lower === "falso") {
        stack.push(false);
        continue;
      }

      if (!variables.has(lower)) {
        throw new Error(
          formatLineError(
            `La variable "${token.value}" no tiene valor asignado.`,
            lineNumber
          )
        );
      }

      stack.push(variables.get(lower)!);
      continue;
    }

    if (token.type === "operator") {
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
  if (operator === "+") {
    if (typeof left === "string" || typeof right === "string") {
      return `${renderValue(left)}${renderValue(right)}`;
    }

    validateNumbers(left, right, lineNumber);
    return (left as number) + (right as number);
  }

  validateNumbers(left, right, lineNumber);

  switch (operator) {
    case "-":
      return (left as number) - (right as number);
    case "*":
      return (left as number) * (right as number);
    case "/":
      if ((right as number) === 0) {
        throw new Error(formatLineError(`No se puede dividir entre cero.`, lineNumber));
      }
      return (left as number) / (right as number);
    case "%":
      return (left as number) % (right as number);
    default:
      throw new Error(formatLineError(`Operador no soportado: ${operator}`, lineNumber));
  }
}

function validateNumbers(
  left: RuntimeValue,
  right: RuntimeValue,
  lineNumber?: number
): void {
  if (typeof left !== "number" || typeof right !== "number") {
    throw new Error(
      formatLineError(
        `La operación requiere valores numéricos.`,
        lineNumber
      )
    );
  }
}

function normalizeName(value: string): string {
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