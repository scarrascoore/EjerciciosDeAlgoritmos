import { useCallback, useMemo, useState } from "react";
import { RunProgramUseCase } from "../application/use-cases/RunProgramUseCase";
import type { ConsoleLine } from "../domain/models/ConsoleLine";
import { PseintProgramRunner } from "../infrastructure/execution/PseintProgramRunner";
import { editorExamples } from "../shared/examples/editorExamples";

import { ConsolePane } from "../ui/components/ConsolePane";
import { EditorPane } from "../ui/components/EditorPane";
import { Topbar } from "../ui/components/Topbar";
import { ReactConsoleIO } from "../ui/runtime/ReactConsoleIO";

const defaultExample = editorExamples[0];

export default function App() {
  const [selectedExampleId, setSelectedExampleId] = useState(defaultExample.id);
  const [code, setCode] = useState(defaultExample.code);
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

  const errorLine = useMemo(() => {
    const lastError = [...consoleLines]
      .reverse()
      .find((line) => line.kind === "error");

    if (!lastError) {
      return null;
    }

    const match = lastError.text.match(/\[Línea\s+(\d+)\]/i);
    return match ? Number(match[1]) : null;
  }, [consoleLines]);

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

  const handleClearEditor = () => {
    if (isRunning) {
      return;
    }

    setCode("");
    setSelectedExampleId("");
  };

  const handleLoadExample = (exampleId: string) => {
    if (isRunning) {
      return;
    }

    const example = editorExamples.find((item) => item.id === exampleId);

    if (!example) {
      return;
    }

    setSelectedExampleId(example.id);
    setCode(example.code);
    setConsoleLines([
      {
        id: crypto.randomUUID(),
        text: `Ejemplo cargado: ${example.label}`,
        kind: "system",
        timestamp: getCurrentTime(),
      },
    ]);
    setPendingVariable(null);
    setInputValue("");
  };

  const handleSubmitInput = () => {
    io.submitInput(inputValue);
    setInputValue("");
  };

  const handleCodeChange = (value: string) => {
    setCode(value);

    const exactMatch = editorExamples.find((example) => example.code === value);
    setSelectedExampleId(exactMatch?.id ?? "");
  };

  return (
    <div className="app-shell">
      <Topbar
        onRun={handleRun}
        onClearConsole={handleClearConsole}
        onClearEditor={handleClearEditor}
        onLoadExample={handleLoadExample}
        isRunning={isRunning}
        selectedExampleId={selectedExampleId}
        examples={editorExamples}
      />

      <main className="workspace">
        <EditorPane
          code={code}
          onChange={handleCodeChange}
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