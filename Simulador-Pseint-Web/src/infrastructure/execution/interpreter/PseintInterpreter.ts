import type { ProgramIOPort } from "../../../application/ports/ProgramIOPort";
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
import type { RuntimeValue } from "../../../domain/models/RuntimeValue";
import type { VariableType } from "../../../domain/models/VariableType";
import {
  coerceValueToType,
  getDefaultValueForType,
  parseInputToTypedValue,
} from "../../../domain/models/VariableType";
import { ExpressionEvaluator } from "./ExpressionEvaluator";

const MAX_LOOP_ITERATIONS = 10000;

export class PseintInterpreter {
  private readonly evaluator = new ExpressionEvaluator();

  async execute(program: ProgramNode, io: ProgramIOPort): Promise<void> {
    const variables = new Map<string, RuntimeValue>();
    const declarations = new Map<string, VariableType>();

    io.print(`Iniciando ejecución del algoritmo "${program.name}"...`, "system");

    for (const statement of program.body) {
      await this.executeStatement(statement, variables, declarations, io);
    }

    io.print("Ejecución finalizada con éxito.", "system");
  }

  private async executeStatement(
    statement: StatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    io: ProgramIOPort
  ): Promise<void> {
    switch (statement.type) {
      case "define":
        this.executeDefine(statement, variables, declarations);
        return;

      case "write":
        this.executeWrite(statement, variables, io);
        return;

      case "read":
        await this.executeRead(statement, variables, declarations, io);
        return;

      case "assign":
        this.executeAssignment(statement, variables, declarations);
        return;

      case "if":
        await this.executeIf(statement, variables, declarations, io);
        return;

      case "while":
        await this.executeWhile(statement, variables, declarations, io);
        return;

      case "for":
        await this.executeFor(statement, variables, declarations, io);
        return;
    }
  }

  private executeDefine(
    statement: DefineStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>
  ): void {
    for (const variable of statement.variables) {
      const normalizedName = normalizeName(variable);

      if (declarations.has(normalizedName) || variables.has(normalizedName)) {
        throw new Error(
          `[Línea ${statement.line}] La variable "${variable}" ya fue declarada o usada previamente.`
        );
      }

      declarations.set(normalizedName, statement.variableType);
      variables.set(
        normalizedName,
        getDefaultValueForType(statement.variableType)
      );
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
    declarations: Map<string, VariableType>,
    io: ProgramIOPort
  ): Promise<void> {
    const input = await io.requestInput(statement.variable);
    const normalizedName = normalizeName(statement.variable);
    const declaredType = declarations.get(normalizedName);

    const parsedValue = declaredType
      ? parseInputToTypedValue(input, declaredType, statement.line)
      : inferValue(input);

    variables.set(normalizedName, parsedValue);

    io.print(`${statement.variable} <- ${renderValue(parsedValue)}`, "info");
  }

  private executeAssignment(
    statement: AssignmentStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>
  ): void {
    const value = this.evaluator.evaluate(
      statement.expression,
      variables,
      statement.line
    );

    this.assignVariable(
      statement.variable,
      value,
      statement.line,
      variables,
      declarations
    );
  }

  private async executeIf(
    statement: IfStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
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
      await this.executeStatement(nestedStatement, variables, declarations, io);
    }
  }

  private async executeWhile(
    statement: WhileStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
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
        await this.executeStatement(nestedStatement, variables, declarations, io);
      }
    }
  }

  private async executeFor(
    statement: ForStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    io: ProgramIOPort
  ): Promise<void> {
    const startValue = this.evaluator.evaluate(
      statement.startExpression,
      variables,
      statement.line
    );

    const endValue = this.evaluator.evaluate(
      statement.endExpression,
      variables,
      statement.line
    );

    const stepValue = statement.stepExpression
      ? this.evaluator.evaluate(
          statement.stepExpression,
          variables,
          statement.line
        )
      : 1;

    const startNumber = ensureNumber(
      startValue,
      statement.line,
      "El valor inicial del Para debe ser numérico."
    );

    const endNumber = ensureNumber(
      endValue,
      statement.line,
      "El valor final del Para debe ser numérico."
    );

    const stepNumber = ensureNumber(
      stepValue,
      statement.line,
      "El paso del Para debe ser numérico."
    );

    if (stepNumber === 0) {
      throw new Error(
        `[Línea ${statement.line}] El paso del Para no puede ser cero.`
      );
    }

    const variableName = normalizeName(statement.variable);
    let iterations = 0;

    this.assignVariable(
      statement.variable,
      startNumber,
      statement.line,
      variables,
      declarations
    );

    while (true) {
      const currentValue = ensureNumber(
        variables.get(variableName),
        statement.line,
        `La variable de control "${statement.variable}" debe mantenerse numérica.`
      );

      const shouldContinue =
        stepNumber > 0 ? currentValue <= endNumber : currentValue >= endNumber;

      if (!shouldContinue) {
        break;
      }

      iterations++;

      if (iterations > MAX_LOOP_ITERATIONS) {
        throw new Error(
          `[Línea ${statement.line}] Se superó el límite de ${MAX_LOOP_ITERATIONS} iteraciones en el Para. Posible bucle infinito.`
        );
      }

      for (const nestedStatement of statement.body) {
        await this.executeStatement(nestedStatement, variables, declarations, io);
      }

      const valueAfterBody = ensureNumber(
        variables.get(variableName),
        statement.line,
        `La variable de control "${statement.variable}" debe mantenerse numérica.`
      );

      this.assignVariable(
        statement.variable,
        valueAfterBody + stepNumber,
        statement.line,
        variables,
        declarations
      );
    }
  }

  private assignVariable(
    variableName: string,
    value: RuntimeValue,
    line: number,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>
  ): void {
    const normalizedName = normalizeName(variableName);
    const declaredType = declarations.get(normalizedName);

    const finalValue = declaredType
      ? coerceValueToType(value, declaredType, line)
      : value;

    variables.set(normalizedName, finalValue);
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

function ensureNumber(
  value: RuntimeValue | undefined,
  line: number,
  message: string
): number {
  if (typeof value !== "number") {
    throw new Error(`[Línea ${line}] ${message}`);
  }

  return value;
}