// Only the parts of critical 9's API this action uses (it ships no typings)
declare module 'critical' {
  export function critical(options: {
    src: string;
    engine: 'render';
    dimensions: Dimensions[];
  }): Promise<{ css: string; report: { warnings: string[] } }>;
}

type Dimensions = { width: number; height: number };

type Page = {
  url: string;
  template: string;
};

type Config = {
  baseUrl: string;
  destinationPath: string;
  pages: Page[];
  dimensions: Dimensions[];
  concurrency: number;
  sync: SyncOptions | null;
};

type SyncOptions = {
  sshPrivateKey: string;
  sshHost: string;
  sshPort: string;
  knownHosts: string;
  targetDir: string;
};

type PageResult = {
  url: string;
  file: string;
  bytes: number;
  warnings: string[];
  error?: string;
};

type RsyncOptions = {
  src: string;
  dest: string;
  args: string[];
  delete: boolean;
  ssh: boolean;
  port: string;
  privateKey: string;
  sshCmdArgs: string[];
};
