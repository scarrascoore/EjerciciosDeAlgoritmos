export function lineMessage(
  lineNumber: number | undefined,
  message: string
): string {
  return lineNumber ? `[Línea ${lineNumber}] ${message}` : message;
}

export function lineError(
  lineNumber: number | undefined,
  message: string
): Error {
  return new Error(lineMessage(lineNumber, message));
}

export function syntaxError(
  lineNumber: number,
  structureName: string,
  example?: string
): Error {
  const exampleText = example ? ` Ejemplo: ${example}.` : "";
  return lineError(
    lineNumber,
    `Sintaxis inválida en ${structureName}.${exampleText}`
  );
}

export function missingTokenError(
  lineNumber: number,
  token: string
): Error {
  return lineError(lineNumber, `No se encontró "${token}".`);
}

export function unsupportedInstructionError(
  lineNumber: number,
  instruction: string
): Error {
  return lineError(
    lineNumber,
    `Instrucción no soportada todavía: "${instruction}".`
  );
}

export function invalidTargetError(
  lineNumber: number,
  target: string
): Error {
  return lineError(lineNumber, `Destino inválido: "${target}".`);
}

export function typeRequirementError(
  lineNumber: number,
  targetLabel: string,
  expectedType: string,
  receivedType: string,
  receivedValue: string
): Error {
  return lineError(
    lineNumber,
    `${targetLabel} requiere un valor de tipo ${expectedType}. Valor recibido de tipo ${receivedType}: ${receivedValue}.`
  );
}

export function functionArgumentCountError(
  lineNumber: number | undefined,
  functionName: string,
  expected: number,
  received: number
): Error {
  return lineError(
    lineNumber,
    `La función "${functionName}" esperaba ${expected} argumento(s), pero recibió ${received}.`
  );
}

export function functionArgumentTypeError(
  lineNumber: number | undefined,
  functionName: string,
  detail: string
): Error {
  return lineError(lineNumber, `La función "${functionName}" ${detail}.`);
}  