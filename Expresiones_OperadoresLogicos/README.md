# EXPRESIONES

## Definición:

Se le define asi al grupo de constantes, variables y operadores.

> [!IMPORTANT]
> Para comprender mejor los temas y resolución de problemas de expresiones lógicas es recomendable revisar la teoría de **Operadores Logicos** y **Tablas de verdad**. En programación usamos lo mas común para realizar los ejercicios **NOT**, **AND** y **OR**

**_Ejemplo:_**

(( 7 + 2 / 5 > 2 + 5 * 9 ) AND ( 5 * 3 > 25)) OR ( 9 * 2  = 2 * 8 )

# OPERADORES

## Definición:

Son todos aquellos simbolos que utilizaremos para crear las expresiones logicas

### Tipos de operadores

<table border="0">
  <tr> 
    <th align= "center">OPERADOR</th>
    <th align= "center">ACCION</th>
    <th align= "center">Expresión</th>
    <th align= "center">Resultado</th>
    <th align= "center">Observación</th>
  </tr>

  <tr>
    <td align= "center">*</td> 
    <td align= "center">Multiplicación</td>
    <td align= "center"> 7 * 2 </td>
    <td align= "center">14</td>
    <td> </td>
  </tr>

  <tr>
    <td align= "center">/</td> 
    <td align= "center"> División Real</td>
    <td align= "center"> 7 / 2 </td>
    <td align= "center">3.5</td>
    <td align= "center">Se obtiene el cociente incluyendo los decimales</td>
  </tr>

  <tr>
    <td align= "center">\</td> 
    <td align= "center">División Entera</td>
    <td align= "center"> 7 \ 2 </td>
    <td align= "center">3</td>
    <td align= "center">Se obtiene la parte entera del cociente</td>
  </tr>  
  
  <tr>
    <td align= "center">MOD</td> 
    <td align= "center">Residuo de división</td>
    <td align= "center"> 7 MOD 2 </td>
    <td align= "center">1</td>
    <td align= "center">Se obtiene el residuo de la division</td>
  </tr>

  <tr>
    <td align= "center">+</td> 
    <td align= "center">Adición</td>
    <td align= "center"> 7 + 2 </td>
    <td align= "center">9</td>
    <td></td>
  </tr>  
  
  <tr>
    <td align= "center">-</td> 
    <td align= "center">Sustracción</td>
    <td align= "center"> 7 - 5 </td>
    <td align= "center">5</td>
    <td></td>
  </tr> 
  
  <tr>
    <td align= "center">↑</td> 
    <td align= "center">Potenciación</td>
    <td align= "center"> 7 ↑ 2 </td>
    <td align= "center">49</td>
    <td></td>
  </tr>  
</table>

---

## Operadores relacionales y Operadores lógicos

<table>
  <tr>
    <th colspan="4">OPERADORES RELACIONALES</th>
    <td>
    <th colspan="4">OPERADORES LÓGICOS</th>
  </td>
  </tr>

<tr>
<th align="center">Operador</th>
<th align="center">Acción</th>
<th align="center">Java | Javascript | C++ | C#</th>
<th align="center">Visual Basic | SQL </th>
    <td>
        <th align="center">Operador</th>
        <th align="center">Acción</th>      
        <th align="center">Java | Javascript | C++ | C# </th>
        <th align="center">Visual Basic | SQL </th>
    </td>

</tr>
<tr>
    <td align="center"> > </td>
    <td align="center"> Mayor que </td>
    <td align="center"> > </td>
    <td align="center"> > </td>
    <td>
        <td align="center">AND</td>
        <td align="center">Conjunción</td>
        <td align="center">&&</td>
        <td align="center">AND</td>
    </td>
</tr>
<tr>
    <td align="center"><</td>
    <td align="center">Menor que</td>
        <td align="center"> < </td>
    <td align="center"> < </td>
    <td>
        <td align="center">OR</td>
        <td align="center">Disyunción</td>
        <td align="center">||</td>
        <td align="center">OR</td>
    </td>
</tr>
<tr>
    <td align="center">=</td>
    <td align="center">Igual a</td>
        <td align="center"> == </td>
    <td align="center"> = </td>
    <td>
        <td align="center">NOT</td>
        <td align="center">Negación</td>
        <td align="center">!</td>
        <td align="center">NOT</td>
    </td>
</tr>
<tr>
    <td align="center"><></td>
    <td align="center">Diferente a</td>
    <td align="center"> != </td>
    <td align="center"> <> </td>
    <td>
        <td colspan="4"></td>
    </td>
</tr>
<tr>
    <td align="center">>=</td>
    <td align="center">Mayor o igual a</td>
        <td align="center"> >= </td>
    <td align="center"> >= </td>
    <td>
        <td colspan="4"></td>
    </td>
</tr>
<tr>
    <td align="center"><=</td>
    <td align="center">Menor o igual a</td>
        <td align="center"> <= </td>
    <td align="center"> <= </td>
    <td>
        <td colspan="4"></td>
    </td>
</tr>
</table>

---

## Tabla de verdad de operadores lógicos

<table>
    <tr>
        <th align="center">P</th>
        <th align="center">Q</th>
        <th align="center">P v Q</th>
        <th align="center">P ^ Q</th>
        <th colspan="4">~P</th>    
    </tr>
    <tr>
        <td align="center">V</td>
        <td align="center">V</td>
        <td align="center">V</td>
        <td align="center">V</td>
        <td align="center">F</td>
    </tr>
    <tr>
        <td align="center">V</td>
        <td align="center">F</td>
        <td align="center">V</td>
        <td align="center">F</td>
        <td align="center">F</td>
    </tr>
    <tr>
        <td align="center">F</td>
        <td align="center">V</td>
        <td align="center">V</td>
        <td align="center">F</td>
        <td align="center">V</td>
    </tr>
    <tr>
        <td align="center">F</td>
        <td align="center">F</td>
        <td align="center">F</td>
        <td align="center">F</td>
        <td align="center">V</td>
    </tr>
</table>

---

# Prioridad de los operadores
### 1. Paréntesis ( )
### 2. Potenciación ( ↑ ) 
### 3. Multiplicación ( * ) y división real ( / )
### 4. División entera ( \ ) y Operación módulo ( MOD )
### 5. Adición ( + ) y Sustracción ( - )
### 3. Operadores relacionales
### 4. NOT
### 5. AND
### 6. OR

> [!IMPORTANT]
> Las expresiones lógicas se ejecutan siempre de izquierda a derecha en caso se encuentren más de dos operadores similares.

_**Ejemplo**_

Ejemplo 1: 

5 + <u>2 * 9</u> / 3 * 2 - 6
<br>
5 + <u>18 / 3</u> * 2 - 6
<br>
5 + <u>6 * 2</u> - 6
<br>
<u>5 + 12</u> - 6
<br>
<u>17 - 6</u>
<br>
11

Ejemplo 2: 

2 + 5 < 9 AND 4 = 2 * 4 - 3
<br>
7 < 9 AND 4 = 8 - 3
<br>
7 < 9 AND 4 = 5
<br>
V AND F
<br>
F

Ejemplo 3: 

3 * 10 \ 9 > 2 * 4 - 3
<br>
30 \ 9 > 8 - 3
<br>
3 > 5
<br>
F

