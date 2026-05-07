import { useEffect, useRef } from "react";
import type { ConsoleLine } from "../../domain/models/ConsoleLine";

interface ConsolePaneProps {
  lines: ConsoleLine[];
  pendingVariable: string | null;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmitInput: () => void;
}

export function ConsolePane({
  lines,
  pendingVariable,
  inputValue,
  onInputChange,
  onSubmitInput,
}: ConsolePaneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const consoleBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (pendingVariable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [pendingVariable]);

  useEffect(() => {
    if (consoleBodyRef.current) {
      consoleBodyRef.current.scrollTop = consoleBodyRef.current.scrollHeight;
    }
  }, [lines, pendingVariable]);

  return (
    <section className="pane pane--console">
      <div className="pane__header">
        <span className="pane__label">CONSOLA DE SALIDA</span>
      </div>

      <div className="console" ref={consoleBodyRef}>
        {lines.length === 0 ? (
          <div className="console__empty">
            La consola está vacía. Presiona "Ejecutar".
          </div>
        ) : (
          lines.map((line) => (
            <div
              key={line.id}
              className={`console__line console__line--${line.kind}`}
            >
              {line.timestamp && (
                <span className="console__timestamp">[{line.timestamp}]</span>
              )}
              <span>{line.text}</span>
            </div>
          ))
        )}

        {pendingVariable && (
          <form
            className="console__inputRow"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmitInput();
            }}
          >
            <span className="console__prompt">{pendingVariable}:</span>
            <input
              ref={inputRef}
              className="console__input"
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button className="console__send" type="submit">
              Enviar
            </button>
          </form>
        )}
      </div>
    </section>
  );
}