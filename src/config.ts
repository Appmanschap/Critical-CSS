import core from '@actions/core';
import fs from 'node:fs/promises';
import { resolve } from 'path';
import { Launcher as chromeLauncher } from 'chrome-launcher';

const getSyncOptions = async () => {
  const sshPrivateKey = core.getInput('sshPrivateKey');
  if (!sshPrivateKey) {
    // Fail and exit
    core.setFailed(`Sync enabled, but no sshPrivateKey supplied.`);
    process.exit(1);
  }

  const sshHost = core.getInput('sshHost');
  if (!sshHost) {
    // Fail and exit
    core.setFailed(`Sync enabled, but no sshHost supplied.`);
    process.exit(1);
  }
  const sshPort = core.getInput('sshPort');
  if (!sshPort) {
    // Fail and exit
    core.setFailed(`Sync enabled, but no sshPort supplied.`);
    process.exit(1);
  }
  const targetDir = core.getInput('targetDir');
  if (!targetDir) {
    // Fail and exit
    core.setFailed(`Sync enabled, but no targetDir supplied.`);
    process.exit(1);
  }

  // Generate private key for rsync
  const sshKeyPath = './key';
  if (sshPrivateKey.length) {
    await fs.writeFile(sshKeyPath, `${sshPrivateKey}\n`, {
      mode: 0o600,
      encoding: 'utf8'
    });
  }

  if (!sshHost || !targetDir) {
    core.setFailed(`Invalid ssh options provided.`);
    process.exit(1);
  }

  return {
    sshPrivateKey: sshKeyPath,
    sshHost: sshHost,
    sshPort: sshPort,
    targetDir: targetDir
  };
};

export async function getInput(): Promise<Config> {
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
  const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
  if (!config.length) {
    core.setFailed(`Invalid config.`);
    process.exit(1);
  }

  const browserPath = chromeLauncher.getFirstInstallation();


  const shouldSync = core.getInput('sync') === 'true';

  let syncOptions = null;
  if (shouldSync) {
    syncOptions = await getSyncOptions();
  }

  return {
    baseUrl: serverBaseUrl,
    destinationPath: destinationPath,
    paths: config,
    browserPath: browserPath,
    shouldSync: shouldSync,
    syncOptions: syncOptions
  };
}