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
  line: number
): RuntimeValue {
  const trimmed = raw.trim();

  switch (type) {
    case "Entero":
      if (!/^-?\d+$/.test(trimmed)) {
        throw new Error(
          `[Línea ${line}] La variable requiere un valor de tipo Entero.`
        );
      }
      return Number(trimmed);

    case "Real":
      if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
        throw new Error(
          `[Línea ${line}] La variable requiere un valor de tipo Real.`
        );
      }
      return Number(trimmed);

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
        `[Línea ${line}] La variable requiere un valor lógico: Verdadero o Falso.`
      );

    case "Caracter":
      if (raw.length !== 1) {
        throw new Error(
          `[Línea ${line}] La variable requiere un único carácter.`
        );
      }

      return raw;
  }
}

export function coerceValueToType(
  value: RuntimeValue,
  type: VariableType,
  line: number
): RuntimeValue {
  switch (type) {
    case "Entero":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        throw new Error(
          `[Línea ${line}] La variable requiere un valor de tipo Entero.`
        );
      }
      return value;

    case "Real":
      if (typeof value !== "number") {
        throw new Error(
          `[Línea ${line}] La variable requiere un valor de tipo Real.`
        );
      }
      return value;

    case "Cadena":
      if (typeof value !== "string") {
        throw new Error(
          `[Línea ${line}] La variable requiere un valor de tipo Cadena.`
        );
      }
      return value;

    case "Logico":
      if (typeof value !== "boolean") {
        throw new Error(
          `[Línea ${line}] La variable requiere un valor de tipo Logico.`
        );
      }
      return value;

    case "Caracter":
      if (typeof value !== "string" || value.length !== 1) {
        throw new Error(
          `[Línea ${line}] La variable requiere un valor de tipo Caracter.`
        );
      }
      return value;
  }
}

function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}