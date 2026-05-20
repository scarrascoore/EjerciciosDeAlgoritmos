import type { ProgramIOPort } from "../../application/ports/ProgramIOPort";
import type { ProgramRunnerPort } from "../../application/ports/ProgramRunnerPort";
import type { ExecutionSignal } from "../../shared/execution/ExecutionSignal";
import {
  isExecutionCancelledError,
} from "../../shared/execution/ExecutionSignal";

import { PseintInterpreter } from "./interpreter/PseintInterpreter";
import { PseintLineParser } from "./parser/PseintLineParser";

export class PseintProgramRunner implements ProgramRunnerPort {
  private readonly parser = new PseintLineParser();
  private readonly interpreter = new PseintInterpreter();

  async run(
    code: string,
    io: ProgramIOPort,
    signal?: ExecutionSignal
  ): Promise<void> {
    try {
      signal?.throwIfCancelled();

      const program = this.parser.parse(code);

      signal?.throwIfCancelled();

      await this.interpreter.execute(program, io, signal);
    } catch (error) {
      if (isExecutionCancelledError(error)) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado durante la ejecución.";

      io.print(message, "error");
    }
  }
}