import type { RuntimeValue } from "../../../domain/models/RuntimeValue";

export function invokeBuiltinFunction(
  name: string,
  args: RuntimeValue[],
  lineNumber?: number
): RuntimeValue {
  const normalized = normalizeName(name);

  switch (normalized) {
    case "longitud":
      expectArgCount(name, args, 1, lineNumber);
      return toText(args[0], lineNumber, name).length;

    case "mayusculas":
      expectArgCount(name, args, 1, lineNumber);
      return toText(args[0], lineNumber, name).toUpperCase();

    case "minusculas":
      expectArgCount(name, args, 1, lineNumber);
      return toText(args[0], lineNumber, name).toLowerCase();

    case "subcadena": {
      expectArgCount(name, args, 3, lineNumber);

      const text = toText(args[0], lineNumber, name);
      const start = toInteger(args[1], lineNumber, name, "inicio");
      const end = toInteger(args[2], lineNumber, name, "fin");

      if (start < 1 || end < 1) {
        throw buildError(
          `"${name}" requiere posiciones mayores o iguales a 1.`,
          lineNumber
        );
      }

      if (start > end) {
        throw buildError(
          `"${name}" requiere que inicio sea menor o igual que fin.`,
          lineNumber
        );
      }

      if (end > text.length) {
        throw buildError(
          `"${name}" excede la longitud de la cadena. Longitud actual: ${text.length}.`,
          lineNumber
        );
      }

      return text.slice(start - 1, end);
    }

    case "trunc":
      expectArgCount(name, args, 1, lineNumber);
      return Math.trunc(toNumber(args[0], lineNumber, name));

    case "redon":
      expectArgCount(name, args, 1, lineNumber);
      return Math.round(toNumber(args[0], lineNumber, name));

    case "azar": {
      expectArgCount(name, args, 1, lineNumber);
      const max = toInteger(args[0], lineNumber, name, "maximo");

      if (max < 0) {
        throw buildError(
          `"${name}" requiere un máximo mayor o igual a 0.`,
          lineNumber
        );
      }

      return Math.floor(Math.random() * (max + 1));
    }

    case "convertiratexto":
      expectArgCount(name, args, 1, lineNumber);
      return renderRuntimeValue(args[0]);

    case "convertiranumero": {
      expectArgCount(name, args, 1, lineNumber);
      const raw = toText(args[0], lineNumber, name).trim().replace(",", ".");

      if (!/^-?\d+(\.\d+)?$/.test(raw)) {
        throw buildError(
          `"${name}" no pudo convertir el valor a número.`,
          lineNumber
        );
      }

      const parsed = Number(raw);
      return Number.isInteger(parsed) ? parsed : parsed;
    }

    default:
      throw buildError(`Función no soportada: "${name}".`, lineNumber);
  }
}

function expectArgCount(
  functionName: string,
  args: RuntimeValue[],
  expected: number,
  lineNumber?: number
): void {
  if (args.length !== expected) {
    throw buildError(
      `"${functionName}" esperaba ${expected} argumento(s), pero recibió ${args.length}.`,
      lineNumber
    );
  }
}

function toText(
  value: RuntimeValue,
  lineNumber: number | undefined,
  functionName: string
): string {
  if (typeof value === "string") {
    return value;
  }

  throw buildError(
    `"${functionName}" requiere una cadena como argumento.`,
    lineNumber
  );
}

function toNumber(
  value: RuntimeValue,
  lineNumber: number | undefined,
  functionName: string
): number {
  if (typeof value === "number") {
    return value;
  }

  throw buildError(
    `"${functionName}" requiere un valor numérico.`,
    lineNumber
  );
}

function toInteger(
  value: RuntimeValue,
  lineNumber: number | undefined,
  functionName: string,
  label: string
): number {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  throw buildError(
    `"${functionName}" requiere que "${label}" sea un entero.`,
    lineNumber
  );
}

function renderRuntimeValue(value: RuntimeValue): string {
  if (value === null) return "Nulo";
  if (typeof value === "boolean") return value ? "Verdadero" : "Falso";
  return String(value);
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function buildError(message: string, lineNumber?: number): Error {
  if (!lineNumber) {
    return new Error(message);
  }

  return new Error(`[Línea ${lineNumber}] ${message}`);
}