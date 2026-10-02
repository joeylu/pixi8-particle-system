import { VERSION } from 'pixi.js';
import { createParticleDemo } from './particle-demo.js';
import './style.css';

const status = document.querySelector('#status');
const count = document.querySelector('#count');
const toggle = document.querySelector('#toggle');
const reset = document.querySelector('#reset');
document.querySelector('#version').textContent = VERSION;

try {
  const demo = await createParticleDemo(document.querySelector('#stage'), (value) => {
    const next = String(value);
    if (count.textContent !== next) count.textContent = next;
  });
  status.textContent = 'Running';
  toggle.disabled = reset.disabled = false;
  toggle.addEventListener('click', () => {
    const paused = demo.toggle();
    toggle.textContent = paused ? 'Resume' : 'Pause';
    status.textContent = paused ? 'Paused' : 'Running';
  });
  reset.addEventListener('click', () => {
    demo.reset();
    toggle.textContent = 'Pause';
    status.textContent = 'Running';
  });
  if (import.meta.hot) import.meta.hot.dispose(() => demo.destroy());
} catch (error) {
  status.textContent = `Initialization failed: ${error.message}`;
  console.error(error);
}
