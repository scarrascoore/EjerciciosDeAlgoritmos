import * as MonacoEditor from "monaco-editor";

const KEYWORDS = [
  "Algoritmo",
  "FinAlgoritmo",
  "Proceso",
  "FinProceso",
  "Definir",
  "Como",
  "Escribir",
  "Leer",
  "Si",
  "Entonces",
  "SiNo",
  "Sino",
  "FinSi",
  "Mientras",
  "Hacer",
  "FinMientras",
  "Para",
  "Hasta",
  "Con",
  "Paso",
  "FinPara",
  "Dimension",
  "Segun",
  "De",
  "Otro",
  "Modo",
  "FinSegun",
  "Repetir",
  "Que",
  "Verdadero",
  "Falso",
];

const BUILTIN_FUNCTIONS = [
  "Longitud",
  "Mayusculas",
  "Minusculas",
  "Subcadena",
  "Trunc",
  "Redon",
  "Azar",
  "ConvertirATexto",
  "ConvertirANumero",
];

let isRegistered = false;

export function registerPseintLanguage(
  monaco: typeof MonacoEditor
): void {
  if (isRegistered) {
    return;
  }

  isRegistered = true;

  monaco.languages.register({ id: "pseint" });

  monaco.languages.setMonarchTokensProvider(
    "pseint",
    {
      ignoreCase: true,
      keywords: KEYWORDS,
      builtins: BUILTIN_FUNCTIONS,
      operators: ["<-", "=", "<>", "<", ">", "<=", ">=", "+", "-", "*", "/", "%"],

      tokenizer: {
        root: [
          [/\/\/.*$/, "comment"],
          [/"([^"\\]|\\.)*$/, "string.invalid"],
          [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],

          [
            /\b(Algoritmo|FinAlgoritmo|Definir|Como|Escribir|Leer|Si|Entonces|SiNo|Sino|FinSi|Mientras|Hacer|FinMientras|Para|Hasta|Con|Paso|FinPara|Dimension|Segun|De|Otro|Modo|FinSegun|Repetir|Que|Verdadero|Falso)\b/i,
            "keyword",
          ],
          [
            /\b(Longitud|Mayusculas|Minusculas|Subcadena|Trunc|Redon|Azar|ConvertirATexto|ConvertirANumero)\b/i,
            "predefined",
          ],

          [/[a-zA-Z_]\w*/, "identifier"],
          [/\d+(\.\d+)?/, "number"],
          [/<-|<=|>=|<>|=|<|>|\+|-|\*|\/|%/, "operator"],
          [/\[|\]|\(|\)|,|:/, "delimiter"],
        ],

        string: [
          [/[^\\"]+/, "string"],
          [/\\./, "string.escape"],
          [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
        ],
      },
    } as MonacoEditor.languages.IMonarchLanguage
  );

  monaco.languages.setLanguageConfiguration("pseint", {
    comments: {
      lineComment: "//",
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: '"', close: '"' },
      { open: "(", close: ")" },
      { open: "[", close: "]" },
    ],
    surroundingPairs: [
      { open: '"', close: '"' },
      { open: "(", close: ")" },
      { open: "[", close: "]" },
    ],
  });

  monaco.languages.registerCompletionItemProvider("pseint", {
    provideCompletionItems: (
      model: MonacoEditor.editor.ITextModel,
      position: MonacoEditor.Position
    ) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions: MonacoEditor.languages.CompletionItem[] = [
        ...KEYWORDS.map((keyword) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          range,
        })),
        ...BUILTIN_FUNCTIONS.map((fn) => ({
          label: fn,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: fn,
          range,
        })),
        {
          label: "algoritmo_basico",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Plantilla básica de algoritmo",
          insertText: [
            "Algoritmo ${1:MiAlgoritmo}",
            "  ${2:Escribir \"Hola mundo\"}",
            "FinAlgoritmo",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: "si",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Estructura Si / SiNo / FinSi",
          insertText: [
            "Si ${1:condicion} Entonces",
            "  ${2:Escribir \"Verdadero\"}",
            "SiNo",
            "  ${3:Escribir \"Falso\"}",
            "FinSi",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: "mientras",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Estructura Mientras / FinMientras",
          insertText: [
            "Mientras ${1:condicion} Hacer",
            "  ${2:Escribir \"Iterando\"}",
            "FinMientras",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: "para",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Estructura Para / FinPara",
          insertText: [
            "Para ${1:i} <- ${2:1} Hasta ${3:10} Hacer",
            "  ${4:Escribir i}",
            "FinPara",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: "segun",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Estructura Segun / FinSegun",
          insertText: [
            "Segun ${1:opcion} Hacer",
            "  ${2:1}:",
            "    ${3:Escribir \"Uno\"}",
            "  De Otro Modo:",
            "    ${4:Escribir \"Otro\"}",
            "FinSegun",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
        {
          label: "repetir",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Estructura Repetir / Hasta Que",
          insertText: [
            "Repetir",
            "  ${1:Escribir \"Iteración\"}",
            "Hasta Que ${2:condicion}",
          ].join("\n"),
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
        },
      ];

      return { suggestions };
    },
  });

  monaco.editor.defineTheme("pseint-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "60A5FA", fontStyle: "bold" },
      { token: "predefined", foreground: "F59E0B" },
      { token: "string", foreground: "34D399" },
      { token: "number", foreground: "F472B6" },
      { token: "comment", foreground: "64748B", fontStyle: "italic" },
      { token: "operator", foreground: "E5E7EB" },
    ],
    colors: {
      "editor.background": "#0f172a",
      "editorLineNumber.foreground": "#64748b",
      "editorLineNumber.activeForeground": "#cbd5e1",
    },
  });
}