import type { VariableType } from "./VariableType";

export type VariableDeclaration =
  | {
      kind: "scalar";
      type: VariableType;
    }
  | {
      kind: "array";
      type: VariableType;
      size: number;
    };