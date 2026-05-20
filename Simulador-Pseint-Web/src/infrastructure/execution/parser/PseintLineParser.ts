import type {
  AssignmentStatementNode,
  DefineStatementNode,
  DimensionStatementNode,
  ForStatementNode,
  IfStatementNode,
  ProgramNode,
  ReadStatementNode,
  RepeatUntilStatementNode,
  SegunCaseNode,
  SegunStatementNode,
  StatementNode,
  TargetNode,
  WhileStatementNode,
  WriteStatementNode,
} from "../../../domain/ast/AstNodes";
import { normalizeVariableTypeToken } from "../../../domain/models/VariableType";
import {
  invalidTargetError,
  lineError,
  missingTokenError,
  syntaxError,
  unsupportedInstructionError,
} from "../../../shared/errors/pseintErrors";

export class PseintLineParser {
  private lines: string[] = [];
  private current = 0;

  parse(code: string): ProgramNode {
    this.lines = code.split(/\r?\n/);
    this.current = 0;

    this.skipIgnorableLines();

    if (this.isAtEnd()) {
      throw new Error("El código está vacío.");
    }

    const firstLine = this.currentLine().trim();
    const startMatch = firstLine.match(/^(Algoritmo|Proceso)\s+(.+)$/i);

    if (!startMatch) {
      throw lineError(
        this.current + 1,
        'El programa debe iniciar con "Algoritmo NombrePrograma" o "Proceso NombreProceso".'
      );
    }

    const startKeyword = startMatch[1].trim().toLowerCase();
    const programName = startMatch[2].trim();
    const expectedEnd =
      startKeyword === "proceso" ? "FinProceso" : "FinAlgoritmo";

    this.current++;

    const body = this.parseBlock([expectedEnd]);

    this.skipIgnorableLines();

    if (
      this.isAtEnd() ||
      !new RegExp(`^${expectedEnd}$`, "i").test(this.currentLine().trim())
    ) {
      throw missingTokenError(this.current + 1, expectedEnd);
    }

    this.current++;
    this.skipIgnorableLines();

    if (!this.isAtEnd()) {
      throw lineError(
        this.current + 1,
        `Hay contenido no esperado después de "${expectedEnd}".`
      );
    }

    return {
      type: "program",
      name: programName,
      body,
    };
  }

  private parseBlock(
    stopTokens: string[],
    extraStopCondition?: (line: string) => boolean
  ): StatementNode[] {
    const statements: StatementNode[] = [];

    while (true) {
      this.skipIgnorableLines();

      if (this.isAtEnd()) {
        return statements;
      }

      const trimmed = this.currentLine().trim();

      if (
        this.isStopToken(trimmed, stopTokens) ||
        (extraStopCondition ? extraStopCondition(trimmed) : false)
      ) {
        return statements;
      }

      if (/^Definir\s+/i.test(trimmed)) {
        statements.push(this.parseDefine(trimmed, this.current + 1));
        this.current++;
        continue;
      }

      if (/^Dimension\s+/i.test(trimmed)) {
        statements.push(this.parseDimension(trimmed, this.current + 1));
        this.current++;
        continue;
      }

      if (/^Segun\s+.+\s+Hacer$/i.test(trimmed)) {
        statements.push(this.parseSegun());
        continue;
      }

      if (/^Repetir$/i.test(trimmed)) {
        statements.push(this.parseRepeatUntil());
        continue;
      }

      if (/^Si\s+.+\s+Entonces$/i.test(trimmed)) {
        statements.push(this.parseIf());
        continue;
      }

      if (/^Mientras\s+.+\s+Hacer$/i.test(trimmed)) {
        statements.push(this.parseWhile());
        continue;
      }

      if (/^Para\s+.+\s+Hacer$/i.test(trimmed)) {
        statements.push(this.parseFor());
        continue;
      }

      if (/^Escribir\s+/i.test(trimmed)) {
        statements.push(this.parseWrite(trimmed, this.current + 1));
        this.current++;
        continue;
      }

      if (/^Leer\s+/i.test(trimmed)) {
        statements.push(this.parseRead(trimmed, this.current + 1));
        this.current++;
        continue;
      }

      if (hasTopLevelAssignment(trimmed)) {
        statements.push(this.parseAssignment(trimmed, this.current + 1));
        this.current++;
        continue;
      }

      throw unsupportedInstructionError(this.current + 1, trimmed);
    }
  }

  private parseDefine(line: string, lineNumber: number): DefineStatementNode {
    const match = line.match(
      /^Definir\s+(.+)\s+Como\s+([a-zA-ZÁÉÍÓÚáéíóú]+)$/i
    );

    if (!match) {
      throw syntaxError(lineNumber, "Definir", "Definir edad Como Entero");
    }

    const variablesPart = match[1].trim();
    const rawType = match[2].trim();

    const variableType = normalizeVariableTypeToken(rawType);

    if (!variableType) {
      throw lineError(
        lineNumber,
        `Tipo de variable no soportado: "${rawType}".`
      );
    }

    const variables = variablesPart
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (variables.length === 0) {
      throw lineError(
        lineNumber,
        "Debes indicar al menos una variable en Definir."
      );
    }

    const unique = new Set<string>();

    for (const variable of variables) {
      if (!/^[a-zA-Z_]\w*$/.test(variable)) {
        throw lineError(
          lineNumber,
          `Nombre de variable inválido: "${variable}".`
        );
      }

      const normalized = variable.toLowerCase();

      if (unique.has(normalized)) {
        throw lineError(
          lineNumber,
          `La variable "${variable}" está repetida en la declaración.`
        );
      }

      unique.add(normalized);
    }

    return {
      type: "define",
      variables,
      variableType,
      line: lineNumber,
    };
  }

  private parseDimension(
    line: string,
    lineNumber: number
  ): DimensionStatementNode {
    const match = line.match(/^Dimension\s+([a-zA-Z_]\w*)\s*\[\s*(.+)\s*\]$/i);

    if (!match) {
      throw syntaxError(lineNumber, "Dimension", "Dimension tabla[3,4]");
    }

    const rawSizes = splitArguments(match[2].trim());

    if (rawSizes.length < 1 || rawSizes.length > 2) {
      throw lineError(
        lineNumber,
        "Dimension solo soporta arreglos de 1 dimensión o matrices de 2 dimensiones."
      );
    }

    return {
      type: "dimension",
      name: match[1].trim(),
      sizeExpressions: rawSizes,
      line: lineNumber,
    };
  }

  private parseSegun(): SegunStatementNode {
    const lineNumber = this.current + 1;
    const line = this.currentLine().trim();

    const match = line.match(/^Segun\s+(.+)\s+Hacer$/i);

    if (!match) {
      throw syntaxError(lineNumber, "Segun", "Segun opcion Hacer");
    }

    const expression = match[1].trim();
    this.current++;

    const cases: SegunCaseNode[] = [];
    let defaultBranch: StatementNode[] = [];
    let defaultSeen = false;

    while (true) {
      this.skipIgnorableLines();

      if (this.isAtEnd()) {
        throw missingTokenError(lineNumber, "FinSegun");
      }

      const trimmed = this.currentLine().trim();

      if (/^FinSegun$/i.test(trimmed)) {
        this.current++;
        break;
      }

      if (this.isDeOtroModoLine(trimmed)) {
        if (defaultSeen) {
          throw lineError(
            this.current + 1,
            '"De Otro Modo" no puede repetirse.'
          );
        }

        defaultSeen = true;
        this.current++;

        defaultBranch = this.parseBlock(
          ["FinSegun"],
          (lineText) =>
            this.isSegunCaseLine(lineText) || this.isDeOtroModoLine(lineText)
        );

        this.skipIgnorableLines();

        if (this.isAtEnd() || !/^FinSegun$/i.test(this.currentLine().trim())) {
          throw missingTokenError(lineNumber, "FinSegun");
        }

        this.current++;
        break;
      }

      if (this.isSegunCaseLine(trimmed)) {
        cases.push(this.parseSegunCase());
        continue;
      }

      throw lineError(
        this.current + 1,
        'Se esperaba un caso, "De Otro Modo" o "FinSegun" dentro de Segun.'
      );
    }

    if (cases.length === 0 && defaultBranch.length === 0) {
      throw lineError(
        lineNumber,
        'La estructura Segun debe tener al menos un caso o "De Otro Modo".'
      );
    }

    return {
      type: "segun",
      expression,
      cases,
      defaultBranch,
      line: lineNumber,
    };
  }

  private parseSegunCase(): SegunCaseNode {
    const lineNumber = this.current + 1;
    const line = this.currentLine().trim();

    if (!this.isSegunCaseLine(line)) {
      throw lineError(lineNumber, "Caso inválido dentro de Segun.");
    }

    const rawValues = line.slice(0, -1).trim();
    const matches = splitArguments(rawValues);

    if (matches.length === 0) {
      throw lineError(
        lineNumber,
        "El caso de Segun debe contener al menos un valor."
      );
    }

    this.current++;

    const body = this.parseBlock(
      ["FinSegun"],
      (lineText) =>
        this.isSegunCaseLine(lineText) || this.isDeOtroModoLine(lineText)
    );

    return {
      matches,
      body,
      line: lineNumber,
    };
  }

  private parseRepeatUntil(): RepeatUntilStatementNode {
    const lineNumber = this.current + 1;
    const line = this.currentLine().trim();

    if (!/^Repetir$/i.test(line)) {
      throw syntaxError(lineNumber, "Repetir", "Repetir");
    }

    this.current++;

    const body = this.parseBlock([], (lineText) =>
      /^Hasta\s+Que\s+.+$/i.test(lineText)
    );

    if (body.length === 0) {
      throw lineError(lineNumber, "El bloque Repetir no puede estar vacío.");
    }

    this.skipIgnorableLines();

    if (this.isAtEnd()) {
      throw missingTokenError(lineNumber, "Hasta Que");
    }

    const closingLine = this.currentLine().trim();
    const match = closingLine.match(/^Hasta\s+Que\s+(.+)$/i);

    if (!match) {
      throw missingTokenError(lineNumber, "Hasta Que");
    }

    const condition = match[1].trim();

    if (!condition) {
      throw lineError(
        this.current + 1,
        'La condición de "Hasta Que" no puede estar vacía.'
      );
    }

    this.current++;

    return {
      type: "repeat_until",
      body,
      condition,
      line: lineNumber,
    };
  }

  private parseIf(): IfStatementNode {
    const lineNumber = this.current + 1;
    const line = this.currentLine().trim();

    const match = line.match(/^Si\s+(.+)\s+Entonces$/i);

    if (!match) {
      throw syntaxError(
        lineNumber,
        "Si",
        "Si edad >= 18 Entonces"
      );
    }

    const condition = match[1].trim();
    this.current++;

    const thenBranch = this.parseBlock(["SiNo", "Sino", "FinSi"]);

    this.skipIgnorableLines();

    if (this.isAtEnd()) {
      throw missingTokenError(lineNumber, "FinSi");
    }

    let elseBranch: StatementNode[] = [];
    const currentTrimmed = this.currentLine().trim();

    if (/^SiNo$/i.test(currentTrimmed) || /^Sino$/i.test(currentTrimmed)) {
      this.current++;
      elseBranch = this.parseBlock(["FinSi"]);

      this.skipIgnorableLines();

      if (this.isAtEnd() || !/^FinSi$/i.test(this.currentLine().trim())) {
        throw missingTokenError(lineNumber, "FinSi");
      }
    } else if (!/^FinSi$/i.test(currentTrimmed)) {
      throw lineError(this.current + 1, 'Se esperaba "SiNo" o "FinSi".');
    }

    this.current++;

    return {
      type: "if",
      condition,
      thenBranch,
      elseBranch,
      line: lineNumber,
    };
  }

  private parseWhile(): WhileStatementNode {
    const lineNumber = this.current + 1;
    const line = this.currentLine().trim();

    const match = line.match(/^Mientras\s+(.+)\s+Hacer$/i);

    if (!match) {
      throw syntaxError(
        lineNumber,
        "Mientras",
        "Mientras i <= 10 Hacer"
      );
    }

    const condition = match[1].trim();
    this.current++;

    const body = this.parseBlock(["FinMientras"]);

    this.skipIgnorableLines();

    if (this.isAtEnd() || !/^FinMientras$/i.test(this.currentLine().trim())) {
      throw missingTokenError(lineNumber, "FinMientras");
    }

    this.current++;

    return {
      type: "while",
      condition,
      body,
      line: lineNumber,
    };
  }

  private parseFor(): ForStatementNode {
    const lineNumber = this.current + 1;
    const line = this.currentLine().trim();

    const match = line.match(
      /^Para\s+([a-zA-Z_]\w*)\s*(?:<-|=)\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer$/i
    );

    if (!match) {
      throw syntaxError(
        lineNumber,
        "Para",
        "Para i <- 1 Hasta 10 Hacer o Para i = 1 Hasta 10 Hacer"
      );
    }

    const [, variable, startExpression, endExpression, stepExpression] = match;

    this.current++;

    const body = this.parseBlock(["FinPara"]);

    this.skipIgnorableLines();

    if (this.isAtEnd() || !/^FinPara$/i.test(this.currentLine().trim())) {
      throw missingTokenError(lineNumber, "FinPara");
    }

    this.current++;

    return {
      type: "for",
      variable: variable.trim(),
      startExpression: startExpression.trim(),
      endExpression: endExpression.trim(),
      stepExpression: stepExpression?.trim() ?? null,
      body,
      line: lineNumber,
    };
  }

  private parseWrite(line: string, lineNumber: number): WriteStatementNode {
    const match = line.match(/^Escribir\s+(.+)$/i);

    if (!match) {
      throw syntaxError(lineNumber, "Escribir", 'Escribir "Hola mundo"');
    }

    const args = splitWriteArguments(match[1]);

    if (args.length === 0) {
      throw lineError(
        lineNumber,
        "Escribir debe contener al menos un argumento."
      );
    }

    return {
      type: "write",
      args,
      line: lineNumber,
    };
  }

  private parseRead(line: string, lineNumber: number): ReadStatementNode {
    const match = line.match(/^Leer\s+(.+)$/i);

    if (!match) {
      throw syntaxError(lineNumber, "Leer", "Leer variable");
    }

    const rawTargets = splitArguments(match[1].trim());

    if (rawTargets.length === 0) {
      throw lineError(
        lineNumber,
        "Leer debe contener al menos una variable o destino."
      );
    }

    return {
      type: "read",
      targets: rawTargets.map((rawTarget) =>
        parseTarget(rawTarget.trim(), lineNumber)
      ),
      line: lineNumber,
    };
  }

  private parseAssignment(
    line: string,
    lineNumber: number
  ): AssignmentStatementNode {
    const parts = splitTopLevelAssignment(line);

    if (!parts) {
      throw syntaxError(lineNumber, "asignación", "x <- 10");
    }

    return {
      type: "assign",
      target: parseTarget(parts.left.trim(), lineNumber),
      expression: parts.right.trim(),
      line: lineNumber,
    };
  }

  private isSegunCaseLine(line: string): boolean {
    if (this.isDeOtroModoLine(line)) return false;
    if (/^FinSegun$/i.test(line)) return false;
    return /^.+:\s*$/.test(line);
  }

  private isDeOtroModoLine(line: string): boolean {
    return /^De\s+Otro\s+Modo\s*:?\s*$/i.test(line);
  }

  private skipIgnorableLines(): void {
    while (!this.isAtEnd()) {
      const trimmed = this.currentLine().trim();

      if (trimmed === "" || trimmed.startsWith("//")) {
        this.current++;
        continue;
      }

      break;
    }
  }

  private isStopToken(line: string, stopTokens: string[]): boolean {
    const normalized = line.trim().toLowerCase();
    return stopTokens.some((token) => normalized === token.toLowerCase());
  }

  private currentLine(): string {
    return this.lines[this.current];
  }

  private isAtEnd(): boolean {
    return this.current >= this.lines.length;
  }
}

function parseTarget(rawTarget: string, lineNumber: number): TargetNode {
  const indexedMatch = rawTarget.match(/^([a-zA-Z_]\w*)\s*\[\s*(.+)\s*\]$/i);

  if (indexedMatch) {
    const name = indexedMatch[1].trim();
    const rawIndexes = splitArguments(indexedMatch[2].trim());

    if (rawIndexes.length === 1) {
      return {
        kind: "array_element",
        name,
        indexExpression: rawIndexes[0].trim(),
      };
    }

    if (rawIndexes.length === 2) {
      return {
        kind: "matrix_element",
        name,
        rowExpression: rawIndexes[0].trim(),
        columnExpression: rawIndexes[1].trim(),
      };
    }

    throw lineError(
      lineNumber,
      "Solo se soportan accesos de una o dos dimensiones."
    );
  }

  if (!/^[a-zA-Z_]\w*$/.test(rawTarget)) {
    throw invalidTargetError(lineNumber, rawTarget);
  }

  return {
    kind: "variable",
    name: rawTarget.trim(),
  };
}

function hasTopLevelAssignment(line: string): boolean {
  return splitTopLevelAssignment(line) !== null;
}

function splitTopLevelAssignment(
  input: string
): { left: string; right: string } | null {
  let inString = false;
  let parenthesisDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];
    const prev = input[i - 1];

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "(") {
      parenthesisDepth++;
      continue;
    }

    if (char === ")") {
      parenthesisDepth--;
      continue;
    }

    if (char === "[") {
      bracketDepth++;
      continue;
    }

    if (char === "]") {
      bracketDepth--;
      continue;
    }

    if (parenthesisDepth !== 0 || bracketDepth !== 0) {
      continue;
    }

    if (char === "<" && next === "-") {
      return {
        left: input.slice(0, i),
        right: input.slice(i + 2),
      };
    }

    if (char === "=" && prev !== "<" && prev !== ">" && next !== "=") {
      return {
        left: input.slice(0, i),
        right: input.slice(i + 1),
      };
    }
  }

  return null;
}

function splitWriteArguments(input: string): string[] {
  const commaArgs = splitArguments(input);

  if (commaArgs.length > 1) {
    return commaArgs;
  }

  const adjacencyArgs = splitWriteArgumentsByAdjacency(input);

  if (adjacencyArgs && adjacencyArgs.length > 1) {
    return adjacencyArgs;
  }

  return commaArgs;
}

function splitWriteArgumentsByAdjacency(input: string): string[] | null {
  const items: string[] = [];
  let i = 0;

  while (i < input.length) {
    while (i < input.length && /\s/.test(input[i])) {
      i++;
    }

    if (i >= input.length) {
      break;
    }

    const start = i;
    const char = input[i];

    if (char === '"') {
      i++;
      while (i < input.length) {
        if (input[i] === '"' && input[i - 1] !== "\\") {
          i++;
          break;
        }
        i++;
      }

      items.push(input.slice(start, i).trim());
      continue;
    }

    if (char === "(") {
      const end = readBalancedSegment(input, i, "(", ")");
      if (end === -1) return null;

      i = end;
      items.push(input.slice(start, i).trim());
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      i++;

      while (i < input.length && /\w/.test(input[i])) {
        i++;
      }

      while (true) {
        while (i < input.length && /\s/.test(input[i])) {
          i++;
        }

        if (input[i] === "(") {
          const end = readBalancedSegment(input, i, "(", ")");
          if (end === -1) return null;
          i = end;
          continue;
        }

        if (input[i] === "[") {
          const end = readBalancedSegment(input, i, "[", "]");
          if (end === -1) return null;
          i = end;
          continue;
        }

        break;
      }

      items.push(input.slice(start, i).trim());
      continue;
    }

    if (/\d/.test(char) || (char === "-" && /\d/.test(input[i + 1] ?? ""))) {
      i++;

      while (i < input.length && /[\d.]/.test(input[i])) {
        i++;
      }

      items.push(input.slice(start, i).trim());
      continue;
    }

    if ("+-*/%=<>".includes(char)) {
      return null;
    }

    return null;
  }

  return items.length > 0 ? items : null;
}

function readBalancedSegment(
  input: string,
  startIndex: number,
  openChar: string,
  closeChar: string
): number {
  let depth = 0;
  let inString = false;
  let i = startIndex;

  while (i < input.length) {
    const char = input[i];

    if (char === '"' && input[i - 1] !== "\\") {
      inString = !inString;
      i++;
      continue;
    }

    if (!inString && char === openChar) {
      depth++;
    } else if (!inString && char === closeChar) {
      depth--;

      if (depth === 0) {
        return i + 1;
      }
    }

    i++;
  }

  return -1;
}

function splitArguments(input: string): string[] {
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