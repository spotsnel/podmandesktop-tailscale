import * as podmanDesktopAPI from '@podman-desktop/api';
import { exec } from './util';

const containerName = 'tailscale-system';
const containerImage = 'ghcr.io/spotsnel/tailscale-systemd:latest';

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

  const status = await (await exec('podman', ['exec', containerName, 'tailscale', 'status', '--json'])).stdOut;
  // check registration status
  console.log(status);

  // if not registered => "BackendState": "NeedsLogin"
  //   register

  // else, get status

  // set statusbar
  //const item = podmanDesktopAPI.window.createStatusBarItem(podmanDesktopAPI.StatusBarAlignRight, 100);
  //item.text = status.Health;
  //item.command = 'ts.open';
  //item.show();
}

export function deactivate(): void {
  console.log('Deactivating Tailscale extension');
}
