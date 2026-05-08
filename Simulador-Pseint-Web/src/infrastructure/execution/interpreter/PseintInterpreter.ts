import type { ProgramIOPort } from "../../../application/ports/ProgramIOPort";
import type {
  AssignmentStatementNode,
  IfStatementNode,
  ProgramNode,
  ReadStatementNode,
  StatementNode,
  WhileStatementNode,
  WriteStatementNode,
} from "../../../domain/ast/AstNodes";
import type { RuntimeValue } from "../../../domain/models/RuntimeValue";
import { ExpressionEvaluator } from "./ExpressionEvaluator";

const MAX_LOOP_ITERATIONS = 10000;

export class PseintInterpreter {
  private readonly evaluator = new ExpressionEvaluator();

  async execute(program: ProgramNode, io: ProgramIOPort): Promise<void> {
    const variables = new Map<string, RuntimeValue>();

    io.print(`Iniciando ejecución del algoritmo "${program.name}"...`, "system");

    for (const statement of program.body) {
      await this.executeStatement(statement, variables, io);
    }

    io.print("Ejecución finalizada con éxito.", "system");
  }

  private async executeStatement(
    statement: StatementNode,
    variables: Map<string, RuntimeValue>,
    io: ProgramIOPort
  ): Promise<void> {
    switch (statement.type) {
      case "write":
        this.executeWrite(statement, variables, io);
        return;

      case "read":
        await this.executeRead(statement, variables, io);
        return;

      case "assign":
        this.executeAssignment(statement, variables);
        return;

      case "if":
        await this.executeIf(statement, variables, io);
        return;

      case "while":
        await this.executeWhile(statement, variables, io);
        return;
    }
  }

  private executeWrite(
    statement: WriteStatementNode,
    variables: Map<string, RuntimeValue>,
    io: ProgramIOPort
  ): void {
    const text = statement.args
      .map((arg) => {
        const value = this.evaluator.evaluate(arg, variables, statement.line);
        return renderValue(value);
      })
      .join("");

    io.print(text, "success");
  }

  private async executeRead(
    statement: ReadStatementNode,
    variables: Map<string, RuntimeValue>,
    io: ProgramIOPort
  ): Promise<void> {
    const input = await io.requestInput(statement.variable);
    const parsedValue = inferValue(input);

    variables.set(normalizeName(statement.variable), parsedValue);

    io.print(`${statement.variable} <- ${renderValue(parsedValue)}`, "info");
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

  private async executeIf(
    statement: IfStatementNode,
    variables: Map<string, RuntimeValue>,
    io: ProgramIOPort
  ): Promise<void> {
    const conditionResult = this.evaluator.evaluate(
      statement.condition,
      variables,
      statement.line
    );

    if (typeof conditionResult !== "boolean") {
      throw new Error(
        `[Línea ${statement.line}] La condición del Si debe devolver Verdadero o Falso.`
      );
    }

    const branch = conditionResult ? statement.thenBranch : statement.elseBranch;

    for (const nestedStatement of branch) {
      await this.executeStatement(nestedStatement, variables, io);
    }
  }

  private async executeWhile(
    statement: WhileStatementNode,
    variables: Map<string, RuntimeValue>,
    io: ProgramIOPort
  ): Promise<void> {
    let iterations = 0;

    while (true) {
      const conditionResult = this.evaluator.evaluate(
        statement.condition,
        variables,
        statement.line
      );

      if (typeof conditionResult !== "boolean") {
        throw new Error(
          `[Línea ${statement.line}] La condición del Mientras debe devolver Verdadero o Falso.`
        );
      }

      if (!conditionResult) {
        break;
      }

      iterations++;

      if (iterations > MAX_LOOP_ITERATIONS) {
        throw new Error(
          `[Línea ${statement.line}] Se superó el límite de ${MAX_LOOP_ITERATIONS} iteraciones. Posible bucle infinito.`
        );
      }

      for (const nestedStatement of statement.body) {
        await this.executeStatement(nestedStatement, variables, io);
      }
    }
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