import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--typecheck') || args.length > 1) {
  console.error('Usage: node scripts/build.mjs [--typecheck]'); process.exit(2);
}
const check = args.includes('--typecheck');
const dependencies = process.env.GEMINANT_PARTICLES_BUILD_DEPS ? path.resolve(process.env.GEMINANT_PARTICLES_BUILD_DEPS) : path.join(root, 'node_modules');
function removeOutput(name) {
  const target = path.resolve(root, name);
  if (path.dirname(target) !== root || !['dist', '.build-output'].includes(path.basename(target))) throw new Error('Unsafe build output path');
  if (fs.existsSync(target)) {
    if (fs.lstatSync(target).isSymbolicLink()) throw new Error('Build output must not be a symbolic link');
    fs.rmSync(target, { recursive: true, force: true });
  }
}
const stage = path.join(root, '.build-output');
try {
  if (!check) { removeOutput('dist'); removeOutput('.build-output'); }
  const requireDependency = createRequire(path.join(dependencies, '__geminant_build__.cjs'));
  let ts;
  try { ts = requireDependency('typescript'); } catch (cause) { throw new Error(`Missing installed TypeScript in ${dependencies}; install package dev dependencies or supply GEMINANT_PARTICLES_BUILD_DEPS to existing dependencies.`, { cause }); }
  const pixiRoot = path.join(dependencies, 'pixi.js');
  if (!fs.existsSync(path.join(pixiRoot, 'package.json'))) throw new Error(`Missing installed Pixi peer in ${dependencies}`);
  const files = [];
  function collect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error('Source symbolic links are not supported');
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) collect(filename); else if (entry.name.endsWith('.ts')) files.push(filename);
    }
  }
  collect(path.join(root, 'runtime')); collect(path.join(root, 'entries'));
  const options = {
    strict: true, noUnusedLocals: true, noUnusedParameters: true, skipLibCheck: true,
    noUncheckedSideEffectImports: true, noEmitOnError: true, noEmit: check, declaration: true,
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    rootDir: root, outDir: stage, baseUrl: root, paths: {
      'pixi.js': [path.join(pixiRoot, 'lib/index.d.ts')],
      'pixi.js/particle-container': [path.join(pixiRoot, 'lib/scene/particle-container/init.d.ts')],
      'pixi.js/mesh': [path.join(pixiRoot, 'lib/scene/mesh/init.d.ts')],
    },
  };
  const program = ts.createProgram(files, options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: filename => filename, getCurrentDirectory: () => root, getNewLine: () => '\n',
  }));
  if (!check) {
    const emitted = program.emit();
    if (emitted.emitSkipped || emitted.diagnostics.length) throw new Error('TypeScript emit failed');
    fs.renameSync(stage, path.join(root, 'dist'));
  }
  console.log(`Geminant particles ${check ? 'typecheck' : 'build'} PASS (${files.length} TypeScript files)`);
} catch (error) {
  if (!check) {
    try { removeOutput('.build-output'); }
    catch (cleanupError) { console.error(`Build output cleanup failed: ${cleanupError.message}`); }
  }
  console.error(`Geminant particles ${check ? 'typecheck' : 'build'} FAIL: ${error.message}`);
  process.exitCode = 1;
}
