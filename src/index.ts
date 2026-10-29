import * as core from '@actions/core';
import { critical } from 'critical';
import nodeRsync from 'rsyncwrapper';
import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { getInput } from './config.js';

const rsync = (options: RsyncOptions): Promise<string> =>
  new Promise((resolve, reject) => {
    nodeRsync(options, (error: Error | null, stdout: string, stderr: string, cmd: string) => {
      if (error) {
        core.error(`${stdout}\n${stderr}\n${cmd}`);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });

// Mirrors `source` to the remote. `delete` removes remote files that are no longer generated.
const syncToRemote = async (source: string, options: SyncOptions) => {
  // Keep the key outside the workspace and always remove it afterwards
  const sshDir = await fs.mkdtemp(join(process.env.RUNNER_TEMP || tmpdir(), 'critical-css-ssh-'));

  try {
    const privateKey = join(sshDir, 'key');
    await fs.writeFile(privateKey, `${options.sshPrivateKey.trim()}\n`, { mode: 0o600 });

    let sshCmdArgs = ['-o StrictHostKeyChecking=no', '-o UserKnownHostsFile=/dev/null'];
    if (options.knownHosts) {
      const knownHosts = join(sshDir, 'known_hosts');
      await fs.writeFile(knownHosts, `${options.knownHosts.trim()}\n`);
      sshCmdArgs = ['-o StrictHostKeyChecking=yes', `-o UserKnownHostsFile=${knownHosts}`];
    } else {
      core.warning('No knownHosts supplied, the identity of the remote host is not verified.');
    }

    core.info(
      await rsync({
        // The trailing slash syncs the contents of the directory instead of the directory itself
        src: `${source}/`,
        dest: `${options.sshHost}:${options.targetDir}`,
        args: ['-azhcvv'],
        delete: true,
        ssh: true,
        port: options.sshPort,
        privateKey,
        sshCmdArgs,
      }),
    );
  } finally {
    await fs.rm(sshDir, { recursive: true, force: true });
  }
};

const generatePage = async (input: Config, page: Page): Promise<PageResult> => {
  const url = new URL(page.url, input.baseUrl).href;
  const file = join(input.destinationPath, `${page.template}_critical.min.css`);
  core.info(`Generating critical CSS: ${url} -> ${file}`);

  try {
    // The render engine loads the page in Chromium (via Playwright) and keeps the rules that
    // style what is painted above the fold; the results of all viewports are combined
    const { css, report } = await critical({
      src: url,
      engine: 'render',
      dimensions: input.dimensions,
    });

    const warnings = css.trim()
      ? report.warnings
      : [...report.warnings, 'No critical CSS was generated.'];
    warnings.forEach((warning) => core.warning(`${url}: ${warning}`));

    await fs.mkdir(dirname(file), { recursive: true });
    await fs.writeFile(file, css);
    return { url, file, bytes: Buffer.byteLength(css), warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    core.error(`${url}: ${message}`);
    return { url, file, bytes: 0, warnings: [], error: message };
  }
};

// At most `concurrency` pages are generated at a time, in config order
const generateCriticalCSS = async (input: Config): Promise<PageResult[]> => {
  const results: PageResult[] = [];
  const queue = input.pages.map((page, index) => ({ page, index }));

  const worker = async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      results[item.index] = await generatePage(input, item.page);
    }
  };
  await Promise.all(Array.from({ length: Math.min(input.concurrency, queue.length) }, worker));

  return results;
};

const writeSummary = async (results: PageResult[]) => {
  // Only available when running on a GitHub runner
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  const status = (result: PageResult) =>
    result.error
      ? `❌ ${result.error}`
      : result.warnings.length
        ? `⚠️ ${result.warnings.join(' ')}`
        : '✅';

  await core.summary
    .addHeading('Critical CSS')
    .addTable([
      ['Page', 'File', 'Size', 'Result'].map((data) => ({ data, header: true })),
      ...results.map((result) => [
        result.url,
        relative(process.cwd(), result.file),
        `${(result.bytes / 1024).toFixed(1)} kB`,
        status(result),
      ]),
    ])
    .write();
};

const main = async () => {
  const input = await getInput();

  // Start from an empty directory, so the sync never uploads stale files
  await fs.rm(input.destinationPath, { recursive: true, force: true });
  await fs.mkdir(input.destinationPath, { recursive: true });

  core.startGroup('Generate critical CSS');
  const results = await generateCriticalCSS(input);
  core.endGroup();
  await writeSummary(results);

  const failed = results.filter((result) => result.error).map((result) => result.url);
  if (failed.length) {
    // Don't sync, that would delete the remote CSS of the failed pages
    throw new Error(`Generating critical CSS failed for: ${failed.join(', ')}`);
  }

  if (input.sync) {
    core.startGroup(
      `Rsync ${input.destinationPath} -> ${input.sync.sshHost}:${input.sync.targetDir}`,
    );
    await syncToRemote(input.destinationPath, input.sync);
    core.endGroup();
  }
};

main()
  .then(() => core.debug(`done in ${process.uptime()}s`))
  .catch((error) => core.setFailed(error instanceof Error ? error.message : String(error)));
