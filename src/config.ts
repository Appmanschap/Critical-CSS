import * as core from '@actions/core';
import fs from 'node:fs/promises';
import { isAbsolute, normalize, relative, resolve, sep } from 'node:path';

export const normalizeBaseUrl = (value: string): string => {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`serverBaseUrl must be an http(s) url, got "${value}".`);
  }

  // Page urls are appended to the base url, so make sure it ends with a '/'
  return url.href.endsWith('/') ? url.href : `${url.href}/`;
};

export const parsePages = (json: string): Page[] => {
  const pages: unknown = JSON.parse(json);
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('The config file must contain a non-empty array of pages.');
  }

  return pages.map((page: unknown, index: number): Page => {
    const { url, template } = (page ?? {}) as Partial<Page>;
    if (typeof url !== 'string' || typeof template !== 'string' || template === '') {
      throw new Error(
        `Page ${index} in the config file needs a string "url" and a non-empty "template".`,
      );
    }

    // The template becomes the output file path, it must stay inside the destination directory
    const file = normalize(template);
    if (isAbsolute(file) || file === '..' || file.startsWith(`..${sep}`)) {
      throw new Error(
        `Page ${index} has a template outside the destination directory: "${template}".`,
      );
    }

    return { url, template };
  });
};

export const parseDimensions = (value: string): Dimensions[] =>
  value.split(',').map((dimension) => {
    const match = /^\s*(\d+)x(\d+)\s*$/.exec(dimension);
    if (!match) {
      throw new Error(`Invalid dimension "${dimension}", expected WIDTHxHEIGHT (e.g. 375x667).`);
    }

    return { width: Number(match[1]), height: Number(match[2]) };
  });

const parseConcurrency = (value: string): number => {
  const concurrency = Number(value);
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error(`concurrency must be a positive integer, got "${value}".`);
  }

  return concurrency;
};

// destinationPath is emptied on every run, so refuse anything that isn't a subdirectory of the workspace
const resolveDestinationPath = (value: string): string => {
  const destination = resolve(value);
  const fromWorkspace = relative(process.cwd(), destination);
  if (fromWorkspace === '' || fromWorkspace.startsWith('..') || isAbsolute(fromWorkspace)) {
    throw new Error(`destinationPath must be a subdirectory of the workspace, got "${value}".`);
  }

  return destination;
};

const getSyncOptions = (): SyncOptions => {
  const required = { required: true };

  return {
    sshPrivateKey: core.getInput('sshPrivateKey', required),
    sshHost: core.getInput('sshHost', required),
    sshPort: core.getInput('sshPort') || '22',
    knownHosts: core.getInput('knownHosts'),
    targetDir: core.getInput('targetDir', required),
  };
};

export async function getInput(): Promise<Config> {
  const configPath = resolve(core.getInput('configPath', { required: true }));

  return {
    baseUrl: normalizeBaseUrl(core.getInput('serverBaseUrl', { required: true })),
    destinationPath: resolveDestinationPath(core.getInput('destinationPath') || './criticalcss/'),
    pages: parsePages(await fs.readFile(configPath, 'utf-8')),
    dimensions: parseDimensions(core.getInput('dimensions') || '375x667,1440x1280'),
    concurrency: parseConcurrency(core.getInput('concurrency') || '2'),
    sync: core.getBooleanInput('sync') ? getSyncOptions() : null,
  };
}
