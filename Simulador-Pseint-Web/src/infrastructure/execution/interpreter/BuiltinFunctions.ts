import type { RuntimeValue } from "../../../domain/models/RuntimeValue";
import {
  functionArgumentCountError,
  functionArgumentTypeError,
  lineError,
} from "../../../shared/errors/pseintErrors";

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
        throw lineError(
          lineNumber,
          `La función "${name}" requiere posiciones mayores o iguales a 1.`
        );
      }

      if (start > end) {
        throw lineError(
          lineNumber,
          `La función "${name}" requiere que inicio sea menor o igual que fin.`
        );
      }

      if (end > text.length) {
        throw lineError(
          lineNumber,
          `La función "${name}" excede la longitud de la cadena. Longitud actual: ${text.length}.`
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
        throw lineError(
          lineNumber,
          `La función "${name}" requiere un máximo mayor o igual a 0.`
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
        throw lineError(
          lineNumber,
          `La función "${name}" no pudo convertir el valor a número.`
        );
      }

      const parsed = Number(raw);
      return Number.isInteger(parsed) ? parsed : parsed;
    }

    default:
      throw lineError(lineNumber, `Función no soportada: "${name}".`);
  }
}

function expectArgCount(
  functionName: string,
  args: RuntimeValue[],
  expected: number,
  lineNumber?: number
): void {
  if (args.length !== expected) {
    throw functionArgumentCountError(
      lineNumber,
      functionName,
      expected,
      args.length
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

  throw functionArgumentTypeError(
    lineNumber,
    functionName,
    "requiere una cadena como argumento"
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

  throw functionArgumentTypeError(
    lineNumber,
    functionName,
    "requiere un valor numérico"
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

  throw functionArgumentTypeError(
    lineNumber,
    functionName,
    `requiere que "${label}" sea un entero`
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