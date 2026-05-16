import type { ProgramIOPort } from "../../application/ports/ProgramIOPort";
import type { ConsoleLine, ConsoleLineKind } from "../../domain/models/ConsoleLine";

interface ReactConsoleIOOptions {
  appendLine: (line: ConsoleLine) => void;
  setPendingVariable: (variableName: string | null) => void;
  shouldAcceptIO: () => boolean;
}

export class ReactConsoleIO implements ProgramIOPort {
  private pendingResolver: ((value: string) => void) | null = null;
  private pendingVariable: string | null = null;
  private readonly options: ReactConsoleIOOptions;

  constructor(options: ReactConsoleIOOptions) {
    this.options = options;
  }

  print(text: string, kind: ConsoleLineKind = "info"): void {
    if (!this.options.shouldAcceptIO()) {
      return;
    }

    this.options.appendLine({
      id: crypto.randomUUID(),
      text,
      kind,
      timestamp: new Date().toLocaleTimeString("es-PE", {
        hour12: false,
      }),
    });
  }

  async requestInput(variableName: string): Promise<string> {
    if (!this.options.shouldAcceptIO()) {
      return "";
    }

    this.pendingVariable = variableName;
    this.options.setPendingVariable(variableName);

    return new Promise<string>((resolve) => {
      this.pendingResolver = resolve;
    });
  }

  submitInput(value: string): void {
    if (!this.pendingResolver || !this.pendingVariable) {
      return;
    }

    if (this.options.shouldAcceptIO()) {
      this.print(`> ${value}`, "info");
    }

    const resolve = this.pendingResolver;

    this.pendingResolver = null;
    this.pendingVariable = null;
    this.options.setPendingVariable(null);

    resolve(value);
  }

  stop(): void {
    if (this.pendingResolver) {
      const resolve = this.pendingResolver;
      this.pendingResolver = null;
      this.pendingVariable = null;
      this.options.setPendingVariable(null);
      resolve("");
    } else {
      this.options.setPendingVariable(null);
    }
  }

  isWaitingForInput(): boolean {
    return this.pendingResolver !== null;
  }
}