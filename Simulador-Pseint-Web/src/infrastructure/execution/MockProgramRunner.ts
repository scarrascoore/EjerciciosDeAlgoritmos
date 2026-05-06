import type { ProgramRunnerPort } from "../../application/ports/ProgramRunnerPort";
import type { ExecutionResult } from "../../domain/models/ExecutionResult";

export class MockProgramRunner implements ProgramRunnerPort {
  async run(code: string): Promise<ExecutionResult> {
    const totalLines = code.split("\n").length;

    return {
      lines: [
        {
          id: crypto.randomUUID(),
          text: "Iniciando ejecución...",
          kind: "system",
          timestamp: getCurrentTime(),
        },
        {
          id: crypto.randomUUID(),
          text: "Motor de pseudocódigo aún no implementado.",
          kind: "info",
          timestamp: getCurrentTime(),
        },
        {
          id: crypto.randomUUID(),
          text: `Líneas detectadas en el editor: ${totalLines}`,
          kind: "success",
          timestamp: getCurrentTime(),
        },
        {
          id: crypto.randomUUID(),
          text: "Siguiente paso: conectar parser + intérprete real.",
          kind: "system",
          timestamp: getCurrentTime(),
        },
      ],
    };
  }
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("es-PE", {
    hour12: false,
  });
}