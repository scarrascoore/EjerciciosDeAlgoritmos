import { useCallback, useMemo, useState } from "react";
import { RunProgramUseCase } from "../application/use-cases/RunProgramUseCase";
import type { ConsoleLine } from "../domain/models/ConsoleLine";
import { PseintProgramRunner } from "../infrastructure/execution/PseintProgramRunner";
import { defaultProgram } from "../shared/constants/defaultProgram";
import { ConsolePane } from "../ui/components/ConsolePane";
import { EditorPane } from "../ui/components/EditorPane";
import { Topbar } from "../ui/components/Topbar";
import { ReactConsoleIO } from "../ui/runtime/ReactConsoleIO";

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
  const [pendingVariable, setPendingVariable] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const appendLine = useCallback((line: ConsoleLine) => {
    setConsoleLines((previous) => [...previous, line]);
  }, []);

  const io = useMemo(() => {
    return new ReactConsoleIO({
      appendLine,
      setPendingVariable,
    });
  }, [appendLine]);

  const runProgramUseCase = useMemo(() => {
    return new RunProgramUseCase(new PseintProgramRunner());
  }, []);

  const handleRun = async () => {
    if (isRunning) {
      return;
    }

    setConsoleLines([]);
    setInputValue("");
    setPendingVariable(null);
    setIsRunning(true);

    try {
      await runProgramUseCase.execute(code, io);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearConsole = () => {
    if (isRunning) {
      return;
    }

    setConsoleLines([]);
    setInputValue("");
    setPendingVariable(null);
  };

  const handleSubmitInput = () => {
    io.submitInput(inputValue);
    setInputValue("");
  };

  return (
    <div className="app-shell">
      <Topbar
        onRun={handleRun}
        onClearConsole={handleClearConsole}
        isRunning={isRunning}
      />

      <main className="workspace">
        <EditorPane code={code} onChange={setCode} />
        <ConsolePane
          lines={consoleLines}
          pendingVariable={pendingVariable}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmitInput={handleSubmitInput}
        />
      </main>
    </div>
  );
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString("es-PE", {
    hour12: false,
  });
}