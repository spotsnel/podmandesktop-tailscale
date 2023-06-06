import * as extensionApi from '@podman-desktop/api';

export async function activate(extensionContext: extensionApi.ExtensionContext): Promise<void> {
  console.log('Activating Tailscale extension');
}


export function deactivate(): void {
  console.log('Deactivating Tailscale extension');
}
