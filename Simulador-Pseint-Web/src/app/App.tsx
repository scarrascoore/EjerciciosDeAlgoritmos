import { useRef, useState } from "react";
import { RunProgramUseCase } from "../application/use-cases/RunProgramUseCase";
import type { ConsoleLine } from "../domain/models/ConsoleLine";
import { PseintProgramRunner } from "../infrastructure/execution/PseintProgramRunner";
import { ConsolePane } from "../ui/components/ConsolePane";
import { EditorPane } from "../ui/components/EditorPane";
import { Topbar } from "../ui/components/Topbar";
import { ReactConsoleIO } from "../ui/runtime/ReactConsoleIO";

const initialCode = `Algoritmo MiPrimerPrograma
  Escribir "Hola mundo"
FinAlgoritmo`;

export default function App() {
  const [code, setCode] = useState(initialCode);
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

  const runCounterRef = useRef(0);
  const activeRunIdRef = useRef<number | null>(null);
  const currentIoRef = useRef<ReactConsoleIO | null>(null);

  const runProgramUseCaseRef = useRef(
    new RunProgramUseCase(new PseintProgramRunner())
  );

  const errorLine = (() => {
    const lastError = [...consoleLines]
      .reverse()
      .find((line) => line.kind === "error");

    if (!lastError) {
      return null;
    }

    const match = lastError.text.match(/\[Línea\s+(\d+)\]/i);
    return match ? Number(match[1]) : null;
  })();

  const handleRun = async () => {
    if (isRunning) {
      return;
    }

    setConsoleLines([]);
    setInputValue("");
    setPendingVariable(null);
    setIsRunning(true);

    const runId = ++runCounterRef.current;
    activeRunIdRef.current = runId;

    const io = new ReactConsoleIO({
      appendLine: (line) => {
        if (activeRunIdRef.current !== runId) {
          return;
        }

        setConsoleLines((previous) => [...previous, line]);
      },
      setPendingVariable: (value) => {
        if (activeRunIdRef.current !== runId) {
          return;
        }

        setPendingVariable(value);
      },
      shouldAcceptIO: () => activeRunIdRef.current === runId,
    });

    currentIoRef.current = io;

    try {
      await runProgramUseCaseRef.current.execute(code, io);
    } finally {
      if (activeRunIdRef.current === runId) {
        activeRunIdRef.current = null;
        currentIoRef.current = null;
        setPendingVariable(null);
        setIsRunning(false);
      }
    }
  };

  const handleStop = () => {
    if (!isRunning) {
      return;
    }

    currentIoRef.current?.stop();
    activeRunIdRef.current = null;
    currentIoRef.current = null;
    setPendingVariable(null);
    setInputValue("");
    setIsRunning(false);

    setConsoleLines((previous) => [
      ...previous,
      {
        id: crypto.randomUUID(),
        text: "Ejecución detenida por el usuario.",
        kind: "error",
        timestamp: getCurrentTime(),
      },
    ]);
  };

  const handleClearConsole = () => {
    if (isRunning) {
      return;
    }

    setConsoleLines([]);
    setInputValue("");
    setPendingVariable(null);
  };

  const handleClearEditor = () => {
    if (isRunning) {
      return;
    }

    setCode("");
  };

  const handleSubmitInput = () => {
    currentIoRef.current?.submitInput(inputValue);
    setInputValue("");
  };

  return (
    <div className="app-shell">
      <Topbar
        onRun={handleRun}
        onStop={handleStop}
        onClearConsole={handleClearConsole}
        onClearEditor={handleClearEditor}
        isRunning={isRunning}
      />

      <main className="workspace">
        <EditorPane
          code={code}
          onChange={setCode}
          errorLine={errorLine}
        />
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