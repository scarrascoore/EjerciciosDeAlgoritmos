import type { ProgramIOPort } from "../../../application/ports/ProgramIOPort";
import type {
  ArrayElementTargetNode,
  AssignmentStatementNode,
  DefineStatementNode,
  DimensionStatementNode,
  ForStatementNode,
  IfStatementNode,
  MatrixElementTargetNode,
  ProgramNode,
  ReadStatementNode,
  RepeatUntilStatementNode,
  SegunStatementNode,
  StatementNode,
  TargetNode,
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
    const arrays = new Map<string, RuntimeValue[]>();
    const arrayDeclarations = new Map<string, VariableType | null>();
    const matrices = new Map<string, RuntimeValue[][]>();
    const matrixDeclarations = new Map<string, VariableType | null>();

    io.print(`Iniciando ejecución del algoritmo "${program.name}"...`, "system");

    for (const statement of program.body) {
      await this.executeStatement(
        statement,
        variables,
        declarations,
        arrays,
        arrayDeclarations,
        matrices,
        matrixDeclarations,
        io
      );
    }

    io.print("Ejecución finalizada con éxito.", "system");
  }

  private async executeStatement(
    statement: StatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>,
    io: ProgramIOPort
  ): Promise<void> {
    switch (statement.type) {
      case "define":
        this.executeDefine(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations
        );
        return;

      case "dimension":
        this.executeDimension(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations
        );
        return;

      case "write":
        this.executeWrite(statement, variables, arrays, matrices, io);
        return;

      case "read":
        await this.executeRead(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
        return;

      case "assign":
        this.executeAssignment(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations
        );
        return;

      case "if":
        await this.executeIf(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
        return;

      case "segun":
        await this.executeSegun(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
        return;

      case "while":
        await this.executeWhile(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
        return;

      case "for":
        await this.executeFor(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
        return;

      case "repeat_until":
        await this.executeRepeatUntil(
          statement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
        return;
    }
  }

  private executeDefine(
    statement: DefineStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>
  ): void {
    for (const variable of statement.variables) {
      const normalizedName = normalizeName(variable);

      if (
        declarations.has(normalizedName) ||
        variables.has(normalizedName) ||
        arrays.has(normalizedName) ||
        arrayDeclarations.has(normalizedName) ||
        matrices.has(normalizedName) ||
        matrixDeclarations.has(normalizedName)
      ) {
        throw new Error(
          `[Línea ${statement.line}] La variable "${variable}" ya fue declarada o usada previamente.`
        );
      }

      declarations.set(normalizedName, statement.variableType);
      variables.set(normalizedName, getDefaultValueForType(statement.variableType));
    }
  }

  private executeDimension(
    statement: DimensionStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>
  ): void {
    const normalizedName = normalizeName(statement.name);

    if (
      arrays.has(normalizedName) ||
      arrayDeclarations.has(normalizedName) ||
      matrices.has(normalizedName) ||
      matrixDeclarations.has(normalizedName)
    ) {
      throw new Error(
        `[Línea ${statement.line}] La estructura "${statement.name}" ya fue dimensionada.`
      );
    }

    if (statement.sizeExpressions.length === 1) {
      const sizeValue = this.evaluator.evaluate(
        statement.sizeExpressions[0],
        variables,
        arrays,
        matrices,
        statement.line
      );

      if (typeof sizeValue !== "number" || !Number.isInteger(sizeValue) || sizeValue <= 0) {
        throw new Error(
          `[Línea ${statement.line}] El tamaño del arreglo debe ser un entero mayor que cero.`
        );
      }

      let elementType: VariableType | null = null;

      if (declarations.has(normalizedName)) {
        elementType = declarations.get(normalizedName)!;
        declarations.delete(normalizedName);
        variables.delete(normalizedName);
      } else if (variables.has(normalizedName)) {
        throw new Error(
          `[Línea ${statement.line}] "${statement.name}" ya se está usando como variable escalar.`
        );
      }

      const defaultValue =
        elementType !== null ? getDefaultValueForType(elementType) : null;

      arrays.set(
        normalizedName,
        Array.from({ length: sizeValue }, () => defaultValue)
      );

      arrayDeclarations.set(normalizedName, elementType);
      return;
    }

    if (statement.sizeExpressions.length === 2) {
      const rowsValue = this.evaluator.evaluate(
        statement.sizeExpressions[0],
        variables,
        arrays,
        matrices,
        statement.line
      );

      const columnsValue = this.evaluator.evaluate(
        statement.sizeExpressions[1],
        variables,
        arrays,
        matrices,
        statement.line
      );

      if (typeof rowsValue !== "number" || !Number.isInteger(rowsValue) || rowsValue <= 0) {
        throw new Error(
          `[Línea ${statement.line}] La cantidad de filas debe ser un entero mayor que cero.`
        );
      }

      if (
        typeof columnsValue !== "number" ||
        !Number.isInteger(columnsValue) ||
        columnsValue <= 0
      ) {
        throw new Error(
          `[Línea ${statement.line}] La cantidad de columnas debe ser un entero mayor que cero.`
        );
      }

      let elementType: VariableType | null = null;

      if (declarations.has(normalizedName)) {
        elementType = declarations.get(normalizedName)!;
        declarations.delete(normalizedName);
        variables.delete(normalizedName);
      } else if (variables.has(normalizedName)) {
        throw new Error(
          `[Línea ${statement.line}] "${statement.name}" ya se está usando como variable escalar.`
        );
      }

      const defaultValue =
        elementType !== null ? getDefaultValueForType(elementType) : null;

      matrices.set(
        normalizedName,
        Array.from({ length: rowsValue }, () =>
          Array.from({ length: columnsValue }, () => defaultValue)
        )
      );

      matrixDeclarations.set(normalizedName, elementType);
      return;
    }

    throw new Error(
      `[Línea ${statement.line}] Solo se soportan arreglos de 1 dimensión o matrices de 2 dimensiones.`
    );
  }

  private executeWrite(
    statement: WriteStatementNode,
    variables: Map<string, RuntimeValue>,
    arrays: Map<string, RuntimeValue[]>,
    matrices: Map<string, RuntimeValue[][]>,
    io: ProgramIOPort
  ): void {
    const text = statement.args
      .map((arg) => {
        const value = this.evaluator.evaluate(
          arg,
          variables,
          arrays,
          matrices,
          statement.line
        );
        return renderValue(value);
      })
      .join("");

    io.print(text, "success");
  }

  private async executeRead(
    statement: ReadStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>,
    io: ProgramIOPort
  ): Promise<void> {
    const targetLabel = renderTarget(
      statement.target,
      variables,
      arrays,
      matrices,
      statement.line
    );

    const input = await io.requestInput(targetLabel);

    const expectedType = this.getTargetDeclaredType(
      statement.target,
      declarations,
      arrayDeclarations,
      matrixDeclarations
    );

    const parsedValue = expectedType
      ? parseInputToTypedValue(input, expectedType, statement.line)
      : inferValue(input);

    this.assignTarget(
      statement.target,
      parsedValue,
      statement.line,
      variables,
      declarations,
      arrays,
      arrayDeclarations,
      matrices,
      matrixDeclarations
    );

    io.print(`${targetLabel} <- ${renderValue(parsedValue)}`, "info");
  }

  private executeAssignment(
    statement: AssignmentStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>
  ): void {
    const value = this.evaluator.evaluate(
      statement.expression,
      variables,
      arrays,
      matrices,
      statement.line
    );

    this.assignTarget(
      statement.target,
      value,
      statement.line,
      variables,
      declarations,
      arrays,
      arrayDeclarations,
      matrices,
      matrixDeclarations
    );
  }

  private async executeIf(
    statement: IfStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>,
    io: ProgramIOPort
  ): Promise<void> {
    const conditionResult = this.evaluator.evaluate(
      statement.condition,
      variables,
      arrays,
      matrices,
      statement.line
    );

    if (typeof conditionResult !== "boolean") {
      throw new Error(
        `[Línea ${statement.line}] La condición del Si debe devolver Verdadero o Falso.`
      );
    }

    const branch = conditionResult ? statement.thenBranch : statement.elseBranch;

    for (const nestedStatement of branch) {
      await this.executeStatement(
        nestedStatement,
        variables,
        declarations,
        arrays,
        arrayDeclarations,
        matrices,
        matrixDeclarations,
        io
      );
    }
  }

  private async executeSegun(
    statement: SegunStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>,
    io: ProgramIOPort
  ): Promise<void> {
    const baseValue = this.evaluator.evaluate(
      statement.expression,
      variables,
      arrays,
      matrices,
      statement.line
    );

    for (const currentCase of statement.cases) {
      for (const matchExpression of currentCase.matches) {
        const caseValue = this.evaluator.evaluate(
          matchExpression,
          variables,
          arrays,
          matrices,
          currentCase.line
        );

        if (valuesAreEqual(baseValue, caseValue)) {
          for (const nestedStatement of currentCase.body) {
            await this.executeStatement(
              nestedStatement,
              variables,
              declarations,
              arrays,
              arrayDeclarations,
              matrices,
              matrixDeclarations,
              io
            );
          }
          return;
        }
      }
    }

    for (const nestedStatement of statement.defaultBranch) {
      await this.executeStatement(
        nestedStatement,
        variables,
        declarations,
        arrays,
        arrayDeclarations,
        matrices,
        matrixDeclarations,
        io
      );
    }
  }

  private async executeWhile(
    statement: WhileStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>,
    io: ProgramIOPort
  ): Promise<void> {
    let iterations = 0;

    while (true) {
      const conditionResult = this.evaluator.evaluate(
        statement.condition,
        variables,
        arrays,
        matrices,
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
        await this.executeStatement(
          nestedStatement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
      }
    }
  }

  private async executeFor(
    statement: ForStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>,
    io: ProgramIOPort
  ): Promise<void> {
    const startValue = this.evaluator.evaluate(
      statement.startExpression,
      variables,
      arrays,
      matrices,
      statement.line
    );

    const endValue = this.evaluator.evaluate(
      statement.endExpression,
      variables,
      arrays,
      matrices,
      statement.line
    );

    const stepValue = statement.stepExpression
      ? this.evaluator.evaluate(
          statement.stepExpression,
          variables,
          arrays,
          matrices,
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
      declarations,
      arrays,
      arrayDeclarations,
      matrices,
      matrixDeclarations
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
        await this.executeStatement(
          nestedStatement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
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
        declarations,
        arrays,
        arrayDeclarations,
        matrices,
        matrixDeclarations
      );
    }
  }

  private async executeRepeatUntil(
    statement: RepeatUntilStatementNode,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>,
    io: ProgramIOPort
  ): Promise<void> {
    let iterations = 0;

    while (true) {
      iterations++;

      if (iterations > MAX_LOOP_ITERATIONS) {
        throw new Error(
          `[Línea ${statement.line}] Se superó el límite de ${MAX_LOOP_ITERATIONS} iteraciones en Repetir. Posible bucle infinito.`
        );
      }

      for (const nestedStatement of statement.body) {
        await this.executeStatement(
          nestedStatement,
          variables,
          declarations,
          arrays,
          arrayDeclarations,
          matrices,
          matrixDeclarations,
          io
        );
      }

      const conditionResult = this.evaluator.evaluate(
        statement.condition,
        variables,
        arrays,
        matrices,
        statement.line
      );

      if (typeof conditionResult !== "boolean") {
        throw new Error(
          `[Línea ${statement.line}] La condición de "Hasta Que" debe devolver Verdadero o Falso.`
        );
      }

      if (conditionResult) {
        break;
      }
    }
  }

  private getTargetDeclaredType(
    target: TargetNode,
    declarations: Map<string, VariableType>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrixDeclarations: Map<string, VariableType | null>
  ): VariableType | null {
    if (target.kind === "variable") {
      return declarations.get(normalizeName(target.name)) ?? null;
    }

    if (target.kind === "array_element") {
      return arrayDeclarations.get(normalizeName(target.name)) ?? null;
    }

    return matrixDeclarations.get(normalizeName(target.name)) ?? null;
  }

  private assignTarget(
    target: TargetNode,
    value: RuntimeValue,
    line: number,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>
  ): void {
    if (target.kind === "variable") {
      this.assignVariable(
        target.name,
        value,
        line,
        variables,
        declarations,
        arrays,
        arrayDeclarations,
        matrices,
        matrixDeclarations
      );
      return;
    }

    if (target.kind === "array_element") {
      this.assignArrayElement(
        target,
        value,
        line,
        variables,
        arrays,
        arrayDeclarations,
        matrices
      );
      return;
    }

    this.assignMatrixElement(
      target,
      value,
      line,
      variables,
      arrays,
      matrices,
      matrixDeclarations
    );
  }

  private assignVariable(
    variableName: string,
    value: RuntimeValue,
    line: number,
    variables: Map<string, RuntimeValue>,
    declarations: Map<string, VariableType>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>
  ): void {
    const normalizedName = normalizeName(variableName);

    if (
      arrays.has(normalizedName) ||
      arrayDeclarations.has(normalizedName) ||
      matrices.has(normalizedName) ||
      matrixDeclarations.has(normalizedName)
    ) {
      throw new Error(
        `[Línea ${line}] "${variableName}" es una estructura indexada. Debes indicar sus índices.`
      );
    }

    const declaredType = declarations.get(normalizedName);

    const finalValue = declaredType
      ? coerceValueToType(value, declaredType, line)
      : value;

    variables.set(normalizedName, finalValue);
  }

  private assignArrayElement(
    target: ArrayElementTargetNode,
    value: RuntimeValue,
    line: number,
    variables: Map<string, RuntimeValue>,
    arrays: Map<string, RuntimeValue[]>,
    arrayDeclarations: Map<string, VariableType | null>,
    matrices: Map<string, RuntimeValue[][]>
  ): void {
    const normalizedName = normalizeName(target.name);
    const arrayValues = arrays.get(normalizedName);

    if (!arrayValues) {
      if (matrices.has(normalizedName)) {
        throw new Error(
          `[Línea ${line}] La matriz "${target.name}" requiere dos índices.`
        );
      }

      throw new Error(
        `[Línea ${line}] El arreglo "${target.name}" no ha sido dimensionado.`
      );
    }

    const index = this.resolveArrayIndex(
      target.name,
      target.indexExpression,
      line,
      variables,
      arrays,
      matrices
    );

    const declaredType = arrayDeclarations.get(normalizedName) ?? null;

    const finalValue = declaredType
      ? coerceValueToType(value, declaredType, line)
      : value;

    arrayValues[index - 1] = finalValue;
  }

  private assignMatrixElement(
    target: MatrixElementTargetNode,
    value: RuntimeValue,
    line: number,
    variables: Map<string, RuntimeValue>,
    arrays: Map<string, RuntimeValue[]>,
    matrices: Map<string, RuntimeValue[][]>,
    matrixDeclarations: Map<string, VariableType | null>
  ): void {
    const normalizedName = normalizeName(target.name);
    const matrixValues = matrices.get(normalizedName);

    if (!matrixValues) {
      if (arrays.has(normalizedName)) {
        throw new Error(
          `[Línea ${line}] El arreglo "${target.name}" solo admite un índice.`
        );
      }

      throw new Error(
        `[Línea ${line}] La matriz "${target.name}" no ha sido dimensionada.`
      );
    }

    const { row, column } = this.resolveMatrixIndices(
      target.name,
      target.rowExpression,
      target.columnExpression,
      line,
      variables,
      arrays,
      matrices
    );

    const declaredType = matrixDeclarations.get(normalizedName) ?? null;

    const finalValue = declaredType
      ? coerceValueToType(value, declaredType, line)
      : value;

    matrixValues[row - 1][column - 1] = finalValue;
  }

  private resolveArrayIndex(
    arrayName: string,
    indexExpression: string,
    line: number,
    variables: Map<string, RuntimeValue>,
    arrays: Map<string, RuntimeValue[]>,
    matrices: Map<string, RuntimeValue[][]>
  ): number {
    const indexValue = this.evaluator.evaluate(
      indexExpression,
      variables,
      arrays,
      matrices,
      line
    );

    if (typeof indexValue !== "number" || !Number.isInteger(indexValue)) {
      throw new Error(
        `[Línea ${line}] El índice del arreglo "${arrayName}" debe ser un entero.`
      );
    }

    const arrayValues = arrays.get(normalizeName(arrayName));

    if (!arrayValues) {
      throw new Error(
        `[Línea ${line}] El arreglo "${arrayName}" no ha sido dimensionado.`
      );
    }

    if (indexValue < 1 || indexValue > arrayValues.length) {
      throw new Error(
        `[Línea ${line}] Índice fuera de rango en "${arrayName}[${indexValue}]". Rango válido: 1..${arrayValues.length}.`
      );
    }

    return indexValue;
  }

  private resolveMatrixIndices(
    matrixName: string,
    rowExpression: string,
    columnExpression: string,
    line: number,
    variables: Map<string, RuntimeValue>,
    arrays: Map<string, RuntimeValue[]>,
    matrices: Map<string, RuntimeValue[][]>
  ): { row: number; column: number } {
    const rowValue = this.evaluator.evaluate(
      rowExpression,
      variables,
      arrays,
      matrices,
      line
    );

    const columnValue = this.evaluator.evaluate(
      columnExpression,
      variables,
      arrays,
      matrices,
      line
    );

    if (typeof rowValue !== "number" || !Number.isInteger(rowValue)) {
      throw new Error(
        `[Línea ${line}] La fila de la matriz "${matrixName}" debe ser un entero.`
      );
    }

    if (typeof columnValue !== "number" || !Number.isInteger(columnValue)) {
      throw new Error(
        `[Línea ${line}] La columna de la matriz "${matrixName}" debe ser un entero.`
      );
    }

    const matrixValues = matrices.get(normalizeName(matrixName));

    if (!matrixValues) {
      throw new Error(
        `[Línea ${line}] La matriz "${matrixName}" no ha sido dimensionada.`
      );
    }

    const totalRows = matrixValues.length;
    const totalColumns = matrixValues[0]?.length ?? 0;

    if (rowValue < 1 || rowValue > totalRows) {
      throw new Error(
        `[Línea ${line}] Fila fuera de rango en "${matrixName}[${rowValue},${columnValue}]". Rango válido de fila: 1..${totalRows}.`
      );
    }

    if (columnValue < 1 || columnValue > totalColumns) {
      throw new Error(
        `[Línea ${line}] Columna fuera de rango en "${matrixName}[${rowValue},${columnValue}]". Rango válido de columna: 1..${totalColumns}.`
      );
    }

    return {
      row: rowValue,
      column: columnValue,
    };
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

function renderTarget(
  target: TargetNode,
  variables: Map<string, RuntimeValue>,
  arrays: Map<string, RuntimeValue[]>,
  matrices: Map<string, RuntimeValue[][]>,
  line: number
): string {
  const evaluator = new ExpressionEvaluator();

  if (target.kind === "variable") {
    return target.name;
  }

  if (target.kind === "array_element") {
    const indexValue = evaluator.evaluate(
      target.indexExpression,
      variables,
      arrays,
      matrices,
      line
    );

    return `${target.name}[${String(indexValue)}]`;
  }

  const rowValue = evaluator.evaluate(
    target.rowExpression,
    variables,
    arrays,
    matrices,
    line
  );

  const columnValue = evaluator.evaluate(
    target.columnExpression,
    variables,
    arrays,
    matrices,
    line
  );

  return `${target.name}[${String(rowValue)},${String(columnValue)}]`;
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

function valuesAreEqual(left: RuntimeValue, right: RuntimeValue): boolean {
  return left === right;
}