const core = require('@actions/core');
const fs = require('fs');
const { resolve } = require('path');
const chromeLauncher = require('chrome-launcher').Launcher;

exports.getInput = function getInputArgs() {
  let serverBaseUrl = core.getInput('serverBaseUrl');
  if (!serverBaseUrl) {
    // Fail and exit
    core.setFailed(`Need a valid base url.`);
    process.exit(1);
  }

  // Make sure we end with a '/'
  if (serverBaseUrl.charAt(-1) !== '/') {
    serverBaseUrl += '/';
  }

  const destinationPath = core.getInput('destinationPath');
  if (!destinationPath) {
    // Fail and exit
    core.setFailed(`Need a valid destination path.`);
    process.exit(1);
  }

  const configPath = core.getInput('configPath')
    ? resolve(core.getInput('configPath'))
    : null;

  if (!configPath) {
    // Fail and exit
    core.setFailed(`Config file not found or invalid configPath.`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath));

  if (!config.length) {
    core.setFailed(`Invalid config.`);
    process.exit(1);
  }

  const browserPath = chromeLauncher.getFirstInstallation();

  return {
    baseUrl: serverBaseUrl,
    destinationPath: destinationPath,
    paths: config,
    browserPath: browserPath,
  };
};
