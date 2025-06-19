// utils/getAssetUri.ts
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';

export async function getAssetUri(relativePath: string): Promise<string> {
  const { value: basePath } = await Preferences.get({ key: 'server_base_path' });

  try {
    const fullPath = basePath ? `${basePath}/${relativePath}` : relativePath;

    const uriResult = await Filesystem.getUri({
      path: fullPath,
      directory: Directory.Data
    });

    return uriResult.uri;
  } catch {
    // fallback if image isn't found in update dir
    return `/assets/${relativePath}`;
  }
}
