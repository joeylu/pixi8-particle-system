import test from 'node:test';
import assert from 'node:assert/strict';
import { ParticleSystem, compileParticleEffectConfig } from 'geminant-particles/core';
import { stepFlight, sampleDuration, sampleFrame } from './preview-flight.js';
test('flight follows straight segments and ends exactly at target', () => {
  const first = stepFlight({ x: 0, y: 0 }, { x: 3, y: 4 }, 2, 1);
  assert.deepEqual(first.point, { x: 1.2, y: 1.6 }); assert.equal(first.arrived, false);
  assert.deepEqual(stepFlight(first.point, { x: 3, y: 4 }, 10, 1).point, { x: 3, y: 4 });
});
test('zero distance has finite position and direction', () => { const result = stepFlight({ x: 4, y: 4 }, { x: 4, y: 4 }, 0, .1); assert.equal(result.arrived, true); assert.equal(result.angle, 0); assert.deepEqual(result.point, { x: 4, y: 4 }); });
test('fast flight samples at most four pixels and 1/120 second', () => { for (const speed of [0, 380, 1800]) { const seconds = sampleDuration(speed); assert.ok(seconds <= 1 / 120); assert.ok(speed * seconds <= 4); } });
test('moving target redirects from current position without teleporting', () => { const result = stepFlight({ x: 10, y: 0 }, { x: 10, y: 100 }, 120, 1 / 120); assert.deepEqual(result.point, { x: 10, y: 1 }); });

test('awkward frame durations advance the real SDK without a tiny remainder fault', () => {
  const system = new ParticleSystem({
    ...compileParticleEffectConfig({ main: { startLifetime: 12 }, emission: { duration: 0, bursts: [{ time: 0, count: 1 }] } }),
    renderer: () => ({ sync() {}, destroy() {} }),
  });
  try {
    system.play();
    for (let frame = 0; frame < 120; frame++) {
      const duration = [0.025, 0.1, 0.05, 1 / 240][frame % 4];
      const { count, seconds } = sampleFrame(duration, 320);
      assert.ok(seconds > 1e-6 && seconds <= sampleDuration(320));
      assert.ok(Math.abs(count * seconds - duration) < 1e-15);
      for (let sample = 0; sample < count; sample++) system.update(seconds);
    }
    assert.equal(system.state, 'draining');
    assert.equal(system.particleCount, 1);
    assert.deepEqual(sampleFrame(0, 320), { count: 0, seconds: 0 });
  } finally { system.destroy(); }
});
