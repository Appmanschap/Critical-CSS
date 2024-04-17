import { URL } from 'url';
import * as core from '@actions/core';
import { getInput } from './config';
import { generate } from 'critical';
import nodeRsync from 'rsyncwrapper';
import fs from 'node:fs/promises';

const getRsyncOptions = (input: Config): RsyncOptions | null => {

  let options: RsyncOptions | null = null;

  if (input.shouldSync && input.syncOptions !== null) {
    options = {
      src: input.destinationPath,
      dest: `${input.syncOptions.sshHost}:${input.syncOptions.targetDir}`,
      args: ['-azhcvv'],
      delete: true,
      ssh: true,
      port: input.syncOptions.sshPort,
      privateKey: input.syncOptions.sshPrivateKey
    };
  }
  return options;
};

const cleanOldCriticalFiles = async (options: RsyncOptions) => {
  core.startGroup('Clean up');
  await fs.mkdir(options.src);
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

const generateCriticalCSS = async (input: Config) => {
  for (let page of input.paths) {
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
  const input = await getInput();
  process.env.PUPPETEER_EXECUTABLE_PATH = input.browserPath;

  let rsyncOptions = getRsyncOptions(input);

  core.endGroup(); // Action config

  if (rsyncOptions !== null) {
    await cleanOldCriticalFiles(rsyncOptions);
  }

  core.startGroup('Start Critical CSS');
  await generateCriticalCSS(input);
  core.endGroup();

  if (input.shouldSync && rsyncOptions !== null) {
    core.startGroup(
      `Starting Rsync ${input.destinationPath} -> ${input?.syncOptions?.targetDir}`
    );

    nodeRsync(
      rsyncOptions,
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
