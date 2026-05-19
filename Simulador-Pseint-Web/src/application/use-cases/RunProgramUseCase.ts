import type { ProgramIOPort } from "../ports/ProgramIOPort";
import type { ProgramRunnerPort } from "../ports/ProgramRunnerPort";
import type { ExecutionSignal } from "../../shared/execution/ExecutionSignal";

export class RunProgramUseCase {
  private readonly runner: ProgramRunnerPort;

  constructor(runner: ProgramRunnerPort) {
    this.runner = runner;
  }

  async execute(
    code: string,
    io: ProgramIOPort,
    signal?: ExecutionSignal
  ): Promise<void> {
    await this.runner.run(code, io, signal);
  }
}