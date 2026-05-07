import type { ProgramIOPort } from "./ProgramIOPort";

export interface ProgramRunnerPort {
  run(code: string, io: ProgramIOPort): Promise<void>;
}