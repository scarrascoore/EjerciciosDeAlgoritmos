export class ExecutionCancelledError extends Error {
  constructor() {
    super("Execution cancelled");
    this.name = "ExecutionCancelledError";
  }
}

export class ExecutionSignal {
  private cancelled = false;

  cancel(): void {
    this.cancelled = true;
  }

  get isCancelled(): boolean {
    return this.cancelled;
  }

  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new ExecutionCancelledError();
    }
  }
}

export function isExecutionCancelledError(
  error: unknown
): error is ExecutionCancelledError {
  return error instanceof ExecutionCancelledError;
}