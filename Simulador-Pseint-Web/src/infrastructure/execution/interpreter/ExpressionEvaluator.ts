import type { RuntimeValue } from "../../../domain/models/RuntimeValue";

type TokenType =
  | "number"
  | "string"
  | "identifier"
  | "indexed_access"
  | "operator"
  | "paren";

interface Token {
  type: TokenType;
  value: string;
  indicesExpressions?: string[];
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
    arrays: Map<string, RuntimeValue[]>,
    matrices: Map<string, RuntimeValue[][]>,
    lineNumber?: number
  ): RuntimeValue {
    const tokens = tokenize(expression);
    const rpn = toRpn(tokens);
    return evaluateRpn(rpn, variables, arrays, matrices, lineNumber);
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

      let lookAhead = index;
      while (lookAhead < expression.length && /\s/.test(expression[lookAhead])) {
        lookAhead++;
      }

      if (expression[lookAhead] === "[") {
        const { content, nextIndex } = readBracketContent(expression, lookAhead);
        const indicesExpressions = splitTopLevelArguments(content);

        if (indicesExpressions.length < 1 || indicesExpressions.length > 2) {
          throw new Error(
            `Solo se soportan accesos indexados de una o dos dimensiones.`
          );
        }

        tokens.push({
          type: "indexed_access",
          value,
          indicesExpressions: indicesExpressions.map((item) => item.trim()),
        });

        index = nextIndex;
        continue;
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

function readBracketContent(
  expression: string,
  startIndex: number
): { content: string; nextIndex: number } {
  let index = startIndex;
  let depth = 0;
  let content = "";

  while (index < expression.length) {
    const char = expression[index];

    if (char === "[") {
      depth++;
      if (depth > 1) {
        content += char;
      }
      index++;
      continue;
    }

    if (char === "]") {
      depth--;
      if (depth === 0) {
        return {
          content,
          nextIndex: index + 1,
        };
      }

      content += char;
      index++;
      continue;
    }

    content += char;
    index++;
  }

  throw new Error(`Corchetes desbalanceados en acceso indexado.`);
}

function splitTopLevelArguments(input: string): string[] {
  const result: string[] = [];
  let current = "";
  let inString = false;
  let parenthesisDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"') {
      inString = !inString;
      current += char;
      continue;
    }

    if (!inString && char === "(") {
      parenthesisDepth++;
      current += char;
      continue;
    }

    if (!inString && char === ")") {
      parenthesisDepth--;
      current += char;
      continue;
    }

    if (!inString && char === "[") {
      bracketDepth++;
      current += char;
      continue;
    }

    if (!inString && char === "]") {
      bracketDepth--;
      current += char;
      continue;
    }

    if (
      !inString &&
      parenthesisDepth === 0 &&
      bracketDepth === 0 &&
      char === ","
    ) {
      if (current.trim()) {
        result.push(current.trim());
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
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
      token.type === "identifier" ||
      token.type === "indexed_access"
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
        !(
          operators[operators.length - 1].type === "paren" &&
          operators[operators.length - 1].value === "("
        )
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
  arrays: Map<string, RuntimeValue[]>,
  matrices: Map<string, RuntimeValue[][]>,
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

      if (arrays.has(normalized) || matrices.has(normalized)) {
        throw new Error(
          formatLineError(
            `La estructura "${token.value}" debe accederse con índices.`,
            lineNumber
          )
        );
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

    if (token.type === "indexed_access") {
      const structureName = normalizeWord(token.value);
      const indexExpressions = token.indicesExpressions ?? [];

      if (indexExpressions.length === 1) {
        const arrayValues = arrays.get(structureName);

        if (!arrayValues) {
          if (matrices.has(structureName)) {
            throw new Error(
              formatLineError(
                `La matriz "${token.value}" requiere dos índices.`,
                lineNumber
              )
            );
          }

          throw new Error(
            formatLineError(
              `El arreglo "${token.value}" no ha sido dimensionado.`,
              lineNumber
            )
          );
        }

        const indexValue = new ExpressionEvaluator().evaluate(
          indexExpressions[0],
          variables,
          arrays,
          matrices,
          lineNumber
        );

        if (typeof indexValue !== "number" || !Number.isInteger(indexValue)) {
          throw new Error(
            formatLineError(
              `El índice del arreglo "${token.value}" debe ser un entero.`,
              lineNumber
            )
          );
        }

        if (indexValue < 1 || indexValue > arrayValues.length) {
          throw new Error(
            formatLineError(
              `Índice fuera de rango en "${token.value}[${indexValue}]". Rango válido: 1..${arrayValues.length}.`,
              lineNumber
            )
          );
        }

        stack.push(arrayValues[indexValue - 1]);
        continue;
      }

      if (indexExpressions.length === 2) {
        const matrixValues = matrices.get(structureName);

        if (!matrixValues) {
          if (arrays.has(structureName)) {
            throw new Error(
              formatLineError(
                `El arreglo "${token.value}" solo admite un índice.`,
                lineNumber
              )
            );
          }

          throw new Error(
            formatLineError(
              `La matriz "${token.value}" no ha sido dimensionada.`,
              lineNumber
            )
          );
        }

        const rowValue = new ExpressionEvaluator().evaluate(
          indexExpressions[0],
          variables,
          arrays,
          matrices,
          lineNumber
        );

        const columnValue = new ExpressionEvaluator().evaluate(
          indexExpressions[1],
          variables,
          arrays,
          matrices,
          lineNumber
        );

        if (typeof rowValue !== "number" || !Number.isInteger(rowValue)) {
          throw new Error(
            formatLineError(
              `La fila de la matriz "${token.value}" debe ser un entero.`,
              lineNumber
            )
          );
        }

        if (typeof columnValue !== "number" || !Number.isInteger(columnValue)) {
          throw new Error(
            formatLineError(
              `La columna de la matriz "${token.value}" debe ser un entero.`,
              lineNumber
            )
          );
        }

        const totalRows = matrixValues.length;
        const totalColumns = matrixValues[0]?.length ?? 0;

        if (rowValue < 1 || rowValue > totalRows) {
          throw new Error(
            formatLineError(
              `Fila fuera de rango en "${token.value}[${rowValue},${columnValue}]". Rango válido de fila: 1..${totalRows}.`,
              lineNumber
            )
          );
        }

        if (columnValue < 1 || columnValue > totalColumns) {
          throw new Error(
            formatLineError(
              `Columna fuera de rango en "${token.value}[${rowValue},${columnValue}]". Rango válido de columna: 1..${totalColumns}.`,
              lineNumber
            )
          );
        }

        stack.push(matrixValues[rowValue - 1][columnValue - 1]);
        continue;
      }
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
            formatLineError(
              `El operador "No" requiere un valor booleano.`,
              lineNumber
            )
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
      formatLineError(
        `No se pudo resolver correctamente la expresión.`,
        lineNumber
      )
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
        throw new Error(
          formatLineError(`No se puede dividir entre cero.`, lineNumber)
        );
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
      formatLineError(
        `La operación lógica requiere valores booleanos.`,
        lineNumber
      )
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