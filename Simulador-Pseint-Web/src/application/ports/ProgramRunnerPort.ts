import type { ProgramIOPort } from "./ProgramIOPort";
import type { ExecutionSignal } from "../../shared/execution/ExecutionSignal";

export interface ProgramRunnerPort {
  run(
    code: string,
    io: ProgramIOPort,
    signal?: ExecutionSignal
  ): Promise<void>;
}