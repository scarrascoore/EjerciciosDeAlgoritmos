export interface PreloadedExample {
  id: string;
  name: string;
  code: string;
}

export const preloadedExamples: PreloadedExample[] = [
  {
    id: "base",
    name: "EjemploBase",
    code: `Algoritmo EjemploBase
  Escribir "Hola mundo"
FinAlgoritmo`,
  },
  {
    id: "si",
    name: "EjemploSi",
    code: `Algoritmo EjemploSi
  Definir edad Como Entero
  edad = 20

  Si edad >= 18 Entonces
    Escribir "Mayor de edad"
  SiNo
    Escribir "Menor de edad"
  FinSi
FinAlgoritmo`,
  },
  {
    id: "para",
    name: "EjemploPara",
    code: `Algoritmo EjemploPara
  Para i = 1 Hasta 5 Hacer
    Escribir i
  FinPara
FinAlgoritmo`,
  },
];