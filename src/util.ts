import * as os from 'node:os';
import { spawn } from 'node:child_process';

const windows = os.platform() === 'win32';
export function isWindows(): boolean {
  return windows;
}
const mac = os.platform() === 'darwin';
export function isMac(): boolean {
  return mac;
}
const linux = os.platform() === 'linux';
export function isLinux(): boolean {
  return linux;
}

export interface SpawnResult {
  exitCode: number;
  stdOut: string;
  stdErr: string;
}

export interface RunOptions {
  env: NodeJS.ProcessEnv | undefined;
}

export function exec(command: string, args: string[], options?: RunOptions): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    let output = '';
    let err = '';
    let env = Object.assign({}, process.env);

    if (options?.env) {
      env = Object.assign(env, options.env);
    }

    if (isWindows()) {
      // Escape any whitespaces in command
      command = `"${command}"`;
    } else if (env.FLATPAK_ID) {
      // need to execute the command on the host
      args = ['--host', command, ...args];
      command = 'flatpak-spawn';
    }

    const spawnProcess = spawn(command, args, { shell: isWindows(), env });
    spawnProcess.on('error', err => {
      reject(err);
    });
    spawnProcess.stdout.setEncoding('utf8');
    spawnProcess.stdout.on('data', data => {
      output += data;
    });
    spawnProcess.stderr.setEncoding('utf8');
    spawnProcess.stderr.on('data', data => {
      err += data;
    });

    spawnProcess.on('close', exitCode => {
      resolve({ exitCode, stdOut: output, stdErr: err });
    });
  });
}
