import type {
  AssignmentStatementNode,
  DefineStatementNode,
  ForStatementNode,
  IfStatementNode,
  ProgramNode,
  ReadStatementNode,
  StatementNode,
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

  private parseBlock(stopTokens: string[]): StatementNode[] {
    const statements: StatementNode[] = [];

    while (true) {
      this.skipIgnorableLines();

      if (this.isAtEnd()) {
        return statements;
      }

      const trimmed = this.currentLine().trim();

      if (this.isStopToken(trimmed, stopTokens)) {
        return statements;
      }

      if (/^Definir\s+/i.test(trimmed)) {
        statements.push(this.parseDefine(trimmed, this.current + 1));
        this.current++;
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
    const match = line.match(/^Leer\s+([a-zA-Z_]\w*)$/i);

    if (!match) {
      throw new Error(
        `[Línea ${lineNumber}] Sintaxis inválida en Leer. Ejemplo: Leer nombre`
      );
    }

    return {
      type: "read",
      variable: match[1],
      line: lineNumber,
    };
  }

  private parseAssignment(
    line: string,
    lineNumber: number
  ): AssignmentStatementNode {
    const match = line.match(/^([a-zA-Z_]\w*)\s*<-\s*(.+)$/i);

    if (!match) {
      throw new Error(
        `[Línea ${lineNumber}] Sintaxis inválida en asignación. Ejemplo: x <- 10`
      );
    }

    return {
      type: "assign",
      variable: match[1],
      expression: match[2].trim(),
      line: lineNumber,
    };
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

function splitArguments(input: string): string[] {
  const result: string[] = [];
  let current = "";
  let inString = false;
  let parenthesisDepth = 0;

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

    if (!inString && parenthesisDepth === 0 && char === ",") {
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