import type { ConstantForceFactory, ForceConfig } from '../composition/contracts.js';
import { aliasValue, finite, knownKeys, object } from '../core/validation.js';

export function createConstantForce(config: ForceConfig): ConstantForceFactory {
  object(config, 'ConstantForce config');
  const accelerationX = aliasValue(config, 'x', 'accelerationX', 0), accelerationY = aliasValue(config, 'y', 'accelerationY', 0);
  knownKeys(config, ['x', 'y', 'accelerationX', 'accelerationY'], 'ConstantForce');
  finite(accelerationX, 'x/accelerationX'); finite(accelerationY, 'y/accelerationY');
  return () => Object.freeze({ accelerationX, accelerationY });
}
export { createConstantForce as createForceOverLifetimeModule };
