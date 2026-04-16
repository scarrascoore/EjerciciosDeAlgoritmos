export type ConsoleLineKind = "info" | "success" | "error" | "system";

export interface ConsoleLine {
  id: string;
  text: string;
  kind: ConsoleLineKind;
  timestamp?: string;
}