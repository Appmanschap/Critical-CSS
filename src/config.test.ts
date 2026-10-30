import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getInput, normalizeBaseUrl, parseDimensions, parsePages } from './config.js';

describe('normalizeBaseUrl', () => {
  it('adds a trailing slash once', () => {
    expect(normalizeBaseUrl('https://example.com/blog')).toBe('https://example.com/blog/');
    expect(normalizeBaseUrl('https://example.com/blog/')).toBe('https://example.com/blog/');
    expect(normalizeBaseUrl('https://example.com')).toBe('https://example.com/');
  });

  it('rejects invalid and non-http urls', () => {
    expect(() => normalizeBaseUrl('example.com')).toThrow();
    expect(() => normalizeBaseUrl('ftp://example.com/')).toThrow(/http/);
  });
});

describe('parsePages', () => {
  it('parses a list of pages', () => {
    const pages = [
      { url: '', template: '_views/home/index' },
      { url: '404', template: '404' },
    ];
    expect(parsePages(JSON.stringify(pages))).toEqual(pages);
  });

  it.each([
    ['{}'],
    ['[]'],
    ['[{"url": ""}]'],
    ['[{"template": "home"}]'],
    ['[{"url": "", "template": ""}]'],
    ['[null]'],
  ])('rejects %s', (json) => {
    expect(() => parsePages(json)).toThrow();
  });

  it.each([['../home'], ['a/../../home'], ['/etc/home']])(
    'rejects template %s outside the destination',
    (template) => {
      expect(() => parsePages(JSON.stringify([{ url: '', template }]))).toThrow(/outside/);
    },
  );
});

describe('parseDimensions', () => {
  it('parses a comma separated list', () => {
    expect(parseDimensions('375x667, 1440x1280')).toEqual([
      { width: 375, height: 667 },
      { width: 1440, height: 1280 },
    ]);
  });

  it.each([['375'], ['375x'], ['axb'], ['375x667,']])('rejects %s', (value) => {
    expect(() => parseDimensions(value)).toThrow();
  });
});

describe('getInput', () => {
  const env = { ...process.env };
  const cwd = process.cwd();
  let workspace: string;

  const setInputs = (inputs: Record<string, string>) => {
    for (const [name, value] of Object.entries(inputs)) {
      process.env[`INPUT_${name.toUpperCase()}`] = value;
    }
  };

  beforeEach(async () => {
    workspace = await fs.realpath(await fs.mkdtemp(join(tmpdir(), 'critical-css-test-')));
    process.chdir(workspace);
    await fs.writeFile('critical-conf.json', JSON.stringify([{ url: '', template: 'home' }]));
    setInputs({
      serverBaseUrl: 'https://example.com',
      configPath: './critical-conf.json',
      sync: 'false',
    });
  });

  afterEach(async () => {
    process.env = { ...env };
    process.chdir(cwd);
    await fs.rm(workspace, { recursive: true, force: true });
  });

  it('applies defaults', async () => {
    expect(await getInput()).toEqual({
      baseUrl: 'https://example.com/',
      destinationPath: join(workspace, 'criticalcss'),
      pages: [{ url: '', template: 'home' }],
      dimensions: [
        { width: 375, height: 667 },
        { width: 1440, height: 1280 },
      ],
      concurrency: 2,
      sync: null,
    });
  });

  it('requires the ssh inputs when syncing', async () => {
    setInputs({ sync: 'true', sshHost: 'user@example.com', targetDir: './public/' });
    await expect(getInput()).rejects.toThrow(/sshPrivateKey/);

    setInputs({ sshPrivateKey: 'key' });
    expect((await getInput()).sync).toEqual({
      sshPrivateKey: 'key',
      sshHost: 'user@example.com',
      sshPort: '22',
      knownHosts: '',
      targetDir: './public/',
    });
  });

  it.each([['./'], ['../elsewhere'], ['/tmp']])(
    'rejects destinationPath %s',
    async (destinationPath) => {
      setInputs({ destinationPath });
      await expect(getInput()).rejects.toThrow(/subdirectory/);
    },
  );

  it('rejects an invalid concurrency', async () => {
    setInputs({ concurrency: '0' });
    await expect(getInput()).rejects.toThrow(/concurrency/);
  });
});
