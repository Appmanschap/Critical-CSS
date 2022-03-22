# Critical CSS Action

This action generates critical css for a given set of pages & optionally syncs them to the remote server.
The generated CSS can be used by the [TwigPack](https://github.com/nystudio107/craft-twigpack/) craft plugin.

## Inputs

### `serverBaseUrl`

**Required** The base url of the site to generate the css for. For example: `https://www.appmanschap.nl/`.

### `destinationPath`

**Optional** The path to (temporarily) store the generated css files. Defaults to `./criticalcss/`

### `configPath`
**Required** The path to the critical css config file in the project. For example: `./critical-conf.json`

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
It's a good idea to try & add all top level destinations to this file.

### `sync`

**Optional** Should this action rsync the result to the remote? Defaults to `true`

The following inputs are required when `sync` is true:

### `sshPrivateKeyPath`

**Required** Path to the private key file used to connect with the remote. For example: `~/.ssh/deploy_rsa`

### `sshHost`

**Required** The remote host to connect to in user@host format. For example: `user@appmanschap.nl`


### `targetDir`

**Required** Directory to rsync generated files to. For example: `./public/assets/criticalcss/`

## Outputs

None for now

## Example usage with checkout

```yaml
- name: Checkout Private Critical CSS Action Repo
  uses: actions/checkout@v2
  with:
    repository: Appmanschap/Critical-CSS
    path: .github/actions/critical-css
- name: Generate Critical CSS
  uses: ./.github/actions/critical-css
  with:
    serverBaseUrl: 'https://staging.appmanschap.nl/'
    destinationPath: './criticalcss/'
    configPath: './critical-conf.json'
    sync: 'true'
    sshPrivateKeyPath: '~/.ssh/gaafproject_rsa'
    sshHost: $SSH_HOST
    targetDir: './public/assets/criticalcss/'
```

## Development
When committing this action, make sure to also commit the _entire_ `node_modules` directory.
Also make sure to skip installation of chrome when running yarn:
`echo "export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true && yarn" | sh`

## Building
Run `npm run package` to build the package
