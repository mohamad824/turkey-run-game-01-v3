// GOBBLE DASH — entrypoint: copies game/ and screenshots/ from this
// repository into the output directory and writes /output/dossier.json
// with buildDossier from vendor/makefun-game.ts.
//
// Node 22, standard library only. Deterministic: two runs write the
// same bytes. Paths come from this file's own location plus
// MAKEFUN_OUTPUT_DIR (which stands in for /output outside the grader).
// The output directory itself is never deleted, only its contents.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
// A relative MAKEFUN_OUTPUT_DIR resolves against the repository, never
// against the working directory the program happens to run from.
const outputDir = resolve(repoRoot, process.env.MAKEFUN_OUTPUT_DIR || '/output');

function clearOutputContents(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const entry of readdirSync(dir).sort()) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function main(): void {
  // Fail fast with a clear message instead of writing a half dossier.
  if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
    throw new Error('main.ts: game/index.html is missing from the repository');
  }
  clearOutputContents(outputDir);
  // Copy in a fixed order so the run is deterministic.
  cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 256 * 1024 },
    game_max_files: 993,
    game_max_bytes: 48 * 1024 * 1024,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

main();
