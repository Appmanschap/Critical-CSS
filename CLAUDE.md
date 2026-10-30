# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Docker-based GitHub Action that generates critical CSS for a list of pages (using `critical` v9's render engine, i.e. Playwright + Chromium) and optionally rsyncs the results to a remote server. The output files are consumed by the nystudio107 Vite Craft CMS plugin (`craft.vite.includeCriticalCssTags()`, `criticalPath`/`criticalSuffix` in `config/vite.php`); TwigPack uses the same convention. Inputs are documented in `readme.md` and declared in `action.yml`.

## Commands

- `npm run build` — bundles `src/index.ts` with tsdown into `dist/` (ESM, minified, with sourcemap). `dist/` is not committed; the Docker image builds it.
- `npm test` — vitest; run a single test with `npx vitest run -t "<name>"`. Tests cover `src/config.ts` (input parsing/validation) by setting `INPUT_*` env vars.
- `npm run typecheck` / `npm run lint` / `npm run format` (`format:check`) — tsc (`noEmit`), oxlint (`.oxlintrc.json`, ignores `dist/`), oxfmt (`.oxfmtrc.json`).

The action can only be exercised end-to-end inside the Docker image (needs Playwright's Chromium, rsync, ssh), against a live site; `readme.md` has a `docker run` example with `INPUT_*` env vars.

## Architecture

- `src/config.ts` — `getInput()` reads and validates the action inputs and throws on invalid input (`main().catch` turns that into `core.setFailed`). Exports small pure parsers (`normalizeBaseUrl`, `parsePages`, `parseDimensions`) for tests. Guards matter here: `destinationPath` is deleted every run, so it must be a workspace subdirectory, and `template` must not escape it.
- `src/index.ts` — orchestration: empty `destinationPath`; generate each page with `critical()` (`engine: 'render'`, `dimensions`), `concurrency` at a time, collecting a `PageResult` per page instead of throwing; write the job summary; rsync once to `sshHost:targetDir` (also when pages failed: the `--delete` sync deliberately removes their remote CSS, which no longer matches the deployed CSS); then throw if any page failed. The SSH key (and optional `known_hosts`) live in a temp dir under `RUNNER_TEMP`, removed in `finally`.
- `src/@types/types.d.ts` — ambient (global, non-exported) types, plus typings for only the part of `critical` this action uses (it ships none).

## Build & release flow

The multi-stage `Dockerfile` (`node:26-trixie-slim`; Playwright doesn't support Alpine) builds `dist/` in a build stage, then installs prod deps with `npm ci --omit=dev` and Playwright's Chromium into `PLAYWRIGHT_BROWSERS_PATH=/ms-playwright`, and runs `node /action/dist/index.mjs`. The Chromium version is tied to the `playwright` package version, so it's installed with the local `npx playwright`.

`action.yml` does **not** build the image — it references a prebuilt, versioned image `ghcr.io/appmanschap/critical-css-action:vX.Y.Z`. Publishing a GitHub release triggers `.github/workflows/build.yml`, which builds and pushes the image tagged from the release. `.github/workflows/ci.yml` runs the checks and a Docker build on PRs and `main`.

A version bump touches: `package.json` version, `changelog.md` entry, and the image tag in `action.yml` (keep it in sync with the release tag, otherwise consumers keep pulling the old image). New inputs go in `action.yml` both under `inputs` and in the `env` mapping.

## Conventions

- `.npmrc` sets `ignore-scripts=true` and `min-release-age=7` (days) — newly published dependency versions won't install until they are 7 days old.
- TypeScript 7 doesn't auto-include `@types/*`, so `tsconfig.json` lists `"types": ["node"]`.
- Commit messages use conventional-commit style (`chore: ...`).
