import test from 'node:test';
import assert from 'node:assert/strict';
import { stepFlight, sampleDuration } from './preview-flight.js';
test('flight follows straight segments and ends exactly at target', () => {
  const first = stepFlight({ x: 0, y: 0 }, { x: 3, y: 4 }, 2, 1);
  assert.deepEqual(first.point, { x: 1.2, y: 1.6 }); assert.equal(first.arrived, false);
  assert.deepEqual(stepFlight(first.point, { x: 3, y: 4 }, 10, 1).point, { x: 3, y: 4 });
});
test('zero distance has finite position and direction', () => { const result = stepFlight({ x: 4, y: 4 }, { x: 4, y: 4 }, 0, .1); assert.equal(result.arrived, true); assert.equal(result.angle, 0); assert.deepEqual(result.point, { x: 4, y: 4 }); });
test('fast flight samples at most four pixels and 1/120 second', () => { for (const speed of [0, 380, 1800]) { const seconds = sampleDuration(speed); assert.ok(seconds <= 1 / 120); assert.ok(speed * seconds <= 4); } });
test('moving target redirects from current position without teleporting', () => { const result = stepFlight({ x: 10, y: 0 }, { x: 10, y: 100 }, 120, 1 / 120); assert.deepEqual(result.point, { x: 10, y: 1 }); });
