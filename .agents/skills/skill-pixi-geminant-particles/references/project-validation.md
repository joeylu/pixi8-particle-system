# Project Particle Validation

This reference applies only to project adapters adopting Geminant's managed startup and path contracts. Independent module consumers validate against [configuration validation](config-validation.md) and [runtime verification](validation.md); they do not need an overall SDK configuration, launcher, or H5 directory.

In applicable projects, discover the project validation entry point from installed package metadata and CLI capabilities, and inspect `--help` to confirm usage. Use the project's existing Node and TypeScript dependencies without installing software. `--root` specifies the project root; `--config` specifies the path configuration file and is optional. Project configuration resolves actual game and SDK paths; `--root` does not bypass configuration. The CLI also accepts `-h` and `-help`. Projects adopting this managed contract must run the particle validator as part of base SDK validation; games without particle effects need not create useless instances.

Output is `Geminant particles validation: PASS/FAIL`. Success exits with `0`, failed project checks with `1`, and invalid command arguments or path configuration with `2`.

## Check Scope

Scan regular `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`, `.mjs`, and `.cjs` files under the game's `src`, skipping symbolic links, `node_modules`, output directories, and cache directories. External source code and other languages are outside this scope.

Reject direct construction of Pixi `Particle` or `ParticleContainer`, or direct writes to known SDK particle-container membership lists, lengths, aliased indices, or particle fields. Diagnostic reads are allowed. Construction of presentation objects inside the SDK implementation is not a game-source violation.

Reject known libraries violating Geminant's sole-runtime contract in project dependencies and literal `import`, `export`, dynamic `import()`, or `require` calls. All four dependency declaration sections must be objects. Geminant imports must resolve to the configured actual runtime; a fake module with the same name or an invalid import cannot satisfy the check. TypeScript AST analysis uses dependencies declared by and resolvable in the target project, `tsconfig` paths, and literal re-exports to track symbols. Comments, ordinary strings, regular Sprite objects, and filters are not treated as particles.

Particle pipe registration must use the literal `await import('pixi.js/particle-container')`. The game runtime is identified through the literal `import('./init/initializeH5Game')`, which may appear inside `await Promise.all`. Within the same function scope, check AST lexical order: paint first, then the particle pipe, then the runtime import. `require` cannot replace pipe startup. This check does not prove whether conditional branches execute or establish complete control flow.

## Diagnostics

- `PARTICLES-001`: Missing game root.
- `010`, `011`, `012`: Forbidden dependencies or module sources, invalid package structure, or invalid dependency declaration sections.
- `020`, `021`: Direct construction of particle presentation objects or writes to known particle-container members.
- `030`: A Geminant-named source does not resolve to the configured runtime.
- `040`, `041`, `042`, `043`: Missing TypeScript dependency, configuration or extends errors, source syntax errors, or static-analysis exceptions.
- `070`, `071`, `072`: Missing main entry, missing literal await pipe import, or incorrect startup lexical order.
- `900`, `901`, `902`: Unknown command arguments, missing argument values, or path configuration errors.

All numeric diagnostics use the `PARTICLES-` prefix.

Static tracking covers resolvable aliases, namespaces, destructuring, re-exports, and limited wrapper calls. Reassignments, arbitrary object flows, computed modules, unknown third parties, custom Sprite particle algorithms, conditional branches, and complete control flow require manual review. Exhausting recursion or tracking budgets does not constitute complete recognition. `PASS` does not prove all dynamic behavior, GPU drawing, or runtime semantics. Validate resources, JSON, state, and actual graphics as described in [verification](validation.md).