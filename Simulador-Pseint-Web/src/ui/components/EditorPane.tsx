import Editor, { type Monaco } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { registerPseintLanguage } from "../monaco/pseintLanguage";

interface EditorPaneProps {
  code: string;
  onChange: (value: string) => void;
  errorLine: number | null;
}

export function EditorPane({ code, onChange, errorLine }: EditorPaneProps) {
  const editorRef =
    useRef<import("monaco-editor").editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleBeforeMount = (monaco: Monaco) => {
    registerPseintLanguage(monaco);
  };

  const handleMount = (
    editor: import("monaco-editor").editor.IStandaloneCodeEditor
  ) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      errorLine
        ? [
            {
              range: {
                startLineNumber: errorLine,
                startColumn: 1,
                endLineNumber: errorLine,
                endColumn: 1,
              },
              options: {
                isWholeLine: true,
                className: "editor-error-line",
                glyphMarginClassName: "editor-error-glyph",
                glyphMarginHoverMessage: {
                  value: "Línea con error detectado",
                },
              },
            },
          ]
        : []
    );

    if (errorLine) {
      editor.revealLineInCenter(errorLine);
    }
  }, [errorLine]);

  return (
    <section className="pane pane--editor">
      <div className="pane__header">
        <span className="pane__label">EDITOR DE PSEUDOCÓDIGO</span>
        {errorLine && (
          <span className="pane__meta pane__meta--error">
            Error en línea {errorLine}
          </span>
        )}
      </div>

      <div className="pane__body">
        <Editor
          height="100%"
          language="pseint"
          theme="pseint-dark"
          value={code}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={(value) => onChange(value ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 16 },
            lineNumbers: "on",
            glyphMargin: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            snippetSuggestions: "top",
          }}
        />
      </div>
    </section>
  );
}