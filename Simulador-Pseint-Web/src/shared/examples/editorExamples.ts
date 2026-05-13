export interface EditorExample {
  id: string;
  label: string;
  code: string;
}

export const editorExamples: EditorExample[] = [
  {
    id: "default",
    label: "Ejemplo base",
    code: `Algoritmo MiPrimerPrograma
  Escribir "Hola mundo"
FinAlgoritmo`,
  },
  {
    id: "si",
    label: "Condicional Si",
    code: `Algoritmo ValidarEdad
  Definir edad Como Entero
  edad <- 20

  Si edad >= 18 Entonces
    Escribir "Mayor de edad"
  SiNo
    Escribir "Menor de edad"
  FinSi
FinAlgoritmo`,
  },
  {
    id: "para",
    label: "Ciclo Para",
    code: `Algoritmo Contador
  Para i <- 1 Hasta 5 Hacer
    Escribir i
  FinPara
FinAlgoritmo`,
  },
  {
    id: "segun",
    label: "Segun",
    code: `Algoritmo OpcionMenu
  Definir opcion Como Entero
  opcion <- 2

  Segun opcion Hacer
    1:
      Escribir "Uno"
    2:
      Escribir "Dos"
    De Otro Modo:
      Escribir "Otro"
  FinSegun
FinAlgoritmo`,
  },
  {
    id: "matriz",
    label: "Matriz",
    code: `Algoritmo MatrizBasica
  Definir tabla Como Entero
  Dimension tabla[2,2]

  tabla[1,1] <- 10
  tabla[1,2] <- 20
  tabla[2,1] <- 30
  tabla[2,2] <- 40

  Escribir tabla[2,2]
FinAlgoritmo`,
  },
];