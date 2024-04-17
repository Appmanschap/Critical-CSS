declare module 'critical';

type Config = {
  baseUrl: string;
  destinationPath: string;
  paths: {
    url: string;
    template: string;
  }[];
  browserPath?: string;
  shouldSync: boolean;
  syncOptions: SyncOptions | null;
}

type SyncOptions = {
  sshPrivateKey: string;
  sshHost: string;
  sshPort: string;
  targetDir: string;
}

type RsyncOptions = {
  src: string;
  dest: string;
  args: string[];
  delete: boolean;
  ssh: boolean;
  port: string;
  privateKey: string;
}