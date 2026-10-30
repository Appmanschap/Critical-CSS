# Critical CSS Action

This action generates critical CSS for a given set of pages & optionally syncs them to the remote server.

The generated files are meant for the [Vite](https://github.com/nystudio107/craft-vite) Craft plugin
(`craft.vite.includeCriticalCssTags()`), and work the same way with the older
[TwigPack](https://github.com/nystudio107/craft-twigpack) plugin. In `config/vite.php`:

- `criticalPath` must point to the directory the files are synced to (`targetDir`), e.g. `@webroot/assets/criticalcss`
- `criticalSuffix` must be `_critical.min.css` (the default)
- each `template` in the config file must match the Craft template path, as the plugin looks up
  `<criticalPath>/<template><criticalSuffix>` for the template being rendered

## How it works

1. **Prepare**: `destinationPath` is emptied, so only freshly generated files end up in it.
2. **Generate**: every page in the config file is loaded in headless Chromium by
   [Critical](https://github.com/addyosmani/critical) (v9, render engine via Playwright). The CSS rules that
   style what is visible above the fold are collected at each of the `dimensions` (by default mobile 375×667
   and desktop 1440×1280), combined, minified and written to `<destinationPath>/<template>_critical.min.css`.
   `concurrency` pages are generated at the same time. Warnings from Critical, and pages that produce no CSS,
   show up as warnings in the workflow log.
3. **Report**: a table with every page, its file, size and result is added to the job summary.
4. **Sync** (only when `sync` is `true`): `destinationPath` is rsynced to `targetDir` with `--delete`, so the
   remote ends up with exactly the generated files. The SSH key is written to a temporary directory outside
   the workspace and removed afterwards.

When a page fails, the other pages are still generated and synced, and the action fails. The remote CSS of
the failed page is deleted by the sync: it was generated from the previously deployed CSS, and no critical CSS
is better than critical CSS that no longer matches.

The action runs as a Docker container (`ghcr.io/appmanschap/critical-css-action`), based on Debian with
Playwright's Chromium, rsync and an SSH client installed.

## Inputs

### `serverBaseUrl`

**Required** The base url of the site to generate the CSS for. For example: `https://www.appmanschap.nl/`.
A trailing `/` is added when missing.

### `destinationPath`

**Optional** The path to (temporarily) store the generated CSS files. Defaults to `./criticalcss/`.
This directory is deleted and recreated at the start of every run, so it must be a subdirectory of the
workspace.

### `configPath`

**Required** The path to the critical CSS config file in the project. For example: `./critical-conf.json`

This file informs the action which pages to render CSS for. The structure is as follows:

```json
[
  {
    "url": "",
    "template": "_views/details/home/index"
  },
  {
    "url": "404",
    "template": "404"
  }
]
```

`url` is resolved relative to `serverBaseUrl` like a link in a page: `404` becomes `<serverBaseUrl>404`, but a
`url` starting with `/` points to the root of the domain and a full url is used as is. `template` determines the
output file name
(`_views/details/home/index` → `_views/details/home/index_critical.min.css`) and must stay inside
`destinationPath`.

It's a good idea to try & add all top level destinations to this file.

### `dimensions`

**Optional** Comma separated viewports, as `WIDTHxHEIGHT`, that define "above the fold". The critical CSS
of all viewports is combined. Defaults to `375x667,1440x1280`

### `concurrency`

**Optional** Number of pages to generate at the same time. Defaults to `2`

### `sync`

**Optional** Should this action rsync the result to the remote? `true` or `false`, defaults to `true`

The following inputs are required when `sync` is `true`:

### `sshPrivateKey`

**Required** The private key used to connect with the remote (the key itself, not a path). Use a secret for this.

### `sshHost`

**Required** The remote host to connect to in user@host format. For example: `user@appmanschap.nl`

### `sshPort`

**Optional** The SSH port. Defaults to `22`

### `knownHosts`

**Optional** `known_hosts` entries for the remote host, e.g. the output of `ssh-keyscan -p 22 appmanschap.nl`.
When set, the host key is verified; without it the action logs a warning and connects to any host key.
Use a secret or variable for this.

### `targetDir`

**Required** Directory to rsync generated files to. For example: `./public/assets/criticalcss/`

## Outputs

None for now

## Example usage with checkout

```yaml
- name: Checkout Private Critical CSS Action Repo
  uses: actions/checkout@v7
  with:
    repository: Appmanschap/Critical-CSS
    ref: v3.0.0
    path: .github/actions/critical-css
- name: Generate Critical CSS
  uses: ./.github/actions/critical-css
  with:
    serverBaseUrl: 'https://staging.appmanschap.nl/'
    destinationPath: './criticalcss/'
    configPath: './critical-conf.json'
    sync: 'true'
    sshPrivateKey: ${{ secrets.SSH_PRIVATE_KEY }}
    sshHost: ${{ secrets.SSH_HOST }}
    knownHosts: ${{ secrets.SSH_KNOWN_HOSTS }}
    targetDir: './public/assets/criticalcss/'
```

## Development

```sh
npm ci
npm run typecheck
npm run lint
npm run format        # or format:check
npm test              # vitest
npm run build         # bundle src/ into dist/ (not committed, the Docker image builds it)
```

Pull requests and pushes to `main` run these checks and a Docker build in the CI workflow. Dependabot
proposes weekly updates for npm, GitHub Actions and the Docker base image, at least 7 days after release
(matching `min-release-age` in `.npmrc`).

To test the action locally, build the image and run it with the inputs as `INPUT_*` environment variables:

```sh
docker build -t critical-css-action .
docker run --rm -v "$PWD/test:/work" -w /work \
  -e INPUT_SERVERBASEURL=https://www.appmanschap.nl/ \
  -e INPUT_CONFIGPATH=./critical-conf.json \
  -e INPUT_SYNC=false \
  critical-css-action
```

## Releasing

1. Bump the version in `package.json`, add an entry to `changelog.md` and update the image tag in `action.yml`.
2. Publish a GitHub release for that version (e.g. `v3.0.0`). This builds and pushes the Docker image to
   `ghcr.io/appmanschap/critical-css-action` with the release tag.
