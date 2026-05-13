import type { RuntimeValue } from "./RuntimeValue";

export type VariableType =
  | "Entero"
  | "Real"
  | "Cadena"
  | "Logico"
  | "Caracter";

export function normalizeVariableTypeToken(rawType: string): VariableType | null {
  const normalized = removeAccents(rawType).trim().toLowerCase();

  switch (normalized) {
    case "entero":
      return "Entero";
    case "real":
      return "Real";
    case "cadena":
      return "Cadena";
    case "logico":
      return "Logico";
    case "caracter":
      return "Caracter";
    default:
      return null;
  }
}

export function getDefaultValueForType(type: VariableType): RuntimeValue {
  switch (type) {
    case "Entero":
      return 0;
    case "Real":
      return 0;
    case "Cadena":
      return "";
    case "Logico":
      return false;
    case "Caracter":
      return "";
  }
}

export function parseInputToTypedValue(
  raw: string,
  type: VariableType,
  line: number,
  targetLabel = "La entrada"
): RuntimeValue {
  const trimmed = raw.trim();

  switch (type) {
    case "Entero": {
      if (!/^-?\d+$/.test(trimmed)) {
        throw new Error(
          `[Línea ${line}] ${targetLabel} requiere un valor de tipo Entero. Valor recibido: "${raw}".`
        );
      }

      return Number(trimmed);
    }

    case "Real": {
      const normalized = normalizeNumericInput(trimmed);

      if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
        throw new Error(
          `[Línea ${line}] ${targetLabel} requiere un valor de tipo Real. Valor recibido: "${raw}".`
        );
      }

      return Number(normalized);
    }

    case "Cadena":
      return raw;

    case "Logico":
      if (/^verdadero$/i.test(trimmed)) {
        return true;
      }

      if (/^falso$/i.test(trimmed)) {
        return false;
      }

      throw new Error(
        `[Línea ${line}] ${targetLabel} requiere un valor lógico: Verdadero o Falso. Valor recibido: "${raw}".`
      );

    case "Caracter": {
      const candidate = trimmed;

      if (candidate.length !== 1) {
        throw new Error(
          `[Línea ${line}] ${targetLabel} requiere un único carácter. Valor recibido: "${raw}".`
        );
      }

      return candidate;
    }
  }
}

export function coerceValueToType(
  value: RuntimeValue,
  type: VariableType,
  line: number,
  targetLabel = "La variable"
): RuntimeValue {
  switch (type) {
    case "Entero":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw buildRuntimeTypeError(line, targetLabel, type, value);
      }
      return value;

    case "Real":
      if (typeof value !== "number") {
        throw buildRuntimeTypeError(line, targetLabel, type, value);
      }
      return value;

    case "Cadena":
      if (typeof value !== "string") {
        throw buildRuntimeTypeError(line, targetLabel, type, value);
      }
      return value;

    case "Logico":
      if (typeof value !== "boolean") {
        throw buildRuntimeTypeError(line, targetLabel, type, value);
      }
      return value;

    case "Caracter":
      if (typeof value !== "string" || value.length !== 1) {
        throw buildRuntimeTypeError(line, targetLabel, type, value);
      }
      return value;
  }
}

function buildRuntimeTypeError(
  line: number,
  targetLabel: string,
  expectedType: VariableType,
  value: RuntimeValue
): Error {
  return new Error(
    `[Línea ${line}] ${targetLabel} requiere un valor de tipo ${expectedType}. ` +
      `Valor recibido de tipo ${describeRuntimeValueType(value)}: ${renderRuntimeValue(value)}.`
  );
}

function describeRuntimeValueType(value: RuntimeValue): string {
  if (value === null) {
    return "Nulo";
  }

  if (typeof value === "boolean") {
    return "Logico";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? "Entero" : "Real";
  }

  if (typeof value === "string") {
    return value.length === 1 ? "Caracter" : "Cadena";
  }

  return "Desconocido";
}

function renderRuntimeValue(value: RuntimeValue): string {
  if (value === null) {
    return "Nulo";
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (typeof value === "boolean") {
    return value ? "Verdadero" : "Falso";
  }

  return String(value);
}

function normalizeNumericInput(value: string): string {
  return value.replace(",", ".");
}

function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}