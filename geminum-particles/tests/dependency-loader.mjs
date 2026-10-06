import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (process.env.GEMINANT_PARTICLES_BUILD_DEPS && (specifier === 'pixi.js' || specifier.startsWith('pixi.js/'))) {
    const requireDependency = createRequire(path.join(path.resolve(process.env.GEMINANT_PARTICLES_BUILD_DEPS), '__particle_tests__.cjs'));
    return nextResolve(pathToFileURL(requireDependency.resolve(specifier)).href, context);
  }
  return nextResolve(specifier, context);
}
