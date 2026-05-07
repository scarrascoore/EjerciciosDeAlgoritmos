import type {
  AssignmentStatementNode,
  ProgramNode,
  ReadStatementNode,
  StatementNode,
  WriteStatementNode,
} from "../../../domain/ast/AstNodes";

export class PseintLineParser {
  parse(code: string): ProgramNode {
    const lines = code.split(/\r?\n/);

    let programName = "";
    let started = false;
    let ended = false;

    const body: StatementNode[] = [];

    for (let index = 0; index < lines.length; index++) {
      const rawLine = lines[index];
      const lineNumber = index + 1;
      const trimmed = rawLine.trim();

      if (!trimmed || this.isComment(trimmed)) {
        continue;
      }

      if (!started) {
        const algorithmMatch = trimmed.match(/^Algoritmo\s+(.+)$/i);
        if (!algorithmMatch) {
          throw new Error(
            `[Línea ${lineNumber}] El programa debe iniciar con "Algoritmo NombrePrograma".`
          );
        }

        programName = algorithmMatch[1].trim();
        started = true;
        continue;
      }

      if (/^FinAlgoritmo$/i.test(trimmed)) {
        ended = true;
        break;
      }

      if (/^Escribir\s+/i.test(trimmed)) {
        body.push(this.parseWrite(trimmed, lineNumber));
        continue;
      }

      if (/^Leer\s+/i.test(trimmed)) {
        body.push(this.parseRead(trimmed, lineNumber));
        continue;
      }

      if (trimmed.includes("<-")) {
        body.push(this.parseAssignment(trimmed, lineNumber));
        continue;
      }

      throw new Error(
        `[Línea ${lineNumber}] Instrucción no soportada todavía: "${trimmed}".`
      );
    }

    if (!started) {
      throw new Error(`No se encontró la instrucción inicial "Algoritmo".`);
    }

    if (!ended) {
      throw new Error(`No se encontró la instrucción final "FinAlgoritmo".`);
    }

    return {
      type: "program",
      name: programName,
      body,
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

  private isComment(line: string): boolean {
    return line.startsWith("//");
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