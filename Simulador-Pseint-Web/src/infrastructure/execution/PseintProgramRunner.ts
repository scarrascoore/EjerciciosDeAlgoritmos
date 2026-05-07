import type { ProgramRunnerPort } from "../../application/ports/ProgramRunnerPort";
import type { ExecutionResult } from "../../domain/models/ExecutionResult";
import { PseintInterpreter } from "./interpreter/PseintInterpreter";
import { PseintLineParser } from "./parser/PseintLineParser";

export class PseintProgramRunner implements ProgramRunnerPort {
  private readonly parser = new PseintLineParser();
  private readonly interpreter = new PseintInterpreter();

  async run(code: string): Promise<ExecutionResult> {
    try {
      const program = this.parser.parse(code);
      return await this.interpreter.execute(program);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido del parser.";

      return {
        lines: [
          {
            id: crypto.randomUUID(),
            text: message,
            kind: "error",
            timestamp: new Date().toLocaleTimeString("es-PE", {
              hour12: false,
            }),
          },
        ],
      };
    }
  }
}