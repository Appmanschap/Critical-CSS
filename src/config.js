import core from '@actions/core';
import fs from 'fs';
import { resolve } from 'path';
import { Launcher as chromeLauncher } from 'chrome-launcher';

export function getInput() {
  let serverBaseUrl = core.getInput('serverBaseUrl');
  if (!serverBaseUrl) {
    // Fail and exit
    core.setFailed(`Need a valid base url.`);
    process.exit(1);
  }

  // Make sure we end with a '/'
  if (serverBaseUrl.substring(-1) !== '/') {
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


  const shouldSync = core.getInput('sync');

  let syncOptions = {};
  if (shouldSync) {
    const sshPrivateKey = core.getInput('sshPrivateKey') || '';
    const sshHost = core.getInput('sshHost');
    const sshPort = core.getInput('sshPort');
    const targetDir = core.getInput('targetDir');

    if (!sshHost || !targetDir) {
      core.setFailed(`Invalid ssh options provided.`);
      process.exit(1);
    }

    syncOptions = {
      sshPrivateKey: sshPrivateKey,
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
