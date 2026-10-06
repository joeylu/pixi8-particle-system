import { VERSION } from 'pixi.js';
import { ASSETS, PRESETS, PROJECTILE_PRESETS, createWorkspace, getSelectedLayer, toRuntimeConfig } from './editor-model.js';
import { createParticlePreview } from './particle-preview.js';
import { createInspector, moduleCount } from './inspector.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const workspaces = { particle: createWorkspace('particle'), projectile: createWorkspace('projectile') };
let mode = location.hash === '#projectile' ? 'projectile' : 'particle';
let state = workspaces[mode];
let preview;
let applyTimer;
let applying = 0;
let disposed = false;
let ready = false;
let latestStats = { state: 'stopped', count: 0, fps: 0, elapsed: 0 };
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
  $('host-speed').value = String(state.host.speed);
  $('host-speed-value').value = String(state.host.speed);
  $('host-loop').checked = state.host.loop;
  $('host-loop-delay').value = String(state.host.loopDelay);
  $('host-flash').checked = state.host.launchFlash;
  $('host-impact').checked = state.host.impact;
  preview?.setScene(state.scene);
}

function refreshLabels() {
  const preset = presets().find((item) => item.id === state.preset);
  $('preset-name').textContent = preset.label;
  const layer = getSelectedLayer(state);
  const count = 3 + Object.values(layer.enabled).filter(Boolean).length;
  $('module-count').textContent = `${count}/${moduleCount} active`;
  $('layer-select').innerHTML = state.layers.map((item) => `<option value="${item.id}" ${item.id === layer.id ? 'selected' : ''}>${item.label}${item.active ? '' : ' (off)'}</option>`).join('');
  $('layer-enabled').checked = layer.active;
  $('layer-role').textContent = `${layer.role} · ${layer.main.simulationSpace} · ${state.layers.filter((item) => item.active).length} active layers`;
  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.preset === state.preset));
  });
}

function presets() { return mode === 'particle' ? PRESETS : PROJECTILE_PRESETS; }
function setPath(object, path, value) {
  const keys = path.split('.');
  const key = keys.pop();
  keys.reduce((current, part) => current[part], object)[key] = value;
}
function refreshInspector() { inspector.setState({ ...getSelectedLayer(state), scene: state.scene }); }
function renderPresets() {
  $('presets').innerHTML = presets().map((preset, index) => {
    const texture = ASSETS.find((asset) => asset.id === preset.textureId);
    return `<button type="button" class="preset-card" data-preset="${preset.id}" aria-pressed="${preset.id === state.preset}"><span class="preset-index">0${index + 1}</span><img src="${texture.url}" alt=""><span class="preset-copy"><strong>${preset.label}</strong><small>${preset.description}</small></span></button>`;
  }).join('');
}
function refreshWorkspace() {
  const projectile = mode === 'projectile';
  document.body.dataset.mode = mode;
  document.title = `${projectile ? 'Projectile' : 'Particle'} Lab · Geminant`;
  $('workspace-title').textContent = projectile ? 'Projectile System' : 'Particle System';
  $('brand-label').textContent = projectile ? '/ PROJECTILE LAB' : '/ PARTICLE LAB';
  $('workspace-kind').textContent = projectile ? 'HOST FLIGHT + EFFECT LAYERS' : 'EMITTER + EFFECT MODULES';
  for (const value of ['particle', 'projectile']) $(`mode-${value}`).setAttribute('aria-pressed', String(mode === value));
  $('projectile-controls').hidden = !projectile;
  $('follow-pointer-label').hidden = projectile;
  $('burst').hidden = projectile;
  $('emitter-marker').hidden = projectile;
  for (const id of ['start-marker', 'target-marker', 'head-marker', 'flight-guide']) $(id).hidden = !projectile;
  $('viewport-caption').textContent = projectile ? 'Drag START / TARGET · Launch to fly · Hit now to end at the current position' : 'Drag to move emitter · Compare Local / World and gravity';
  $('stage').setAttribute('aria-label', projectile ? 'Projectile preview. Drag start and target markers to change the flight path.' : 'Particle preview. Drag to move the emitter.');
  document.querySelector('.preview-panel').setAttribute('aria-label', projectile ? 'Projectile scene' : 'Particle scene');
  renderPresets(); refreshInspector(); refreshScene(); refreshLabels();
}

function chooseMode(nextMode) {
  if (!['particle', 'projectile'].includes(nextMode) || nextMode === mode) return;
  clearTimeout(applyTimer); applying++;
  mode = nextMode; state = workspaces[mode];
  ready = false; clearError();
  refreshWorkspace(); updateStats(latestStats);
  scheduleApply({ immediate: true });
}

async function applyState(runtimeConfig, revision) {
  if (!preview || disposed || revision !== applying) return;
  try {
    await preview.apply(runtimeConfig);
    if (!disposed && revision === applying) { ready = true; clearError(); updateStats(latestStats); }
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
    setPath(path.startsWith('scene.') ? state : getSelectedLayer(state), path, value);
    if (path.startsWith('scene.')) refreshScene();
    refreshLabels();
    scheduleApply();
  },
  onInvalid(error) {
    clearTimeout(applyTimer);
    applying++;
    showError(error);
  },
});

async function choosePreset(id) {
  state = createWorkspace(mode, id);
  workspaces[mode] = state;
  const selectedWorkspace = state;
  refreshInspector();
  refreshScene();
  refreshLabels();
  await scheduleApply({ immediate: true });
  if (!disposed && state === selectedWorkspace && ready) await action(() => preview.restart());
}

async function action(operation) {
  if (!preview || !ready) return;
  try { await operation(); } catch (error) { showError(error); }
}

function updateStats(stats) {
  if (disposed) return;
  latestStats = stats;
  const { state: transport, count, fps, elapsed, phase } = stats;
  const names = { playing: 'Playing', paused: 'Paused', stopped: 'Stopped', draining: 'Draining', faulted: 'Error', destroyed: 'Closed' };
  $('status').textContent = mode === 'projectile' && phase && transport !== 'paused' ? `${names[transport] || transport} · ${phase}` : names[transport] || transport;
  $('status').dataset.state = transport;
  $('status').dataset.phase = phase || '';
  const selected = getSelectedLayer(state);
  const layerStats = stats.layers?.find((layer) => layer.id === selected.id);
  $('layer-role').textContent = `${selected.role} · ${selected.main.simulationSpace} · ${layerStats?.count ?? 0} live · ${state.layers.filter((layer) => layer.active).length} active layers`;
  $('layer-role').dataset.count = String(layerStats?.count ?? 0);
  $('head-marker').hidden = mode !== 'projectile' || phase !== 'flying';
  $('count').textContent = count.toLocaleString();
  $('fps').textContent = String(Math.round(fps));
  $('elapsed').textContent = elapsed.toFixed(1);
  $('toggle').textContent = transport === 'paused' ? 'Resume' : transport === 'stopped' ? 'Play' : 'Pause';
  $('toggle').setAttribute('aria-label', `${$('toggle').textContent} simulation`);
  const unavailable = !ready || transport === 'faulted' || transport === 'destroyed' || !state.layers.some((layer) => layer.active);
  for (const id of ['toggle', 'restart', 'stop']) $(id).disabled = unavailable;
  $('burst').disabled = unavailable || transport === 'paused';
  $('launch').disabled = unavailable || transport === 'paused';
  $('hit').disabled = unavailable || transport !== 'playing' || phase !== 'flying';
}

$('version').textContent = VERSION;
refreshWorkspace();
for (const id of ['toggle', 'restart', 'stop', 'burst', 'launch', 'hit']) $(id).disabled = true;

for (const value of ['particle', 'projectile']) on($(`mode-${value}`), 'click', () => { location.hash = value; chooseMode(value); });
window.addEventListener('hashchange', () => chooseMode(location.hash === '#projectile' ? 'projectile' : 'particle'), { signal: events.signal });
on($('layer-select'), 'change', (event) => { state.selectedLayerId = event.target.value; refreshInspector(); refreshLabels(); });
on($('layer-enabled'), 'change', (event) => { getSelectedLayer(state).active = event.target.checked; refreshLabels(); scheduleApply(); });
function hostChange(key, value) { state.host[key] = value; refreshScene(); scheduleApply(); }
for (const id of ['host-speed', 'host-speed-value']) on($(id), 'input', (event) => {
  if (!event.target.value.trim()) { showError(new Error('Enter a flight speed.')); return; }
  hostChange('speed', Number(event.target.value));
});
on($('host-loop'), 'change', (event) => hostChange('loop', event.target.checked));
on($('host-loop-delay'), 'change', (event) => {
  if (!event.target.value.trim()) { showError(new Error('Enter a loop delay.')); return; }
  hostChange('loopDelay', Number(event.target.value));
});
on($('host-flash'), 'change', (event) => hostChange('launchFlash', event.target.checked));
on($('host-impact'), 'change', (event) => hostChange('impact', event.target.checked));
on($('launch'), 'click', () => action(() => preview.launch()));
on($('hit'), 'click', () => action(() => preview.hit()));
on($('export-config'), 'click', () => {
  try {
    const config = toRuntimeConfig(state).config;
    if (!config) throw new Error('Enable at least one layer before exporting.');
    $('config-source').value = JSON.stringify(config, null, 2);
    $('config-filename').textContent = `${state.mode}-${state.preset}.effect.json`;
    $('copy-status').textContent = 'Effect layers only · texture IDs resolve through the asset catalog.';
    $('config-dialog').showModal();
  } catch (error) { showError(error); }
});
on($('close-config'), 'click', () => $('config-dialog').close());
on($('copy-config'), 'click', async () => {
  try {
    await navigator.clipboard.writeText($('config-source').value);
    $('copy-status').textContent = 'Copied.';
  } catch {
    $('config-source').focus(); $('config-source').select();
    $('copy-status').textContent = 'Press Ctrl/Cmd+C to copy the selected JSON.';
  }
});

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
  return preview.burst();
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
      onHandles({ start: source, target, head }) {
        for (const [id, point] of [['start-marker', source], ['target-marker', target], ['head-marker', head]]) {
          $(id).style.left = `${point.x}px`; $(id).style.top = `${point.y}px`;
        }
        $('flight-guide').setAttribute('viewBox', `0 0 ${$('stage').clientWidth} ${$('stage').clientHeight}`);
        for (const [name, value] of Object.entries({ x1: source.x, y1: source.y, x2: target.x, y2: target.y })) $('flight-guide-line').setAttribute(name, String(value));
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
