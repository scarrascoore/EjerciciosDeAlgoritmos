const procedureExercises = [
  {
    expression: '(2 + 3 > 4) AND (6 = 3 * 2)',
    steps: [
      { template: '(-) > 4  AND  6 = (-)', answers: ['5', '6'] },
      { template: '(-) AND (-)', answers: ['V', 'V'] },
      { template: '(-)', answers: ['V'] }
    ],
    review:
      'Primero resuelve las operaciones internas: 2 + 3 = 5 y 3 * 2 = 6. Después compara: 5 > 4 es Verdadero y 6 = 6 es Verdadero. Finalmente: Verdadero AND Verdadero = Verdadero.'
  },
  {
    expression: '(10 - 4 < 3) OR (8 / 2 = 4)',
    steps: [
      { template: '(-) < 3  OR  (-) = 4', answers: ['6', '4'] },
      { template: '(-) OR (-)', answers: ['F', 'V'] },
      { template: '(-)', answers: ['V'] }
    ],
    review:
      'Primero: 10 - 4 = 6 y 8 / 2 = 4. Luego compara: 6 < 3 es Falso y 4 = 4 es Verdadero. Al final: Falso OR Verdadero = Verdadero.'
  },
  {
    expression: 'NO(5 * 2 < 9)',
    steps: [
      { template: 'NO((-) < 9)', answers: ['10'] },
      { template: 'NO((-))', answers: ['F'] },
      { template: '(-)', answers: ['V'] }
    ],
    review:
      'Primero multiplica: 5 * 2 = 10. Luego compara: 10 < 9 es Falso. Finalmente aplica NO: NO(Falso) = Verdadero.'
  },
  {
    expression: '((7 - 2 = 5) AND (9 < 4)) OR (3 * 3 = 9)',
    steps: [
      { template: '((-) = 5  AND  9 < 4)  OR  (-) = 9', answers: ['5', '9'] },
      { template: '((-) AND (-)) OR (-)', answers: ['V', 'F', 'V'] },
      { template: '(-) OR (-)', answers: ['F', 'V'] },
      { template: '(-)', answers: ['V'] }
    ],
    review:
      'Resuelve primero las operaciones: 7 - 2 = 5 y 3 * 3 = 9. Después compara: 5 = 5 es Verdadero, 9 < 4 es Falso y 9 = 9 es Verdadero. Luego: Verdadero AND Falso = Falso. Finalmente: Falso OR Verdadero = Verdadero.'
  },
  {
    expression: '(12 / 3 >= 4) AND ((5 + 1 < 7) OR (8 - 3 = 10))',
    steps: [
      { template: '(-) >= 4  AND  ((-) < 7  OR  (-) = 10)', answers: ['4', '6', '5'] },
      { template: '(-) AND ((-) OR (-))', answers: ['V', 'V', 'F'] },
      { template: '(-) AND (-)', answers: ['V', 'V'] },
      { template: '(-)', answers: ['V'] }
    ],
    review:
      'Primero: 12 / 3 = 4, 5 + 1 = 6 y 8 - 3 = 5. Luego compara: 4 >= 4 es Verdadero, 6 < 7 es Verdadero y 5 = 10 es Falso. Dentro del segundo bloque: Verdadero OR Falso = Verdadero. Finalmente: Verdadero AND Verdadero = Verdadero.'
  },
  {
    expression: '((14 / 2 > 8) OR (3 + 5 = 9)) AND NO(6 < 2)',
    steps: [
      { template: '((-) > 8  OR  (-) = 9)  AND  NO(6 < 2)', answers: ['7', '8'] },
      { template: '((-) OR (-)) AND NO((-))', answers: ['F', 'F', 'F'] },
      { template: '(-) AND (-)', answers: ['F', 'V'] },
      { template: '(-)', answers: ['F'] }
    ],
    review:
      'Primero: 14 / 2 = 7 y 3 + 5 = 8. Luego compara: 7 > 8 es Falso, 8 = 9 es Falso y 6 < 2 es Falso. Entonces: Falso OR Falso = Falso. Después NO(Falso) = Verdadero. Finalmente: Falso AND Verdadero = Falso.'
  },
  {
    expression: '((18 / 3 = 6) AND (4 * 2 <> 9)) OR ((7 + 1 < 6) AND (10 >= 10))',
    steps: [
      { template: '((-) = 6  AND  (-) <> 9)  OR  ((-) < 6  AND  10 >= 10)', answers: ['6', '8', '8'] },
      { template: '((-) AND (-)) OR ((-) AND (-))', answers: ['V', 'V', 'F', 'V'] },
      { template: '(-) OR (-)', answers: ['V', 'F'] },
      { template: '(-)', answers: ['V'] }
    ],
    review:
      'Resuelve primero: 18 / 3 = 6, 4 * 2 = 8 y 7 + 1 = 8. Luego compara: 6 = 6 es Verdadero, 8 <> 9 es Verdadero, 8 < 6 es Falso y 10 >= 10 es Verdadero. Entonces: Verdadero AND Verdadero = Verdadero y Falso AND Verdadero = Falso. Finalmente: Verdadero OR Falso = Verdadero.'
  },
  {
    expression: 'NO((9 - 4 > 3) AND (2 * 5 = 10)) OR (15 / 3 < 4)',
    steps: [
      { template: 'NO((-) > 3  AND  (-) = 10)  OR  (-) < 4', answers: ['5', '10', '5'] },
      { template: 'NO((-) AND (-)) OR (-)', answers: ['V', 'V', 'F'] },
      { template: 'NO((-)) OR (-)', answers: ['V', 'F'] },
      { template: '(-) OR (-)', answers: ['F', 'F'] },
      { template: '(-)', answers: ['F'] }
    ],
    review:
      'Primero: 9 - 4 = 5, 2 * 5 = 10 y 15 / 3 = 5. Luego compara: 5 > 3 es Verdadero, 10 = 10 es Verdadero y 5 < 4 es Falso. Después: Verdadero AND Verdadero = Verdadero. Luego NO(Verdadero) = Falso. Finalmente: Falso OR Falso = Falso.'
  },
  {
    expression: '(((20 / 5 = 4) AND (3 + 6 > 10)) OR (14 - 8 <= 6)) AND NO(7 * 2 < 13)',
    steps: [
      { template: '(((-) = 4  AND  (-) > 10)  OR  (-) <= 6)  AND  NO((-) < 13)', answers: ['4', '9', '6', '14'] },
      { template: '(((-) AND (-)) OR (-)) AND NO((-))', answers: ['V', 'F', 'V', 'F'] },
      { template: '((-) OR (-)) AND (-)', answers: ['F', 'V', 'V'] },
      { template: '(-) AND (-)', answers: ['V', 'V'] },
      { template: '(-)', answers: ['V'] }
    ],
    review:
      'Resuelve primero: 20 / 5 = 4, 3 + 6 = 9, 14 - 8 = 6 y 7 * 2 = 14. Luego compara: 4 = 4 es Verdadero, 9 > 10 es Falso, 6 <= 6 es Verdadero y 14 < 13 es Falso. Después: Verdadero AND Falso = Falso. Luego: Falso OR Verdadero = Verdadero. También NO(Falso) = Verdadero. Finalmente: Verdadero AND Verdadero = Verdadero.'
  },
  {
    expression: '(((24 / 6 = 4) OR (7 + 2 < 8)) AND NO((3 * 3 = 9) AND (12 - 2 > 5))) OR ((8 <= 8) AND (14 / 7 <> 2))',
    steps: [
      { template: '(((-) = 4  OR  (-) < 8)  AND  NO((-) = 9  AND  (-) > 5))  OR  (8 <= 8  AND  (-) <> 2)', answers: ['4', '9', '9', '10', '2'] },
      { template: '(((-) OR (-)) AND NO((-) AND (-))) OR ((-) AND (-))', answers: ['V', 'F', 'V', 'V', 'V', 'F'] },
      { template: '((-) AND NO((-))) OR (-)', answers: ['V', 'V', 'F'] },
      { template: '((-) AND (-)) OR (-)', answers: ['V', 'F', 'F'] },
      { template: '(-) OR (-)', answers: ['F', 'F'] },
      { template: '(-)', answers: ['F'] }
    ],
    review:
      'Resuelve primero las operaciones: 24 / 6 = 4, 7 + 2 = 9, 3 * 3 = 9, 12 - 2 = 10 y 14 / 7 = 2. Luego compara: 4 = 4 es Verdadero, 9 < 8 es Falso, 9 = 9 es Verdadero, 10 > 5 es Verdadero, 8 <= 8 es Verdadero y 2 <> 2 es Falso. Después: Verdadero OR Falso = Verdadero. Dentro del NO: Verdadero AND Verdadero = Verdadero y por tanto NO(Verdadero) = Falso. Entonces: Verdadero AND Falso = Falso. En el bloque derecho: Verdadero AND Falso = Falso. Finalmente: Falso OR Falso = Falso.'
  }
];

const logicExercises = [
  {
    text: '(3 + 2 > 4) AND (8 = 4 * 2)',
    answer: 'V',
    solution:
      'Primero resuelve las operaciones: 3 + 2 = 5 y 4 * 2 = 8. Luego compara: 5 > 4 es Verdadero y 8 = 8 es Verdadero. Finalmente: Verdadero AND Verdadero = Verdadero.'
  },
  {
    text: '(9 - 5 < 2) OR (6 / 3 = 2)',
    answer: 'V',
    solution:
      'Primero: 9 - 5 = 4 y 6 / 3 = 2. Luego compara: 4 < 2 es Falso y 2 = 2 es Verdadero. Finalmente: Falso OR Verdadero = Verdadero.'
  },
  {
    text: 'NO(7 < 3)',
    answer: 'V',
    solution:
      'Compara primero: 7 < 3 es Falso. Luego aplica NO: NO(Falso) = Verdadero.'
  },
  {
    text: '((10 / 2 = 5) AND (4 + 1 > 8)) OR (6 <> 3)',
    answer: 'V',
    solution:
      'Primero: 10 / 2 = 5 y 4 + 1 = 5. Luego compara: 5 = 5 es Verdadero, 5 > 8 es Falso y 6 <> 3 es Verdadero. Después: Verdadero AND Falso = Falso. Finalmente: Falso OR Verdadero = Verdadero.'
  },
  {
    text: '(12 - 4 >= 8) AND ((3 * 3 = 9) OR (10 < 2))',
    answer: 'V',
    solution:
      'Primero: 12 - 4 = 8 y 3 * 3 = 9. Luego compara: 8 >= 8 es Verdadero, 9 = 9 es Verdadero y 10 < 2 es Falso. Dentro del segundo bloque: Verdadero OR Falso = Verdadero. Finalmente: Verdadero AND Verdadero = Verdadero.'
  },
  {
    text: '((15 / 5 > 4) OR (2 + 6 = 9)) AND NO(5 > 9)',
    answer: 'F',
    solution:
      'Primero: 15 / 5 = 3 y 2 + 6 = 8. Luego compara: 3 > 4 es Falso, 8 = 9 es Falso y 5 > 9 es Falso. Entonces: Falso OR Falso = Falso. Además NO(Falso) = Verdadero. Finalmente: Falso AND Verdadero = Falso.'
  },
  {
    text: '((18 / 6 = 3) AND (14 - 4 <= 9)) OR ((8 + 1 > 12) AND (7 = 7))',
    answer: 'F',
    solution:
      'Primero: 18 / 6 = 3, 14 - 4 = 10 y 8 + 1 = 9. Luego compara: 3 = 3 es Verdadero, 10 <= 9 es Falso, 9 > 12 es Falso y 7 = 7 es Verdadero. Entonces: Verdadero AND Falso = Falso y Falso AND Verdadero = Falso. Finalmente: Falso OR Falso = Falso.'
  },
  {
    text: 'NO((16 / 4 = 4) AND (5 + 5 > 8)) OR (21 / 7 < 2)',
    answer: 'F',
    solution:
      'Primero: 16 / 4 = 4, 5 + 5 = 10 y 21 / 7 = 3. Luego compara: 4 = 4 es Verdadero, 10 > 8 es Verdadero y 3 < 2 es Falso. Entonces: Verdadero AND Verdadero = Verdadero. Después NO(Verdadero) = Falso. Finalmente: Falso OR Falso = Falso.'
  },
  {
    text: '(((20 / 4 = 5) OR (9 - 1 < 6)) AND (3 * 4 <> 11)) AND NO(2 * 6 < 11)',
    answer: 'V',
    solution:
      'Primero: 20 / 4 = 5, 9 - 1 = 8, 3 * 4 = 12 y 2 * 6 = 12. Luego compara: 5 = 5 es Verdadero, 8 < 6 es Falso, 12 <> 11 es Verdadero y 12 < 11 es Falso. Entonces: Verdadero OR Falso = Verdadero. Después: Verdadero AND Verdadero = Verdadero. Además NO(Falso) = Verdadero. Finalmente: Verdadero AND Verdadero = Verdadero.'
  },
  {
    text: '(((30 / 5 = 6) AND (7 + 4 <= 10)) OR NO((8 * 2 = 16) AND (9 - 3 > 1))) AND ((14 / 2 = 7) OR (5 < 2))',
    answer: 'F',
    solution:
      'Primero: 30 / 5 = 6, 7 + 4 = 11, 8 * 2 = 16, 9 - 3 = 6 y 14 / 2 = 7. Luego compara: 6 = 6 es Verdadero, 11 <= 10 es Falso, 16 = 16 es Verdadero, 6 > 1 es Verdadero, 7 = 7 es Verdadero y 5 < 2 es Falso. Entonces: Verdadero AND Falso = Falso. Dentro del NO: Verdadero AND Verdadero = Verdadero y por tanto NO(Verdadero) = Falso. Así, el bloque izquierdo queda Falso OR Falso = Falso. El bloque derecho queda Verdadero OR Falso = Verdadero. Finalmente: Falso AND Verdadero = Falso.'
  }
];

const state = {
  procedureCorrect: new Array(procedureExercises.length).fill(false),
  logicCorrect: new Array(logicExercises.length).fill(false),
  reviewUnlocked: false
};

function injectDynamicStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .exercise-expression {
      margin-top: 8px;
      font-size: 18px;
      font-weight: 700;
      color: #25324a;
    }

    .step-area {
      margin-top: 16px;
      display: grid;
      gap: 10px;
    }

    .step-line {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 12px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px dashed #d5deeb;
      font-size: 17px;
      line-height: 1.6;
    }

    .step-label {
      min-width: 22px;
      font-weight: 700;
      color: #64748b;
    }

    .inline-answer {
      width: 74px;
      min-height: 38px;
      padding: 8px 10px;
      text-align: center;
      border: 2px solid #c8d0dc;
      border-radius: 10px;
      background: #fff;
      font-size: 18px;
      outline: none;
    }

    .inline-answer:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
    }

    .review-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
    }

    .mini-help {
      margin-top: 10px;
      color: #64748b;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);
}

function configurePageText() {
  document.title = 'Práctica de Procedimiento y Expresiones Lógicas';

  const heroTitle = document.querySelector('.hero h1');
  const heroText = document.querySelector('.hero p');
  const firstTitle = document.querySelector('#secuencias-section .section-title h2');
  const secondTitle = document.querySelector('#logicas-section .section-title h2');
  const reviewButton = document.getElementById('review-all-btn');

  heroTitle.textContent = 'Práctica de Procedimiento y Expresiones Lógicas';
  heroText.innerHTML =
    'En la primera parte completas el <strong>paso a paso</strong> de cada ejercicio. En la segunda respondes solo con <strong>V</strong> o <strong>F</strong>. El botón <strong>Revisar</strong> se habilita recién cuando presionas <strong>Revisar avance</strong>.';
  firstTitle.textContent = '1. Completa el procedimiento';
  secondTitle.textContent = '2. Expresiones Lógicas';
  reviewButton.textContent = 'Revisar avance';
}

const normalizeToken = (value) => {
  const raw = value.trim().toUpperCase().replace(/,/g, '.').replace(/\s+/g, '');
  if (raw === 'VERDADERO') return 'V';
  if (raw === 'FALSO') return 'F';
  return raw;
};

function updateSummary() {
  const totalCorrect = [...state.procedureCorrect, ...state.logicCorrect].filter(Boolean).length;
  const total = procedureExercises.length + logicExercises.length;
  const summary = document.getElementById('summary-text');
  summary.innerHTML = `Has resuelto <strong>${totalCorrect}</strong> de <strong>${total}</strong> ejercicios correctamente.`;
}

function buildTemplateInputs(template, cardPrefix, stepIndex) {
  let inputCount = 0;
  const parts = template.split('(-)');
  let html = `<div class="step-line"><span class="step-label">${stepIndex + 1}.</span>`;

  parts.forEach((part, index) => {
    html += `<span>${part}</span>`;
    if (index < parts.length - 1) {
      html += `<input class="inline-answer" type="text" autocomplete="off" data-step="${stepIndex}" data-blank="${inputCount}" id="${cardPrefix}-step-${stepIndex}-blank-${inputCount}" />`;
      inputCount += 1;
    }
  });

  html += `</div>`;
  return html;
}

function setInputState(input, isCorrect) {
  input.classList.remove('success', 'error');
  if (isCorrect) input.classList.add('success');
  else input.classList.add('error');
}

function createProcedureCard(exercise, index) {
  const card = document.createElement('article');
  card.className = 'exercise-card';

  const stepsHtml = exercise.steps
    .map((step, stepIndex) => buildTemplateInputs(step.template, `procedure-${index}`, stepIndex))
    .join('');

  card.innerHTML = `
    <div class="exercise-row">
      <div class="exercise-left">
        <div class="exercise-text">
          <span class="exercise-number">${index + 1}.</span>
          Completa las cajas para resolver correctamente.
        </div>
        <div class="exercise-expression">${exercise.expression}</div>
        <div class="step-area">${stepsHtml}</div>
        <div class="mini-help">Escribe números, operadores lógicos o V/F según corresponda.</div>
      </div>
      <div class="exercise-actions">
        <button type="button" class="btn-blue" id="procedure-btn-${index}">Confirmar</button>
        <button type="button" class="btn-light review-btn" id="procedure-review-${index}" disabled>Revisar</button>
        <div class="status-inline" id="procedure-status-${index}"></div>
      </div>
    </div>
    <div class="feedback" id="procedure-feedback-${index}"></div>
  `;

  const confirmButton = card.querySelector(`#procedure-btn-${index}`);
  const reviewButton = card.querySelector(`#procedure-review-${index}`);
  const status = card.querySelector(`#procedure-status-${index}`);
  const feedback = card.querySelector(`#procedure-feedback-${index}`);
  const inputs = [...card.querySelectorAll('.inline-answer')];

  function checkProcedure() {
    let allCorrect = true;

    exercise.steps.forEach((step, stepIndex) => {
      step.answers.forEach((answer, blankIndex) => {
        const input = card.querySelector(`#procedure-${index}-step-${stepIndex}-blank-${blankIndex}`);
        const expected = normalizeToken(answer);
        const received = normalizeToken(input.value);
        const isCorrect = received === expected;
        setInputState(input, isCorrect);
        if (!isCorrect) allCorrect = false;
      });
    });

    status.className = 'status-inline';
    feedback.className = 'feedback show';

    if (allCorrect) {
      status.classList.add('success');
      status.textContent = '¡Correcto! ✨';
      feedback.classList.add('success');
      feedback.innerHTML = '<strong>Procedimiento correcto.</strong>Completaste todos los pasos en el orden esperado.';
      state.procedureCorrect[index] = true;
    } else {
      status.classList.add('error');
      status.textContent = 'Hay casillas por corregir';
      feedback.classList.add('error');
      feedback.innerHTML = state.reviewUnlocked
        ? '<strong>Respuesta incorrecta.</strong>Las cajas en rojo necesitan corrección. Ya puedes usar el botón <strong>Revisar</strong> para ver la guía paso a paso.'
        : '<strong>Respuesta incorrecta.</strong>Las cajas en rojo necesitan corrección. Presiona <strong>Revisar avance</strong> para habilitar la revisión guiada.';
      state.procedureCorrect[index] = false;
    }

    updateSummary();
  }

  function showReview() {
    feedback.className = 'feedback show error';
    feedback.innerHTML = `<strong>Guía de resolución.</strong><hr><div>${exercise.review}</div>`;
  }

  confirmButton.addEventListener('click', checkProcedure);
  reviewButton.addEventListener('click', showReview);
  inputs.forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') checkProcedure();
    });
  });

  return card;
}

function createLogicCard(exercise, index) {
  const card = document.createElement('article');
  card.className = 'exercise-card';
  card.innerHTML = `
    <div class="exercise-row">
      <div class="exercise-left">
        <div class="exercise-text">
          <span class="exercise-number">${index + 1}.</span>
          ${exercise.text}
        </div>
      </div>
      <div class="exercise-actions">
        <input
          class="answer-input"
          id="logic-input-${index}"
          type="text"
          maxlength="10"
          autocomplete="off"
          aria-label="Respuesta lógica ${index + 1}"
        />
        <button type="button" class="btn-purple" id="logic-btn-${index}">Confirmar</button>
        <button type="button" class="btn-light review-btn" id="logic-review-${index}" disabled>Revisar</button>
      </div>
    </div>
    <div class="feedback" id="logic-feedback-${index}"></div>
  `;

  const input = card.querySelector(`#logic-input-${index}`);
  const confirmButton = card.querySelector(`#logic-btn-${index}`);
  const reviewButton = card.querySelector(`#logic-review-${index}`);
  const feedback = card.querySelector(`#logic-feedback-${index}`);

  function checkLogic() {
    const expected = normalizeToken(exercise.answer);
    const received = normalizeToken(input.value);
    const isCorrect = received === expected;

    input.classList.remove('success', 'error');
    feedback.className = 'feedback show';

    if (isCorrect) {
      input.classList.add('success');
      feedback.classList.add('success');
      feedback.innerHTML = `<strong>¡Respuesta correcta!</strong>El resultado de la expresión es <strong>${expected}</strong>.`;
      state.logicCorrect[index] = true;
    } else {
      input.classList.add('error');
      feedback.classList.add('error');
      feedback.innerHTML = state.reviewUnlocked
        ? '<strong>Respuesta incorrecta.</strong>Puedes usar el botón <strong>Revisar</strong> para ver la resolución explicada.'
        : '<strong>Respuesta incorrecta.</strong>Presiona <strong>Revisar avance</strong> para habilitar el botón <strong>Revisar</strong>.';
      state.logicCorrect[index] = false;
    }

    updateSummary();
  }

  function showReview() {
    feedback.className = 'feedback show error';
    feedback.innerHTML = `<strong>Guía de resolución.</strong><hr><div>${exercise.solution}</div>`;
  }

  confirmButton.addEventListener('click', checkLogic);
  reviewButton.addEventListener('click', showReview);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') checkLogic();
  });

  return card;
}

function renderExercises() {
  const procedureList = document.getElementById('sequence-list');
  const logicList = document.getElementById('logic-list');

  procedureList.innerHTML = '';
  logicList.innerHTML = '';

  procedureExercises.forEach((exercise, index) => {
    procedureList.appendChild(createProcedureCard(exercise, index));
  });

  logicExercises.forEach((exercise, index) => {
    logicList.appendChild(createLogicCard(exercise, index));
  });

  updateSummary();
}

function unlockReviews() {
  state.reviewUnlocked = true;
  document.querySelectorAll('.review-btn').forEach((button) => {
    button.disabled = false;
  });

  const totalCorrect = [...state.procedureCorrect, ...state.logicCorrect].filter(Boolean).length;
  const total = procedureExercises.length + logicExercises.length;
  alert(`Llevas ${totalCorrect} de ${total} ejercicios correctos. Ya se habilitó el botón Revisar en todos los ejercicios.`);
}

function resetAll() {
  state.procedureCorrect.fill(false);
  state.logicCorrect.fill(false);
  state.reviewUnlocked = false;
  renderExercises();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

injectDynamicStyles();
configurePageText();
renderExercises();

document.getElementById('review-all-btn').addEventListener('click', unlockReviews);
document.getElementById('reset-btn').addEventListener('click', resetAll);