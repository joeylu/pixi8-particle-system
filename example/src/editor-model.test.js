import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateParticleEntityConfig } from 'geminant-particles/config';
import { ASSETS, PRESETS, PROJECTILE_PRESETS, createWorkspace, getSelectedLayer, toRuntimeConfig } from './editor-model.js';

const packets = (packet) => ['config', 'manualConfig', 'flashConfig', 'impactConfig'].map((key) => packet[key]).filter(Boolean);

test('every preset emits real validated entity JSON without mutating workspace', () => {
  for (const [mode, presets] of [['particle', PRESETS], ['projectile', PROJECTILE_PRESETS]]) {
    for (const preset of presets) {
      const workspace = createWorkspace(mode, preset.id);
      const before = structuredClone(workspace);
      const packet = toRuntimeConfig(workspace);
      assert.deepEqual(workspace, before);
      for (const config of packets(packet)) {
        assert.deepEqual(validateParticleEntityConfig(config), config);
        assert.equal('host' in config, false);
        for (const set of config.textureSets) {
          assert.equal(set.textures.length, 1);
          assert.ok(ASSETS.some((asset) => asset.id === set.textures[0].asset));
          assert.equal(JSON.stringify(set).includes('file:'), false);
        }
      }
    }
  }
  assert.throws(() => createWorkspace('missing'), /mode/);
  assert.throws(() => createWorkspace('particle', 'fireball'), /Unknown preset/);
});

test('eleven PNG and six readable projectile SVG resources match declared dimensions', () => {
  assert.equal(ASSETS.length, 17);
  assert.equal(new Set(ASSETS.map((asset) => asset.id)).size, 17);
  const pngs = ASSETS.filter((asset) => asset.family !== 'projectile');
  assert.equal(pngs.length, 11);
  for (const asset of pngs) {
    const bytes = readFileSync(new URL(asset.url));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), asset.width);
    assert.equal(bytes.readUInt32BE(20), asset.height);
  }
  for (const asset of ASSETS.filter((entry) => entry.family === 'projectile')) {
    const svg = readFileSync(new URL(asset.url), 'utf8');
    assert.match(svg, /<svg\b/);
    assert.match(svg, new RegExp(`width="${asset.width}"`));
    assert.match(svg, new RegExp(`height="${asset.height}"`));
    assert.match(svg, /<(path|ellipse|circle|rect)\b/);
    assert.equal(svg.includes('\ufffd'), false);
  }
});

test('workspaces retain independent values and selected layers are actual references', () => {
  const particle = createWorkspace(); const projectile = createWorkspace('projectile');
  particle.scene.gravityY = -10; particle.layers[0].main.startSpeed.min = 22;
  projectile.host.speed = 700; projectile.selectedLayerId = 'tail';
  assert.equal(getSelectedLayer(projectile), projectile.layers[0]);
  assert.equal(createWorkspace().scene.gravityY, 300);
  assert.equal(createWorkspace().layers[0].main.startSpeed.min, 50);
  assert.equal(createWorkspace('projectile').host.speed, 320);
  assert.equal(createWorkspace('projectile').host.loop, true);
  assert.equal(createWorkspace('projectile').host.loopDelay, 0.65);
  assert.equal(particle.host.speed, 380);
});

test('heads are local single timed births with stable identity appearance and retained ribbons', () => {
  for (const preset of PROJECTILE_PRESETS) {
    const workspace = createWorkspace('projectile', preset.id);
    const packet = toRuntimeConfig(workspace);
    assert.equal(packet.manualConfig, null);
    const bodyIds = workspace.layers.filter((layer) => layer.role === 'head').map((layer) => layer.id);
    assert.equal(workspace.selectedLayerId, 'head');
    assert.ok(workspace.layers.length <= 8);
    for (const head of packet.config.layers.filter((layer) => bodyIds.includes(layer.id))) {
      assert.equal(head.main.simulationSpace, 'local');
      assert.deepEqual(head.main.startLifetime, { min: 12, max: 12 });
      assert.deepEqual(head.main.startSpeed, { min: 0, max: 0 });
      assert.deepEqual(head.modules.emission.bursts, [{ time: 0, count: 1 }]);
      assert.equal(head.modules.emission.duration, 0);
      assert.equal(head.modules.emission.rateOverTime, 0);
      assert.deepEqual(head.modules.colorOverLifetime.alphaCurve, [{ t: 0, value: 1 }, { t: 1, value: 1 }]);
      assert.deepEqual(head.modules.sizeOverLifetime.scaleCurve, [{ t: 0, value: 1 }, { t: 1, value: 1 }]);
      assert.equal(head.main.startTint, 0xffffff);
      assert.equal(head.renderer.alignment, 'fixed');
      assert.equal('rotationOverLifetime' in head.modules, false);
      if (preset.id === 'meteor' && head.id === 'head') assert.equal(head.renderer.blendMode, 'normal');
      if (head.modules.trails) {
        assert.equal(head.modules.trails.worldSpace, true);
        assert.equal(head.modules.trails.dieWithParticles, false);
        const ttl = head.id === 'shell' ? (preset.id === 'meteor' ? 0.55 : 0.38) : preset.id === 'energy-bolt' ? 0.28 : 0.2;
        assert.equal(head.modules.trails.lifetime, ttl / 12);
      }
    }
    for (const tail of packet.config.layers.filter((layer) => !bodyIds.includes(layer.id))) {
      assert.equal(tail.main.simulationSpace, 'world');
      assert.equal(packet.killLayerIds.includes(tail.id), false);
    }
    assert.deepEqual(packet.killLayerIds, bodyIds);
    for (const layer of workspace.layers.filter((layer) => layer.role === 'head')) layer.active = false;
    assert.deepEqual(toRuntimeConfig(workspace).killLayerIds, []);
    assert.deepEqual(toRuntimeConfig(workspace).config.layers.map((layer) => layer.id),
      workspace.layers.filter((layer) => layer.role === 'tail').map((layer) => layer.id));
  }
});

test('finite emission, range angles, ring, drag, curves and renderer convert precisely', () => {
  const workspace = createWorkspace(); const layer = getSelectedLayer(workspace);
  Object.assign(layer.emission, { finite: true, duration: 2, startDelay: 0.2, loop: true, bursts: [{ time: 0.4, count: 5 }] });
  Object.assign(layer.shape, { innerRadius: 4, directionMode: 'inward' });
  layer.enabled.drag = true; layer.drag.drag = 3;
  layer.enabled.rotation = true; layer.rotation.degreesPerSecond = { min: -90, max: 180 };
  layer.main.startRotation = { min: -180, max: 180 };
  layer.main.startScaleAspect = { x: 2, y: 0.5 };
  layer.renderer.alignment = 'velocity'; layer.renderer.forwardDegrees = 90;
  Object.assign(layer.color, { useColorCurve: true, colorCurve: [{ t: 0, value: '#ffffff' }, { t: 0.5, value: '#ff0000' }, { t: 1, value: '#000000' }] });
  const output = toRuntimeConfig(workspace).config.layers[0];
  assert.equal(output.modules.emission.duration, 2);
  assert.equal(output.modules.emission.startDelay, 0.2);
  assert.deepEqual(output.modules.emission.bursts, [{ time: 0.4, count: 5 }]);
  assert.equal(output.modules.shape.innerRadius, 4);
  assert.equal(output.modules.shape.directionMode, 'inward');
  assert.deepEqual(output.modules.limitVelocityOverLifetime, { drag: 3 });
  assert.deepEqual(output.modules.rotationOverLifetime.z, { min: -Math.PI / 2, max: Math.PI });
  assert.deepEqual(output.main.startRotation, { min: -Math.PI, max: Math.PI });
  assert.deepEqual(output.main.startScaleAspect, { x: 2, y: 0.5 });
  assert.equal(output.renderer.forwardAngle, Math.PI / 2);
  assert.equal(output.modules.colorOverLifetime.colorCurve[1].value, 0xff0000);
  assert.equal('endTint' in output.modules.colorOverLifetime, false);
});

test('manual, launch flash and impact emissions are isolated finite entities', () => {
  const workspace = createWorkspace(); const packet = toRuntimeConfig(workspace);
  const manual = packet.manualConfig.layers[0];
  assert.equal(manual.modules.emission.duration, 0);
  assert.deepEqual(manual.modules.emission.bursts, [{ time: 0, count: workspace.layers[0].emission.burstCount }]);
  assert.notEqual(manual, packet.config.layers[0]);
  const projectile = createWorkspace('projectile'); const shot = toRuntimeConfig(projectile);
  for (const config of [shot.flashConfig, shot.impactConfig]) {
    assert.equal(config.layers[0].main.simulationSpace, 'world');
    assert.equal(config.layers[0].modules.emission.duration, 0);
  }
  projectile.host.launchFlash = false; projectile.host.impact = false;
  assert.equal(toRuntimeConfig(projectile).flashConfig, null);
  assert.equal(toRuntimeConfig(projectile).impactConfig, null);
});

test('invalid optional values are ignored only when their module or layer is disabled', () => {
  const cases = [
    ['emission', 'emission', 'rateOverTime', -1, 'emission'],
    ['shape', 'shape', 'spreadDegrees', 361, 'shape'],
    ['force', 'force', 'x', Infinity, 'forceOverLifetime'],
    ['drag', 'drag', 'drag', -1, 'limitVelocityOverLifetime'],
    ['color', 'color', 'endTint', 'bad', 'colorOverLifetime'],
    ['size', 'size', 'endScaleFactor', -1, 'sizeOverLifetime'],
    ['rotation', 'rotation', 'degreesPerSecond', { min: NaN, max: 0 }, 'rotationOverLifetime'],
    ['trails', 'trails', 'width', 0, 'trails'],
    ['trails', 'renderer', 'trailTexture', 'missing', 'trails'],
  ];
  for (const [module, group, key, value, outputKey] of cases) {
    const workspace = createWorkspace(); const layer = getSelectedLayer(workspace);
    layer.enabled[module] = true; layer[group][key] = value;
    assert.throws(() => toRuntimeConfig(workspace), undefined, module);
    layer.enabled[module] = false;
    const modules = toRuntimeConfig(workspace).config.layers[0].modules;
    if (module === 'emission') assert.deepEqual(modules.emission, { rateOverTime: 0 });
    else assert.equal(outputKey in modules, false);
    layer.enabled[module] = true; layer.active = false;
    assert.equal(toRuntimeConfig(workspace).config, null);
  }
});

test('invalid curves and duration rules reject through editor or real SDK validation', () => {
  const workspace = createWorkspace(); const layer = getSelectedLayer(workspace);
  layer.color.useAlphaCurve = true;
  for (const nodes of [[], [{ t: 0, value: 1 }], [{ t: 0.1, value: 1 }, { t: 1, value: 0 }], [{ t: 0, value: 1 }, { t: 0, value: 0 }, { t: 1, value: 0 }]]) {
    layer.color.alphaCurve = nodes; assert.throws(() => toRuntimeConfig(workspace), /alphaCurve/);
  }
  layer.color.useAlphaCurve = false;
  layer.emission.loop = true; assert.equal(toRuntimeConfig(workspace).config.layers[0].modules.emission.loop, false);
  layer.emission.finite = true; layer.emission.duration = 0; assert.throws(() => toRuntimeConfig(workspace));
  layer.emission.loop = false; layer.emission.rateOverTime = 0;
  layer.emission.bursts = [{ time: 1, count: 3 }]; assert.throws(() => toRuntimeConfig(workspace));
});


test('disabled automatic emission remains inert while manual bursts remain available', () => {
  const workspace = createWorkspace(); const layer = getSelectedLayer(workspace);
  layer.enabled.emission = false; layer.emission.rateOverTime = -1;
  const packet = toRuntimeConfig(workspace);
  assert.deepEqual(packet.config.layers[0].modules.emission, { rateOverTime: 0 });
  assert.equal('activation' in packet.config.layers[0], false);
  assert.deepEqual(packet.manualConfig.layers[0].modules.emission.bursts, [{ time: 0, count: 40 }]);
  layer.emission.burstCount = 1201; assert.throws(() => toRuntimeConfig(workspace), /burstCount/);
});

test('hidden radial direction is normalized for rectangles and host controls stay bounded', () => {
  const workspace = createWorkspace(); const layer = getSelectedLayer(workspace);
  layer.shape.shapeType = 'rectangle'; layer.shape.directionMode = 'outward';
  assert.equal(toRuntimeConfig(workspace).config.layers[0].modules.shape.directionMode, 'fixed');
  for (const speed of [99, 1001]) { workspace.host.speed = speed; assert.throws(() => toRuntimeConfig(workspace), /host.speed/); }
  workspace.host.speed = 380; workspace.host.loopDelay = 6;
  assert.throws(() => toRuntimeConfig(workspace), /host.loopDelay/);
});
