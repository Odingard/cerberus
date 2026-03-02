/**
 * Demo UI — renders the Lethal Trifecta attack simulation.
 * Pure DOM manipulation, no framework dependencies.
 */

import './styles.css';
import { createSimulation } from './demo.js';
import type { SimulationStep } from './demo.js';

// ── State ──────────────────────────────────────────────────────────

let running = false;
let riskVector = [false, false, false, false]; // L1, L2, L3, L4
let currentScore = 0;
let currentAction = 'none';

// ── DOM refs ───────────────────────────────────────────────────────

const stepsContainer = document.getElementById('steps')!;
const btnRun = document.getElementById('btn-run') as HTMLButtonElement;
const btnReset = document.getElementById('btn-reset') as HTMLButtonElement;
const scoreValue = document.getElementById('score-value')!;
const scoreFill = document.getElementById('score-fill')!;
const actionDisplay = document.getElementById('action-display')!;

const riskCells = [
  document.getElementById('risk-l1')!,
  document.getElementById('risk-l2')!,
  document.getElementById('risk-l3')!,
  document.getElementById('risk-l4')!,
];

const riskValues = [
  document.getElementById('risk-l1-val')!,
  document.getElementById('risk-l2-val')!,
  document.getElementById('risk-l3-val')!,
  document.getElementById('risk-l4-val')!,
];

// ── Rendering ──────────────────────────────────────────────────────

function updateRiskDisplay(): void {
  for (let i = 0; i < 4; i++) {
    const active = riskVector[i];
    const layers = ['l1', 'l2', 'l3', 'l4'];
    riskCells[i].className = `risk-cell ${active ? `active-${layers[i]}` : 'inactive'}`;
    riskValues[i].textContent = active ? '1' : '0';
  }

  scoreValue.textContent = `${currentScore}/4`;
  scoreFill.className = `score-fill score-${currentScore}`;

  actionDisplay.textContent = currentAction === 'none'
    ? 'Waiting...'
    : currentAction.toUpperCase();
  actionDisplay.className = `action-display action-${currentAction}`;
}

function createStepElement(step: SimulationStep, index: number): HTMLElement {
  const el = document.createElement('div');
  el.className = `step ${step.layer.toLowerCase()} ${step.blocked ? 'blocked' : ''}`;

  const layerBadge = step.blocked
    ? '<span class="badge badge-blocked">BLOCKED</span>'
    : `<span class="badge badge-${step.layer.toLowerCase()}">${step.layer} detected</span>`;

  // Truncate long results for display
  let displayResult = step.result;
  if (displayResult.length > 300) {
    displayResult = displayResult.substring(0, 300) + '...';
  }

  el.innerHTML = `
    <div class="step-header">
      <span class="step-number">${index + 1}</span>
      <span class="step-tool">${step.toolName}()</span>
      ${layerBadge}
    </div>
    <div class="step-desc">${step.description}</div>
    <div class="step-result">${escapeHtml(displayResult)}</div>
  `;

  return el;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resetUI(): void {
  stepsContainer.innerHTML = '<div class="empty-state">Click "Run Attack" to start the simulation</div>';
  riskVector = [false, false, false, false];
  currentScore = 0;
  currentAction = 'none';
  updateRiskDisplay();
  btnRun.disabled = false;
  btnReset.disabled = true;
}

// ── Simulation runner ──────────────────────────────────────────────

async function runSimulation(): Promise<void> {
  if (running) return;
  running = true;
  btnRun.disabled = true;
  btnReset.disabled = true;

  stepsContainer.innerHTML = '';
  riskVector = [false, false, false, false];
  currentScore = 0;
  currentAction = 'none';
  updateRiskDisplay();

  const { run } = createSimulation();

  await run(async (step: SimulationStep, index: number) => {
    // Update risk vector based on layer
    if (step.layer === 'L1') riskVector[0] = true;
    if (step.layer === 'L2') riskVector[1] = true;
    if (step.layer === 'L3') riskVector[2] = true;

    currentScore = step.assessment?.score ?? currentScore;
    currentAction = step.assessment?.action ?? currentAction;

    // Add step with animation delay
    await sleep(index === 0 ? 500 : 1200);

    const el = createStepElement(step, index);
    stepsContainer.appendChild(el);

    // Trigger animation
    requestAnimationFrame(() => {
      el.classList.add('visible');
    });

    updateRiskDisplay();

    // Extra pause after the blocked step for dramatic effect
    if (step.blocked) {
      await sleep(300);
    }
  });

  running = false;
  btnRun.disabled = true;
  btnReset.disabled = false;
}

// ── Event listeners ────────────────────────────────────────────────

btnRun.addEventListener('click', () => {
  void runSimulation();
});

btnReset.addEventListener('click', () => {
  resetUI();
});

// ── Initial state ──────────────────────────────────────────────────
updateRiskDisplay();
