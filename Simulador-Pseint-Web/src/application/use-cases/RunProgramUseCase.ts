import type { ExecutionResult } from "../../domain/models/ExecutionResult";
import type { ProgramRunnerPort } from "../ports/ProgramRunnerPort";

export class RunProgramUseCase {
  private readonly runner: ProgramRunnerPort;

  constructor(runner: ProgramRunnerPort) {
    this.runner = runner;
  }

  async execute(code: string): Promise<ExecutionResult> {
    if (!code.trim()) {
      return {
        lines: [
          {
            id: crypto.randomUUID(),
            text: "No hay código para ejecutar.",
            kind: "error",
            timestamp: getCurrentTime(),
          },
        ],
      };
    }

    return this.runner.run(code);
  }
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("es-PE", {
    hour12: false,
  });
}