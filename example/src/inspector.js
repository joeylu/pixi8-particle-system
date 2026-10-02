import { ASSETS } from './editor-model.js';

const number = (path, label, min, max, step = 1, unit = '', help = '') =>
  ({ path, label, type: 'range', min, max, step, unit, help });
const pair = (path, label, min, max, step, unit = '') =>
  ({ path, label, type: 'pair', min, max, step, unit });
const select = (path, label, options) => ({ path, label, type: 'select', options });
const color = (path, label) => ({ path, label, type: 'color' });
const checkbox = (path, label, help = '') => ({ path, label, type: 'checkbox', help });

// UI units are separate from SDK units; the model is the conversion boundary.
const MODULES = [
  {
    key: 'main', title: 'Main', meta: 'PARTICLE SYSTEM', required: true, open: true,
    fields: [
      number('main.startLifetime', 'Start lifetime', 0.1, 12, 0.1, 's'),
      pair('main.startSpeed', 'Start speed', 0, 800, 1, 'px/s'),
      pair('main.startScale', 'Start scale', 0, 3, 0.01, '×'),
      pair('main.startRotation', 'Start rotation', -360, 360, 1, '°'),
      color('main.startTint', 'Start color'),
      number('main.startAlpha', 'Start opacity', 0, 1, 0.01),
      select('main.simulationSpace', 'Simulation space', [['local', 'Local'], ['world', 'World']]),
      number('main.gravityModifier', 'Gravity modifier', -3, 3, 0.05, '×', 'World gravity: 300 px/s² downward.'),
      number('main.maxParticles', 'Max particles', 1, 3000, 1),
      { ...number('main.randomSeed', 'Random seed', 0, 4294967295), type: 'number' },
      { ...number('main.maxBirthsPerUpdate', 'Birth budget / step', 1, 10000), type: 'number', help: 'Limits births in one simulation update.' },
    ],
  },
  {
    key: 'emission', title: 'Emission', meta: 'SPAWN', open: true,
    fields: [number('emission.rateOverTime', 'Rate over time', 0, 500, 1, '/s'), number('emission.burstCount', 'Manual burst', 1, 1000, 1)],
    note: 'Manual burst uses the Emit burst button. Disabling Emission stops automatic births.',
  },
  {
    key: 'shape', title: 'Shape', meta: 'SPAWN REGION',
    fields: [
      select('shape.shapeType', 'Shape type', [['point', 'Point'], ['circle', 'Circle'], ['rectangle', 'Rectangle']]),
      { ...number('shape.radius', 'Radius', 0, 200, 1, 'px'), when: (state) => state.shape.shapeType === 'circle' },
      { ...number('shape.width', 'Width', 0, 400, 1, 'px'), when: (state) => state.shape.shapeType === 'rectangle' },
      { ...number('shape.height', 'Height', 0, 400, 1, 'px'), when: (state) => state.shape.shapeType === 'rectangle' },
      number('shape.directionDegrees', 'Direction', -180, 180, 1, '°'),
      number('shape.spreadDegrees', 'Spread', 0, 360, 1, '°'),
      number('shape.offsetX', 'Offset X', -300, 300, 1, 'px'),
      number('shape.offsetY', 'Offset Y', -300, 300, 1, 'px'),
    ],
    note: '−90° points up. The spawn region and velocity spread are independent.',
  },
  {
    key: 'force', title: 'Force over Lifetime', meta: 'MOTION',
    fields: [number('force.x', 'Force X', -600, 600, 1, 'px/s²'), number('force.y', 'Force Y', -600, 600, 1, 'px/s²')],
  },
  {
    key: 'color', title: 'Color over Lifetime', meta: 'APPEARANCE',
    fields: [color('color.endTint', 'End color'), number('color.endAlphaFactor', 'End opacity factor', 0, 1, 0.01, '×')],
    note: 'Linear transition from each particle’s starting color and opacity.',
  },
  { key: 'size', title: 'Size over Lifetime', meta: 'APPEARANCE', fields: [number('size.endScaleFactor', 'End scale factor', 0, 8, 0.05, '×')] },
  { key: 'rotation', title: 'Rotation over Lifetime', meta: 'APPEARANCE', fields: [number('rotation.degreesPerSecond', 'Angular speed', -720, 720, 1, '°/s')] },
  {
    key: 'trails', title: 'Trails', meta: 'PATH',
    fields: [
      number('trails.lifetime', 'Trail lifetime', 0.01, 3, 0.01, '×', 'Multiplier of the particle lifetime.'),
      number('trails.width', 'Trail width', 0.5, 40, 0.5, 'px'),
      number('trails.minVertexDistance', 'Min vertex distance', 0.5, 64, 0.5, 'px'),
      number('trails.breakDistance', 'Break distance', 1, 1000, 1, 'px'),
      { ...number('trails.maxPointsPerTrail', 'Points per trail', 2, 128), type: 'number' },
      { ...number('trails.maxTrails', 'Trail capacity', 1, 12000), type: 'number' },
      checkbox('trails.worldSpace', 'World-space trails'),
      checkbox('trails.dieWithParticles', 'Die with particles'),
      select('renderer.trailTexture', 'Trail texture', ASSETS.map((asset) => [asset.id, asset.label])),
      select('renderer.trailBlendMode', 'Trail blending', [['normal', 'Normal'], ['add', 'Additive']]),
      color('renderer.trailTint', 'Trail color'),
      number('renderer.trailAlpha', 'Trail opacity', 0, 1, 0.01),
    ],
    note: 'Stretch material · fixed width. Retained trails also use trail capacity.',
  },
  {
    key: 'renderer', title: 'Renderer', meta: 'MATERIAL', required: true,
    fields: [select('renderer.blendMode', 'Blending', [['normal', 'Normal'], ['add', 'Additive']])],
    note: 'Single-frame textures. One ParticleContainer renders the selected material.',
  },
];

export const moduleCount = MODULES.length;
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const get = (state, path) => path.split('.').reduce((value, key) => value[key], state);
const idFor = (path) => `field-${path.replaceAll('.', '-')}`;

function renderField(field, state) {
  if (field.when && !field.when(state)) return '';
  const value = get(state, field.path);
  const id = idFor(field.path);
  const unit = field.unit ? `<small class="field-unit">${escape(field.unit)}</small>` : '';
  const attr = `data-path="${field.path}" min="${field.min}" max="${field.max}" step="${field.step}"`;
  let control;
  if (field.type === 'range') {
    control = `<div class="range-control"><input id="${id}" type="range" ${attr} value="${value}" aria-label="${escape(field.label)}"><input type="number" ${attr} value="${value}" aria-label="${escape(field.label)} value"></div>`;
  } else if (field.type === 'pair') {
    control = `<div class="range-pair">${['min', 'max'].map((end) => `<label><small>${end}</small><input id="${id}-${end}" type="number" data-path="${field.path}.${end}" min="${field.min}" max="${field.max}" step="${field.step}" value="${value[end]}" aria-label="${escape(field.label)} ${end}"></label>`).join('')}</div>`;
  } else if (field.type === 'select') {
    control = `<select id="${id}" data-path="${field.path}">${field.options.map(([key, title]) => `<option value="${escape(key)}" ${value === key ? 'selected' : ''}>${escape(title)}</option>`).join('')}</select>`;
  } else if (field.type === 'color') {
    control = `<div class="color-control"><input id="${id}" type="color" data-path="${field.path}" value="${escape(value)}" aria-label="${escape(field.label)}"><span class="color-value">${escape(value.toUpperCase())}</span></div>`;
  } else if (field.type === 'checkbox') {
    control = `<input id="${id}" type="checkbox" data-path="${field.path}" ${value ? 'checked' : ''}>`;
  } else {
    control = `<input id="${id}" type="number" ${attr} value="${value}">`;
  }
  return `<div class="field-row"><label class="field-label" for="${id}${field.type === 'pair' ? '-min' : ''}">${field.label}${unit}</label><div class="field-control">${control}</div>${field.help ? `<p class="field-help">${escape(field.help)}</p>` : ''}</div>`;
}

function renderTextures(state) {
  const current = ASSETS.find((asset) => asset.id === state.renderer.texture);
  return `<div class="texture-current"><img src="${escape(current.url)}" alt="${escape(current.label)}"><div><strong>${escape(current.label)}</strong><small>${current.width} × ${current.height} · PNG</small></div></div>${[...new Set(ASSETS.map((asset) => asset.family))].map((family) => `<h4 class="texture-family">${escape(family)}</h4><div class="texture-grid">${ASSETS.filter((asset) => asset.family === family).map((asset) => `<button type="button" class="texture-card" data-texture="${asset.id}" aria-label="Use ${escape(asset.label)} texture" aria-pressed="${asset.id === state.renderer.texture}"><img src="${escape(asset.url)}" alt="" loading="lazy"><span>${escape(asset.label)}</span></button>`).join('')}</div>`).join('')}`;
}

export function createInspector(host, { onChange, onInvalid }) {
  let state;
  const openModules = new Map();
  function render(nextState) {
    const focus = host.contains(document.activeElement) ? document.activeElement : null;
    const focusPath = focus?.dataset.path;
    const focusType = focus?.type;
    const scrollTop = host.scrollTop;
    host.querySelectorAll('details[data-module]').forEach((element) => openModules.set(element.dataset.module, element.open));
    state = nextState;
    host.innerHTML = MODULES.map((module) => {
      const enabled = module.required || state.enabled[module.key];
      const opened = openModules.get(module.key) ?? module.open;
      return `<details class="module ${enabled ? 'is-enabled' : 'is-disabled'}" data-module="${module.key}" ${opened ? 'open' : ''}>
        <summary class="module-header">
          ${module.required ? '<span class="module-required" aria-hidden="true"></span>' : `<input class="module-toggle" type="checkbox" data-path="enabled.${module.key}" aria-label="Enable ${module.title}" ${enabled ? 'checked' : ''}>`}
          <span class="module-title">${module.title}</span><span class="module-meta">${module.meta}</span>
        </summary>
        <div class="module-body"><fieldset class="module-fields" ${enabled ? '' : 'disabled'} aria-label="${module.title} parameters">
          ${module.fields.map((field) => renderField(field, state)).join('')}
          ${module.key === 'renderer' ? renderTextures(state) : ''}
          ${module.note ? `<p class="module-note">${module.note}</p>` : ''}
        </fieldset></div>
      </details>`;
    }).join('');
    host.scrollTop = scrollTop;
    if (focusPath) {
      const replacement = [...host.querySelectorAll('[data-path]')].find((element) => element.dataset.path === focusPath && element.type === focusType);
      replacement?.focus({ preventScroll: true });
    }
  }

  function input(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement) || !target.dataset.path) return;
    if (event.type === 'input' && (target.type === 'checkbox' || target.tagName === 'SELECT')) return;
    if (event.type === 'input' && target.type === 'number' && target.value.trim() === '') return;
    if (event.type === 'change' && (target.type === 'range' || target.type === 'color')) return;
    if (!target.checkValidity()) {
      onInvalid(new Error(`${target.getAttribute('aria-label') || target.labels?.[0]?.textContent || 'Parameter'}: ${target.validationMessage}`));
      return;
    }
    const value = target.type === 'checkbox' ? target.checked
      : (target.type === 'range' || target.type === 'number') ? Number(target.value) : target.value;
    if ((target.type === 'number' && target.value.trim() === '') || (typeof value === 'number' && !Number.isFinite(value))) {
      onInvalid(new Error('Enter a finite numeric value.'));
      return;
    }
    const path = target.dataset.path;
    host.querySelectorAll('[data-path]').forEach((sibling) => {
      if (sibling !== target && sibling.dataset.path === path) sibling.value = String(value);
    });
    if (target.type === 'color') target.nextElementSibling.textContent = value.toUpperCase();
    onChange(path, value);
    if (path.startsWith('enabled.') || path === 'shape.shapeType') render(state);
  }

  function click(event) {
    if (event.target.closest('.module-toggle')) event.stopPropagation();
    const texture = event.target.closest('[data-texture]');
    if (texture) {
      onChange('renderer.texture', texture.dataset.texture);
      render(state);
    }
  }
  host.addEventListener('input', input);
  host.addEventListener('change', input);
  host.addEventListener('click', click);
  return {
    setState: render,
    destroy() {
      host.removeEventListener('input', input);
      host.removeEventListener('change', input);
      host.removeEventListener('click', click);
    },
  };
}
