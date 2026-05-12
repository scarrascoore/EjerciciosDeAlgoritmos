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

export class PseintLineParser {
  private lines: string[] = [];
  private current = 0;

  parse(code: string): ProgramNode {
    this.lines = code.split(/\r?\n/);
    this.current = 0;

    this.skipIgnorableLines();

    if (this.isAtEnd()) {
      throw new Error(`El código está vacío.`);
    }

    const firstLine = this.currentLine().trim();
    const algorithmMatch = firstLine.match(/^Algoritmo\s+(.+)$/i);

    if (!algorithmMatch) {
      throw new Error(
        `[Línea ${this.current + 1}] El programa debe iniciar con "Algoritmo NombrePrograma".`
      );
    }

    const programName = algorithmMatch[1].trim();
    this.current++;

    const body = this.parseBlock(["FinAlgoritmo"]);

    this.skipIgnorableLines();

    if (this.isAtEnd() || !/^FinAlgoritmo$/i.test(this.currentLine().trim())) {
      throw new Error(`No se encontró la instrucción final "FinAlgoritmo".`);
    }

    this.current++;
    this.skipIgnorableLines();

    if (!this.isAtEnd()) {
      throw new Error(
        `[Línea ${this.current + 1}] Hay contenido no esperado después de "FinAlgoritmo".`
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

      if (trimmed.includes("<-")) {
        statements.push(this.parseAssignment(trimmed, this.current + 1));
        this.current++;
        continue;
      }

      throw new Error(
        `[Línea ${this.current + 1}] Instrucción no soportada todavía: "${trimmed}".`
      );
    }
  }

  private parseDefine(line: string, lineNumber: number): DefineStatementNode {
    const match = line.match(/^Definir\s+(.+)\s+Como\s+([a-zA-ZÁÉÍÓÚáéíóú]+)$/i);

    if (!match) {
      throw new Error(
        `[Línea ${lineNumber}] Sintaxis inválida en Definir. Ejemplo: Definir edad Como Entero`
      );
    }

    const variablesPart = match[1].trim();
    const rawType = match[2].trim();

    const variableType = normalizeVariableTypeToken(rawType);

    if (!variableType) {
      throw new Error(
        `[Línea ${lineNumber}] Tipo de variable no soportado: "${rawType}".`
      );
    }

    const variables = variablesPart
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (variables.length === 0) {
      throw new Error(
        `[Línea ${lineNumber}] Debes indicar al menos una variable en Definir.`
      );
    }

    const unique = new Set<string>();

    for (const variable of variables) {
      if (!/^[a-zA-Z_]\w*$/.test(variable)) {
        throw new Error(
          `[Línea ${lineNumber}] Nombre de variable inválido: "${variable}".`
        );
      }

      const normalized = variable.toLowerCase();

      if (unique.has(normalized)) {
        throw new Error(
          `[Línea ${lineNumber}] La variable "${variable}" está repetida en la declaración.`
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
      throw new Error(
        `[Línea ${lineNumber}] Sintaxis inválida en Dimension. Ejemplo: Dimension tabla[3,4]`
      );
    }

    const rawSizes = splitArguments(match[2].trim());

    if (rawSizes.length < 1 || rawSizes.length > 2) {
      throw new Error(
        `[Línea ${lineNumber}] Dimension solo soporta arreglos de 1 dimensión o matrices de 2 dimensiones.`
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
      throw new Error(
        `[Línea ${lineNumber}] Sintaxis inválida en Segun. Ejemplo: Segun opcion Hacer`
      );
    }

    const expression = match[1].trim();
    this.current++;

    const cases: SegunCaseNode[] = [];
    let defaultBranch: StatementNode[] = [];
    let defaultSeen = false;

    while (true) {
      this.skipIgnorableLines();

      if (this.isAtEnd()) {
        throw new Error(
          `[Línea ${lineNumber}] La estructura Segun debe cerrarse con "FinSegun".`
        );
      }

      const trimmed = this.currentLine().trim();

      if (/^FinSegun$/i.test(trimmed)) {
        this.current++;
        break;
      }

      if (this.isDeOtroModoLine(trimmed)) {
        if (defaultSeen) {
          throw new Error(
            `[Línea ${this.current + 1}] "De Otro Modo" no puede repetirse.`
          );
        }

        defaultSeen = true;
        this.current++;

        defaultBranch = this.parseBlock(
          ["FinSegun"],
          (lineText) => this.isSegunCaseLine(lineText) || this.isDeOtroModoLine(lineText)
        );

        this.skipIgnorableLines();

        if (this.isAtEnd() || !/^FinSegun$/i.test(this.currentLine().trim())) {
          throw new Error(
            `[Línea ${lineNumber}] La rama "De Otro Modo" debe cerrarse con "FinSegun".`
          );
        }

        this.current++;
        break;
      }

      if (this.isSegunCaseLine(trimmed)) {
        cases.push(this.parseSegunCase());
        continue;
      }

      throw new Error(
        `[Línea ${this.current + 1}] Se esperaba un caso, "De Otro Modo" o "FinSegun" dentro de Segun.`
      );
    }

    if (cases.length === 0 && defaultBranch.length === 0) {
      throw new Error(
        `[Línea ${lineNumber}] La estructura Segun debe tener al menos un caso o "De Otro Modo".`
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
      throw new Error(`[Línea ${lineNumber}] Caso inválido dentro de Segun.`);
    }

    const rawValues = line.slice(0, -1).trim();
    const matches = splitArguments(rawValues);

    if (matches.length === 0) {
      throw new Error(
        `[Línea ${lineNumber}] El caso de Segun debe contener al menos un valor.`
      );
    }

    this.current++;

    const body = this.parseBlock(
      ["FinSegun"],
      (lineText) => this.isSegunCaseLine(lineText) || this.isDeOtroModoLine(lineText)
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
      throw new Error(`[Línea ${lineNumber}] Sintaxis inválida en Repetir.`);
    }

    this.current++;

    const body = this.parseBlock([], (lineText) =>
      /^Hasta\s+Que\s+.+$/i.test(lineText)
    );

    if (body.length === 0) {
      throw new Error(
        `[Línea ${lineNumber}] El bloque Repetir no puede estar vacío.`
      );
    }

    this.skipIgnorableLines();

    if (this.isAtEnd()) {
      throw new Error(
        `[Línea ${lineNumber}] La estructura Repetir debe cerrarse con "Hasta Que condicion".`
      );
    }

    const closingLine = this.currentLine().trim();
    const match = closingLine.match(/^Hasta\s+Que\s+(.+)$/i);

    if (!match) {
      throw new Error(
        `[Línea ${lineNumber}] La estructura Repetir debe cerrarse con "Hasta Que condicion".`
      );
    }

    const condition = match[1].trim();

    if (!condition) {
      throw new Error(
        `[Línea ${this.current + 1}] La condición de "Hasta Que" no puede estar vacía.`
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
      throw new Error(
        `[Línea ${lineNumber}] Sintaxis inválida en Si. Ejemplo: Si edad >= 18 Entonces`
      );
    }

    const condition = match[1].trim();
    this.current++;

    const thenBranch = this.parseBlock(["SiNo", "Sino", "FinSi"]);

    this.skipIgnorableLines();

    if (this.isAtEnd()) {
      throw new Error(
        `[Línea ${lineNumber}] La estructura Si no fue cerrada con "FinSi".`
      );
    }

    let elseBranch: StatementNode[] = [];
    const currentTrimmed = this.currentLine().trim();

    if (/^SiNo$/i.test(currentTrimmed) || /^Sino$/i.test(currentTrimmed)) {
      this.current++;
      elseBranch = this.parseBlock(["FinSi"]);

      this.skipIgnorableLines();

      if (this.isAtEnd() || !/^FinSi$/i.test(this.currentLine().trim())) {
        throw new Error(
          `[Línea ${lineNumber}] La rama SiNo debe cerrarse con "FinSi".`
        );
      }
    } else if (!/^FinSi$/i.test(currentTrimmed)) {
      throw new Error(
        `[Línea ${this.current + 1}] Se esperaba "SiNo" o "FinSi".`
      );
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
      throw new Error(
        `[Línea ${lineNumber}] Sintaxis inválida en Mientras. Ejemplo: Mientras i <= 10 Hacer`
      );
    }

    const condition = match[1].trim();
    this.current++;

    const body = this.parseBlock(["FinMientras"]);

    this.skipIgnorableLines();

    if (this.isAtEnd() || !/^FinMientras$/i.test(this.currentLine().trim())) {
      throw new Error(
        `[Línea ${lineNumber}] La estructura Mientras debe cerrarse con "FinMientras".`
      );
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
      /^Para\s+([a-zA-Z_]\w*)\s*<-\s*(.+?)\s+Hasta\s+(.+?)(?:\s+Con\s+Paso\s+(.+?))?\s+Hacer$/i
    );

    if (!match) {
      throw new Error(
        `[Línea ${lineNumber}] Sintaxis inválida en Para. Ejemplo: Para i <- 1 Hasta 10 Con Paso 1 Hacer`
      );
    }

    const [, variable, startExpression, endExpression, stepExpression] = match;

    this.current++;

    const body = this.parseBlock(["FinPara"]);

    this.skipIgnorableLines();

    if (this.isAtEnd() || !/^FinPara$/i.test(this.currentLine().trim())) {
      throw new Error(
        `[Línea ${lineNumber}] La estructura Para debe cerrarse con "FinPara".`
      );
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
      throw new Error(`[Línea ${lineNumber}] Sintaxis inválida en Escribir.`);
    }

    const args = splitArguments(match[1]);

    if (args.length === 0) {
      throw new Error(
        `[Línea ${lineNumber}] Escribir debe contener al menos un argumento.`
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
      throw new Error(`[Línea ${lineNumber}] Sintaxis inválida en Leer.`);
    }

    return {
      type: "read",
      target: parseTarget(match[1].trim(), lineNumber),
      line: lineNumber,
    };
  }

  private parseAssignment(
    line: string,
    lineNumber: number
  ): AssignmentStatementNode {
    const match = line.match(/^(.+?)\s*<-\s*(.+)$/i);

    if (!match) {
      throw new Error(`[Línea ${lineNumber}] Sintaxis inválida en asignación.`);
    }

    return {
      type: "assign",
      target: parseTarget(match[1].trim(), lineNumber),
      expression: match[2].trim(),
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

    throw new Error(
      `[Línea ${lineNumber}] Solo se soportan accesos de una o dos dimensiones.`
    );
  }

  if (!/^[a-zA-Z_]\w*$/.test(rawTarget)) {
    throw new Error(`[Línea ${lineNumber}] Destino inválido: "${rawTarget}".`);
  }

  return {
    kind: "variable",
    name: rawTarget.trim(),
  };
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