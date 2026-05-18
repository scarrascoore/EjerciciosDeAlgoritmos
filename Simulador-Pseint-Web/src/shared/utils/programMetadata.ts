export function extractProgramName(code: string): string {
  const lines = code.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = line.match(/^(Algoritmo|Proceso)\s+(.+)$/i);

    if (match) {
      return match[2].trim();
    }
  }

  return "SinNombre";
}