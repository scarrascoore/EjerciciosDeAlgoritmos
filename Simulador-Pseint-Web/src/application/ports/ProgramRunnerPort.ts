import type { ExecutionResult } from "../../domain/models/ExecutionResult";

export interface ProgramRunnerPort {
  run(code: string): Promise<ExecutionResult>;
}