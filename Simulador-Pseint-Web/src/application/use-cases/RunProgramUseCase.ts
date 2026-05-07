import type { ProgramIOPort } from "../ports/ProgramIOPort";
import type { ProgramRunnerPort } from "../ports/ProgramRunnerPort";

export class RunProgramUseCase {
  private readonly runner: ProgramRunnerPort;

  constructor(runner: ProgramRunnerPort) {
    this.runner = runner;
  }

  async execute(code: string, io: ProgramIOPort): Promise<void> {
    if (!code.trim()) {
      io.print("No hay código para ejecutar.", "error");
      return;
    }

    await this.runner.run(code, io);
  }
}