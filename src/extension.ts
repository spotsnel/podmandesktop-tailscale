import * as podmanDesktopAPI from '@podman-desktop/api';
import { exec } from './util';
import { BackendState, StatusResponse, TailscaleUpResponse } from './types';

const containerName = 'tailscale-system';
const containerImage = 'ghcr.io/spotsnel/tailscale-systemd/ubi9:latest';

export async function activate(extensionContext: podmanDesktopAPI.ExtensionContext): Promise<void> {
  console.log('Activating Tailscale extension');

  // determine if container exists
  const allContainers = await podmanDesktopAPI.containerEngine.listContainers();
  const tsContainer = allContainers.find(
    container => container.Image === containerImage && container.Names.includes('/' + containerName),
  );

  // if not, start it
  if (!tsContainer) {
    // we can't create the container using the API as `--systemd=always` is not available yet
    console.log('Creating container');
    await exec('podman', [
      'run -d',
      '--name=' + containerName,
      '--hostname podmandesktop-tailscale',
      '--network=host --systemd=always',
      '--cap-add=NET_ADMIN --cap-add=NET_RAW',
      containerImage,
    ]);
  } else {
    // check status
    if (tsContainer.State === 'exited') {
      console.log('Starting container');
      // podmanDesktopAPI.containerEngine.startContainer()
      await exec('podman', ['start', containerName]);
    }
  }

  const statusResponse = await getTailscaleStatus();
  const [status, rawStatus] = statusResponse;

  // check registration status
  // if not registered => "BackendState": "NeedsLogin"
  if (status.BackendState === 'NeedsLogin') {
    // no markdown description
    //const upResponse = await getTailscaleUp()

    await podmanDesktopAPI.window.showInformationMessage(
      'Please register node to your tailnet\n\n' + status.AuthURL,
      'OK',
    );
  }

  // set statusbar
  //const item = podmanDesktopAPI.window.createStatusBarItem(podmanDesktopAPI.StatusBarAlignRight, 100);
  //item.text = status.Health;
  //item.command = 'ts.open';
  //item.show();
}

export function deactivate(): void {
  console.log('Deactivating Tailscale extension');
}

async function getTailscaleStatus(): Promise<[StatusResponse, string]> {
  const status = await exec('podman', ['exec', containerName, 'tailscale status --json']);
  return [JSON.parse(status.stdOut), status.stdOut];
}

async function getTailscaleUp(): Promise<[TailscaleUpResponse, string]> {
  const up = await exec('podman', ['exec', containerName, 'tailscale up --reset --force-reauth --json']);
  return [JSON.parse(up.stdOut), up.stdOut];
}
