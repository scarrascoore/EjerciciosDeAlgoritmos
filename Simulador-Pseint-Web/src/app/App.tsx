import { useEffect, useMemo, useRef, useState } from "react";
import { RunProgramUseCase } from "../application/use-cases/RunProgramUseCase";
import type { ConsoleLine } from "../domain/models/ConsoleLine";
import { PseintProgramRunner } from "../infrastructure/execution/PseintProgramRunner";
import { clearEditorState, loadEditorState, saveEditorState } from "../shared/storage/editorPersistence";
import { extractProgramName } from "../shared/utils/programMetadata";
import { ConsolePane } from "../ui/components/ConsolePane";
import { EditorPane } from "../ui/components/EditorPane";
import { Topbar } from "../ui/components/Topbar";
import { ReactConsoleIO } from "../ui/runtime/ReactConsoleIO";

const initialCode = `Algoritmo MiPrimerPrograma
  Escribir "Hola mundo"
FinAlgoritmo`;

export default function App() {
  const restoredState = useMemo(() => loadEditorState(), []);
  const [code, setCode] = useState(restoredState?.code ?? initialCode);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([
    {
      id: crypto.randomUUID(),
      text: restoredState
        ? `Se restauró el archivo local: ${restoredState.programName}`
        : 'Simulador listo. Presiona "Ejecutar".',
      kind: "info",
      timestamp: getCurrentTime(),
    },
  ]);
  const [pendingVariable, setPendingVariable] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const runCounterRef = useRef(0);
  const activeRunIdRef = useRef<number | null>(null);
  const currentIoRef = useRef<ReactConsoleIO | null>(null);

  const runProgramUseCaseRef = useRef(
    new RunProgramUseCase(new PseintProgramRunner())
  );

  useEffect(() => {
    saveEditorState({
      code,
      programName: extractProgramName(code),
    });
  }, [code]);

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

  const handleNewFile = () => {
    if (isRunning) {
      return;
    }

    const newCode = `Algoritmo NuevoArchivo
  Escribir "Hola mundo"
FinAlgoritmo`;

    setCode(newCode);
    clearEditorState();
    saveEditorState({
      code: newCode,
      programName: extractProgramName(newCode),
    });

    setConsoleLines([
      {
        id: crypto.randomUUID(),
        text: "Nuevo archivo creado.",
        kind: "system",
        timestamp: getCurrentTime(),
      },
    ]);
    setInputValue("");
    setPendingVariable(null);
  };

  const handleExportFile = () => {
    if (isRunning) {
      return;
    }

    try {
      const programName = extractProgramName(code);
      const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${programName}.psc`;
      anchor.click();

      URL.revokeObjectURL(url);

      setConsoleLines((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          text: `Archivo exportado: ${programName}.psc`,
          kind: "system",
          timestamp: getCurrentTime(),
        },
      ]);
    } catch {
      setConsoleLines((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          text: "No se pudo exportar el archivo.",
          kind: "error",
          timestamp: getCurrentTime(),
        },
      ]);
    }
  };

  const handleImportFileClick = () => {
    if (isRunning) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();

      setCode(text);
      saveEditorState({
        code: text,
        programName: extractProgramName(text),
      });

      setConsoleLines((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          text: `Archivo importado: ${file.name}`,
          kind: "system",
          timestamp: getCurrentTime(),
        },
      ]);
    } catch {
      setConsoleLines((previous) => [
        ...previous,
        {
          id: crypto.randomUUID(),
          text: "No se pudo importar el archivo seleccionado.",
          kind: "error",
          timestamp: getCurrentTime(),
        },
      ]);
    } finally {
      event.target.value = "";
    }
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
        onNewFile={handleNewFile}
        onImportFile={handleImportFileClick}
        onExportFile={handleExportFile}
        isRunning={isRunning}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".psc,.txt"
        style={{ display: "none" }}
        onChange={handleImportFileChange}
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