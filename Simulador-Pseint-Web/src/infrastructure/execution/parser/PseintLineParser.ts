import type {
  AssignmentStatementNode,
  IfStatementNode,
  ProgramNode,
  ReadStatementNode,
  StatementNode,
  WriteStatementNode,
} from "../../../domain/ast/AstNodes";

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

      if (/^Si\s+.+\s+Entonces$/i.test(trimmed)) {
        statements.push(this.parseIf());
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