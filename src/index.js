const core = require('@actions/core');
const { getInput } = require('./config');
const critical = require('critical');
const URL = require('url');
const nodeRsync = require('rsyncwrapper');

const generateCriticalCSS = async (input) => {
  for (let page of input.paths) {
    const pageUrl = URL.parse(`${input.baseUrl}${page.url}`);
    const criticalDest =
      input.destinationPath + page.template + '_critical.min.css';

    core.info(`Generating critical CSS: ${pageUrl.href} -> ${criticalDest}`);

    await critical.generate({
      src: pageUrl.href,
      target: criticalDest,
      inline: false,
      ignore: [],
      minify: true,
      dimensions: [
        {
          width: 375,
          height: 667,
        },
        {
          width: 1440,
          height: 1280,
        },
      ],
    });
  }
};

const main = async () => {
  core.startGroup('Action config');
  const input = getInput();
  process.env.PUPPETEER_EXECUTABLE_PATH = input.browserPath;
  core.endGroup(); // Action config

  core.startGroup('Start Critical CSS');
  await generateCriticalCSS(input);
  core.endGroup();

  if (input.shouldSync) {
    core.startGroup(
      `Starting Rsync ${input.destinationPath} -> ${input.syncOptions.targetDir}`
    );
    nodeRsync(
      {
        src:
          input.destinationPath.substr(-1) === '/'
            ? input.destinationPath.substr(0, -1)
            : input.destinationPath,
        dest: `${input.syncOptions.sshHost}:${input.syncOptions.targetDir}`,
        args: ['-azhcvv'],
        privateKey: input.syncOptions.sshPrivateKeyPath,
        delete: true,
        ssh: true,
      },
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
