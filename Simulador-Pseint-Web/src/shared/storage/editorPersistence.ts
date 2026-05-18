const STORAGE_KEYS = {
  code: "simulador_pseint_code",
  programName: "simulador_pseint_program_name",
};

export interface PersistedEditorState {
  code: string;
  programName: string;
}

export function saveEditorState(state: PersistedEditorState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.code, state.code);
    localStorage.setItem(STORAGE_KEYS.programName, state.programName);
  } catch (error) {
    console.warn("No se pudo guardar el estado del editor en localStorage.", error);
  }
}

export function loadEditorState(): PersistedEditorState | null {
  try {
    const code = localStorage.getItem(STORAGE_KEYS.code);
    const programName = localStorage.getItem(STORAGE_KEYS.programName);

    if (!code) {
      return null;
    }

    return {
      code,
      programName: programName ?? "SinNombre",
    };
  } catch (error) {
    console.warn("No se pudo recuperar el estado del editor desde localStorage.", error);
    return null;
  }
}

export function clearEditorState(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.code);
    localStorage.removeItem(STORAGE_KEYS.programName);
  } catch (error) {
    console.warn("No se pudo limpiar el estado del editor en localStorage.", error);
  }
}