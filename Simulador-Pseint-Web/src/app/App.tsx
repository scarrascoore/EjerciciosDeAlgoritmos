import { useMemo, useState } from "react";
import { RunProgramUseCase } from "../application/use-cases/RunProgramUseCase";
import type { ConsoleLine } from "../domain/models/ConsoleLine";
import { PseintProgramRunner } from "../infrastructure/execution/PseintProgramRunner";
import { defaultProgram } from "../shared/constants/defaultProgram";
import { ConsolePane } from "../ui/components/ConsolePane";
import { EditorPane } from "../ui/components/EditorPane";
import { Topbar } from "../ui/components/Topbar";

export default function App() {
  const [code, setCode] = useState(defaultProgram);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    {
      id: crypto.randomUUID(),
      text: 'Simulador listo. Presiona "Ejecutar".',
      kind: "info",
      timestamp: getCurrentTime(),
    },
  ]);

  const runProgramUseCase = useMemo(() => {
    return new RunProgramUseCase(new PseintProgramRunner());
  }, []);

  const handleRun = async () => {
    const result = await runProgramUseCase.execute(code);
    setConsoleLines(result.lines);
  };

  const handleClearConsole = () => {
    setConsoleLines([]);
  };

  return (
    <div className="app-shell">
      <Topbar onRun={handleRun} onClearConsole={handleClearConsole} />

      <main className="workspace">
        <EditorPane code={code} onChange={setCode} />
        <ConsolePane lines={consoleLines} />
      </main>
    </div>
  );
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("es-PE", {
    hour12: false,
  });
}