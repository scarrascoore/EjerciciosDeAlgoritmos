import type {
  AssignmentStatementNode,
  ProgramNode,
  ReadStatementNode,
  StatementNode,
  WriteStatementNode,
} from "../../../domain/ast/AstNodes";
import type { ConsoleLine } from "../../../domain/models/ConsoleLine";
import type { ExecutionResult } from "../../../domain/models/ExecutionResult";
import type { RuntimeValue } from "../../../domain/models/RuntimeValue";
import { ExpressionEvaluator } from "./ExpressionEvaluator";

export class PseintInterpreter {
  private readonly evaluator = new ExpressionEvaluator();

  async execute(program: ProgramNode): Promise<ExecutionResult> {
    const consoleLines: ConsoleLine[] = [];
    const variables = new Map<string, RuntimeValue>();

    try {
      consoleLines.push(
        createConsoleLine(
          `Iniciando ejecución del algoritmo "${program.name}"...`,
          "system"
        )
      );

      for (const statement of program.body) {
        await this.executeStatement(statement, variables, consoleLines);
      }

      consoleLines.push(
        createConsoleLine("Ejecución finalizada con éxito.", "system")
      );

      return { lines: consoleLines };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido de ejecución.";

      consoleLines.push(createConsoleLine(message, "error"));

      return { lines: consoleLines };
    }
  }

  private async executeStatement(
    statement: StatementNode,
    variables: Map<string, RuntimeValue>,
    consoleLines: ConsoleLine[]
  ): Promise<void> {
    switch (statement.type) {
      case "write":
        this.executeWrite(statement, variables, consoleLines);
        return;

      case "read":
        await this.executeRead(statement, variables, consoleLines);
        return;

      case "assign":
        this.executeAssignment(statement, variables);
        return;
    }
  }

  private executeWrite(
    statement: WriteStatementNode,
    variables: Map<string, RuntimeValue>,
    consoleLines: ConsoleLine[]
  ): void {
    const text = statement.args
      .map((arg) => {
        const value = this.evaluator.evaluate(arg, variables, statement.line);
        return renderValue(value);
      })
      .join("");

    consoleLines.push(createConsoleLine(text, "success"));
  }

  private async executeRead(
    statement: ReadStatementNode,
    variables: Map<string, RuntimeValue>,
    consoleLines: ConsoleLine[]
  ): Promise<void> {
    consoleLines.push(
      createConsoleLine(
        `Esperando entrada para: ${statement.variable}...`,
        "system"
      )
    );

    const input = window.prompt(`Ingresa el valor para ${statement.variable}`) ?? "";
    const parsedValue = inferValue(input);

    variables.set(normalizeName(statement.variable), parsedValue);

    consoleLines.push(
      createConsoleLine(
        `${statement.variable} <- ${renderValue(parsedValue)}`,
        "info"
      )
    );
  }

  private executeAssignment(
    statement: AssignmentStatementNode,
    variables: Map<string, RuntimeValue>
  ): void {
    const value = this.evaluator.evaluate(
      statement.expression,
      variables,
      statement.line
    );

    variables.set(normalizeName(statement.variable), value);
  }
}

function inferValue(raw: string): RuntimeValue {
  const trimmed = raw.trim();

  if (trimmed === "") {
    return "";
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (/^verdadero$/i.test(trimmed)) {
    return true;
  }

  if (/^falso$/i.test(trimmed)) {
    return false;
  }

  return trimmed;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function renderValue(value: RuntimeValue): string {
  if (value === null) return "Nulo";
  if (typeof value === "boolean") return value ? "Verdadero" : "Falso";
  return String(value);
}

function createConsoleLine(
  text: string,
  kind: "info" | "success" | "error" | "system"
): ConsoleLine {
  return {
    id: crypto.randomUUID(),
    text,
    kind,
    timestamp: new Date().toLocaleTimeString("es-PE", {
      hour12: false,
    }),
  };
}