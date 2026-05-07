import type { ConsoleLineKind } from "../../domain/models/ConsoleLine";

export interface ProgramIOPort {
  print(text: string, kind?: ConsoleLineKind): void;
  requestInput(variableName: string): Promise<string>;
}