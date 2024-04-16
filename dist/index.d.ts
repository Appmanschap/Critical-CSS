import { URL } from 'url';
import * as core from '@actions/core';
import core__default from '@actions/core';
import fs from 'fs';
import { resolve } from 'path';
import { Launcher } from 'chrome-launcher';
import { generate } from 'critical';
import nodeRsync from 'rsyncwrapper';

function getInput() {
  let serverBaseUrl = core__default.getInput('serverBaseUrl');
  if (!serverBaseUrl) {
    // Fail and exit
    core__default.setFailed(`Need a valid base url.`);
    process.exit(1);
  }

  // Make sure we end with a '/'
  if (serverBaseUrl.substr(-1) !== '/') {
    serverBaseUrl += '/';
  }

  const destinationPath = core__default.getInput('destinationPath');
  if (!destinationPath) {
    // Fail and exit
    core__default.setFailed(`Need a valid destination path.`);
    process.exit(1);
  }

  const configPath = core__default.getInput('configPath')
    ? resolve(core__default.getInput('configPath'))
    : null;

  if (!configPath) {
    // Fail and exit
    core__default.setFailed(`Config file not found or invalid configPath.`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath));
  if (!config.length) {
    core__default.setFailed(`Invalid config.`);
    process.exit(1);
  }

  const browserPath = Launcher.getFirstInstallation();


  const shouldSync = core__default.getInput('sync');

  let syncOptions = {};
  if (shouldSync) {
    const sshPrivateKeyPath = core__default.getInput('sshPrivateKeyPath');
    const sshHost = core__default.getInput('sshHost');
    const sshPort = core__default.getInput('sshPort');
    const targetDir = core__default.getInput('targetDir');

    if (!sshHost || !targetDir) {
      core__default.setFailed(`Invalid ssh options provided.`);
      process.exit(1);
    }

    syncOptions = {
      sshPrivateKeyPath: sshPrivateKeyPath,
      sshHost: sshHost,
      sshPort: sshPort,
      targetDir: targetDir,
    };
  }

  return {
    baseUrl: serverBaseUrl,
    destinationPath: destinationPath,
    paths: config,
    browserPath: browserPath,
    shouldSync: shouldSync,
    syncOptions: syncOptions,
  };
}

const cleanOldCriticalFiles = async (options) => {
  core.startGroup('Clean up');
  fs.mkdirSync(options.src);
  nodeRsync(
    options,
    (error, stdout, stderr, cmd) => {
      if (error) {
        core.error(error);
        core.error(stdout);
        core.error(stderr);
        core.error(cmd);
        process.exit(1);
      } else {
        core.info('Rsync cleanup finished');
        core.info(stdout);
      }
    }
  );
  core.endGroup();
};

const generateCriticalCSS = async (input) => {
  for (let page of input.paths) {
    console.log(page);
    const pageUrl = new URL(`${input.baseUrl}${page.url}`);
    const criticalDest =
      input.destinationPath + page.template + '_critical.min.css';

    core.info(`Generating critical CSS: ${pageUrl.href} -> ${criticalDest}`);

    await generate({
      src: pageUrl.href,
      target: criticalDest,
      inline: false,
      penthouse: {
        chromeFlags: {}
      },
      ignore: [],
      //   minify: true,
      dimensions: [
        {
          width: 375,
          height: 667
        },
        {
          width: 1440,
          height: 1280
        }
      ]
    });
  }
};

const main = async () => {
  core.startGroup('Action config');
  const input = getInput();
  process.env.PUPPETEER_EXECUTABLE_PATH = input.browserPath;

  let options = {
    src: input.destinationPath,
    dest: `${input.syncOptions.sshHost}:${input.syncOptions.targetDir}`,
    args: ['-azhcvv'],
    delete: true,
    ssh: true,
    port: input.syncOptions.sshPort
  };

  if (input.syncOptions.sshPrivateKeyPath.length) {
    options['privateKey'] = input.syncOptions.sshPrivateKeyPath;
  }

  core.endGroup(); // Action config

  await cleanOldCriticalFiles(options);

  core.startGroup('Start Critical CSS');
  await generateCriticalCSS(input);
  core.endGroup();

  if (input.shouldSync) {
    core.startGroup(
      `Starting Rsync ${input.destinationPath} -> ${input.syncOptions.targetDir}`
    );

    nodeRsync(
      options,
      (error, stdout, stderr, cmd) => {
        if (error) {
          core.error(error);
          core.error(stdout);
          core.error(stderr);
          core.error(cmd);
          process.exit(1);
        } else {
          core.info('Rsync finished');
          core.info(stdout);
        }
      }
    );
    core.endGroup();
  }
};

main()
  .catch((err) => {
    core.setFailed(err.message);
    process.exit(1);
  })
  .then(() => core.debug(`done in ${process.uptime()}s`));
