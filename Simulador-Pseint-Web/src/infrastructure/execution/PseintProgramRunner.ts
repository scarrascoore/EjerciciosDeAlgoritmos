import type { ProgramIOPort } from "../../application/ports/ProgramIOPort";
import type { ProgramRunnerPort } from "../../application/ports/ProgramRunnerPort";
import { PseintInterpreter } from "./interpreter/PseintInterpreter";
import { PseintLineParser } from "./parser/PseintLineParser";

export class PseintProgramRunner implements ProgramRunnerPort {
  private readonly parser = new PseintLineParser();
  private readonly interpreter = new PseintInterpreter();

  async run(code: string, io: ProgramIOPort): Promise<void> {
    try {
      const program = this.parser.parse(code);
      await this.interpreter.execute(program, io);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error desconocido del programa.";

      io.print(message, "error");
    }
  }
}