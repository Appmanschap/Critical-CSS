# Changelog

## 3.0.0

Upgrade to Critical 9, sync once after generation, safer SSH handling and input validation.

### Breaking changes

- Critical CSS is generated with Critical 9's render engine (Playwright + Chromium) instead of Critical 8
  (Puppeteer + penthouse); the generated CSS will differ from earlier versions
- `destinationPath` is emptied on every run (previously only when syncing) and must be a subdirectory of the
  workspace
- `url` in the config file is resolved like a link: a `url` starting with `/` points to the root of the domain
  instead of being appended to `serverBaseUrl`
- The config file is validated: every page needs a string `url` and a non-empty `template`, and a `template`
  may not point outside `destinationPath`
- `sync` must be a boolean (`true`/`false`); other values now fail instead of disabling the sync
- The Docker image is based on Debian (`node:26-trixie-slim`) instead of Alpine, as Playwright doesn't support
  Alpine

### Changes

- The remote is synced once, after all pages are generated, with `--delete`; previously the remote CSS was
  deleted before generation, leaving the site without critical CSS during the run
- A failing page no longer stops the other pages; the other pages are still synced and the action fails
  afterwards. The remote CSS of the failed page is deleted, as it no longer matches the deployed CSS
- Pages are generated in parallel, see the new `concurrency` input (default `2`)
- New `dimensions` input for the viewports (default `375x667,1440x1280`, as before)
- New `knownHosts` input to verify the remote host key; without it a warning is logged
- `targetDir` is only required when `sync` is `true`
- The SSH key is written to a temporary directory outside the workspace and removed afterwards
- A table with every page, file, size and result is added to the job summary
- Pages without any critical CSS are reported as a warning
- Fix the base url check, a url that already ended with `/` got a double slash
- Fix `action.yml` still pointing to the 2.1.1 image

### Development

- `dist/` is no longer committed, the multi-stage Docker image builds it
- Added a CI workflow (type check, lint, format, tests, build and Docker build), vitest tests and Dependabot
- Removed unused dependencies (`chrome-launcher`, `command-exists`, `@actions/github`) and updated the others
- Updated the GitHub Actions in the release workflow
- The readme documents how the action works, all inputs (fixing `sshPrivateKey` and the missing `sshPort`) and
  the setup with the Vite Craft plugin

## 2.1.2

Updates & npm audit fix

## 2.1.1

Updates & npm audit fix

## 2.1.0

Use proper versioning to prevent cache issues on runner

## 2.0.10

Update dependencies and fix (some) security warnings

## 2.0.9

Update dependencies and fix (some) security warnings

## 2.0.8

Update dependencies and fix security warnings

## 2.0.7

Update dependencies and fix security warnings

## 2.0.6

Update dependencies and fix security warnings

## 2.0.5

Update dependencies & fix security warnings

## 2.0.4

Update dependencies & fix security warnings

## 2.0.3

Update dependencies & fix security warnings

## 2.0.2

Update dependencies & fix security warnings

## 2.0.1

Update dependencies & fix security warnings

## 2.0.0

Update dependencies

Due to Node.js & dependency updates we now use type `module` (e.g. esm).
This breaks ncc, so we refactored this action to a Docker action instead.

Also switch to TypeScript

## 1.0.7 - 1.0.8 - 1.0.9 - 1.0.10 - 1.0.11

Delete old critical files on server first

## 1.0.6

Fix optional private key

## 1.0.5

Bump dependencies, add optional port parameter, made sshPrivateKeyPath optional

## 1.0.4

Bump dependencies, use `pnpm` to fix some audit issues

## 1.0.3

Bump dependencies, use ncc to build package

## 1.0.2

Audit fix

## 1.0.1

Update npm packages to fix lodash vulnerability

## 1.0.0

Initial release
