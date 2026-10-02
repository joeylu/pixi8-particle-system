import { VERSION } from 'pixi.js';
import { ASSETS, PRESETS, createPreset, toRuntimeConfig } from './editor-model.js';
import { createParticlePreview } from './particle-preview.js';
import { createInspector, moduleCount } from './inspector.js';
import './style.css';

const $ = (id) => document.getElementById(id);
let state = createPreset();
let preview;
let applyTimer;
let applying = 0;
let disposed = false;
const events = new AbortController();
const on = (element, type, listener) => element.addEventListener(type, listener, { signal: events.signal });

function showError(error) {
  $('error-message').textContent = error instanceof Error ? error.message : String(error);
  $('error-banner').hidden = false;
}
function clearError() { $('error-banner').hidden = true; }

function refreshScene() {
  $('stage').classList.toggle('show-grid', state.scene.grid);
  $('stage').style.backgroundColor = state.scene.background;
  $('grid-toggle').checked = state.scene.grid;
  $('follow-pointer').checked = state.scene.followPointer;
  $('time-scale').value = String(state.scene.timeScale);
  preview?.setScene(state.scene);
}

function refreshLabels() {
  const preset = PRESETS.find((item) => item.id === state.preset);
  $('preset-name').textContent = preset.label;
  const count = 2 + Object.values(state.enabled).filter(Boolean).length;
  $('module-count').textContent = `${count}/${moduleCount} active`;
  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.preset === state.preset));
  });
}

async function applyState(runtimeConfig, revision) {
  if (!preview || disposed || revision !== applying) return;
  try {
    await preview.apply(runtimeConfig);
    if (!disposed && revision === applying) clearError();
  } catch (error) {
    if (!disposed && revision === applying) showError(error);
  }
}

function scheduleApply({ immediate = false } = {}) {
  clearTimeout(applyTimer);
  const revision = ++applying;
  try {
    const config = toRuntimeConfig(state);
    if (immediate) return applyState(config, revision);
    applyTimer = setTimeout(() => applyState(config, revision), 120);
  } catch (error) {
    showError(error);
  }
}

const inspector = createInspector($('inspector-modules'), {
  onChange(path, value) {
    const keys = path.split('.');
    const key = keys.pop();
    keys.reduce((object, part) => object[part], state)[key] = value;
    refreshLabels();
    scheduleApply();
  },
  onInvalid(error) {
    clearTimeout(applyTimer);
    applying++;
    showError(error);
  },
});

function choosePreset(id) {
  state = createPreset(id);
  inspector.setState(state);
  refreshScene();
  refreshLabels();
  scheduleApply({ immediate: true });
}

function action(operation) {
  if (!preview) return;
  try { operation(); } catch (error) { showError(error); }
}

function updateStats({ state: transport, count, fps, elapsed }) {
  if (disposed) return;
  const names = { playing: 'Playing', paused: 'Paused', stopped: 'Stopped', draining: 'Draining', faulted: 'Error', destroyed: 'Closed' };
  $('status').textContent = names[transport] || transport;
  $('status').dataset.state = transport;
  $('count').textContent = count.toLocaleString();
  $('fps').textContent = String(Math.round(fps));
  $('elapsed').textContent = elapsed.toFixed(1);
  $('toggle').textContent = transport === 'paused' ? 'Resume' : transport === 'stopped' ? 'Play' : 'Pause';
  $('toggle').setAttribute('aria-label', `${$('toggle').textContent} simulation`);
  const unavailable = transport === 'faulted' || transport === 'destroyed';
  for (const id of ['toggle', 'restart', 'stop']) $(id).disabled = unavailable;
  $('burst').disabled = unavailable || transport === 'paused';
}

$('version').textContent = VERSION;
$('presets').innerHTML = PRESETS.map((preset, index) => {
  const texture = ASSETS.find((asset) => asset.id === preset.textureId);
  return `<button type="button" class="preset-card" data-preset="${preset.id}" aria-pressed="${preset.id === state.preset}"><span class="preset-index">0${index + 1}</span><img src="${texture.url}" alt=""><span class="preset-copy"><strong>${preset.label}</strong><small>${preset.description}</small></span></button>`;
}).join('');

inspector.setState(state);
refreshScene();
refreshLabels();
for (const id of ['toggle', 'restart', 'stop', 'burst']) $(id).disabled = true;

on($('presets'), 'click', (event) => {
  const button = event.target.closest('[data-preset]');
  if (button) choosePreset(button.dataset.preset);
});
on($('reset-settings'), 'click', () => choosePreset(state.preset));
on($('toggle'), 'click', () => action(() => preview.toggle()));
on($('restart'), 'click', () => action(() => preview.restart()));
on($('stop'), 'click', () => action(() => preview.stop()));
on($('burst'), 'click', () => action(() => {
  toRuntimeConfig(state);
  preview.burst(state.emission.burstCount);
}));
on($('center'), 'click', () => action(() => preview.center()));
on($('dismiss-error'), 'click', clearError);
on($('grid-toggle'), 'change', (event) => { state.scene.grid = event.target.checked; refreshScene(); });
on($('follow-pointer'), 'change', (event) => { state.scene.followPointer = event.target.checked; refreshScene(); });
on($('time-scale'), 'change', (event) => { state.scene.timeScale = Number(event.target.value); refreshScene(); });

async function start() {
  try {
    const instance = await createParticlePreview($('stage'), {
      onStats: updateStats,
      onError: showError,
      onEmitter({ x, y }) {
        $('emitter-marker').style.left = `${x}px`;
        $('emitter-marker').style.top = `${y}px`;
      },
    });
    if (disposed) { instance.destroy(); return; }
    preview = instance;
    refreshScene();
    await scheduleApply({ immediate: true });
  } catch (error) {
    $('status').textContent = 'Unavailable';
    showError(error);
  }
}

start();
if (import.meta.hot) import.meta.hot.dispose(() => {
  disposed = true;
  clearTimeout(applyTimer);
  events.abort();
  inspector.destroy();
  preview?.destroy();
});
