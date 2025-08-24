import axios from 'axios';
import JSZip from 'jszip';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';
import { Dialog } from '@capacitor/dialog';

const VERSION_JSON_URL = 'https://gocodora.vercel.app/version.json';
const BUILD_TIME_VERSION = '1.0.0';
const UPDATE_DIRECTORY = 'capacitor_data';

async function getCurrentVersion(): Promise<string> {
  const { value } = await Preferences.get({ key: 'app_version' });
  return value ?? BUILD_TIME_VERSION;
}

async function saveCurrentVersion(version: string) {
  await Preferences.set({ key: 'app_version', value: version });
}

function compareVersions(v1: string, v2: string): number {
  const a = v1.split('.').map(Number);
  const b = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

async function downloadAndApplyUpdate(updateUrl: string, newVersion: string): Promise<boolean> {
  try {
    // Clear old update if any
    await Filesystem.rmdir({
      path: UPDATE_DIRECTORY,
      directory: Directory.Data,
      recursive: true,
    }).catch(() => {});

    await Filesystem.mkdir({
      path: UPDATE_DIRECTORY,
      directory: Directory.Data,
      recursive: true,
    });

    const response = await axios.get(updateUrl, { responseType: 'arraybuffer' });
    const zip = await JSZip.loadAsync(response.data);

    const fileWrites = Object.entries(zip.files).map(async ([relativePath, file]) => {
      if (file.dir) {
        await Filesystem.mkdir({
          path: `${UPDATE_DIRECTORY}/${relativePath}`,
          directory: Directory.Data,
          recursive: true,
        });
      } else {
        const fileData = await file.async('base64');
        await Filesystem.writeFile({
          path: `${UPDATE_DIRECTORY}/${relativePath}`,
          data: fileData,
          directory: Directory.Data,
          recursive: true,
        });
      }
    });

    await Promise.all(fileWrites);

    await saveCurrentVersion(newVersion);
    await Preferences.set({
      key: 'server_base_path',
      value: `${UPDATE_DIRECTORY}`,
    });

    return true;
  } catch (error) {
    console.error('Update download failed:', error);
    return false;
  }
}

export async function checkForInteractiveUpdate() {
  try {
    const currentVersion = await getCurrentVersion();
    const response = await axios.get(VERSION_JSON_URL);
    const remoteVersion = response.data.version;
    const updateUrl = response.data.zipUrl;

    if (compareVersions(remoteVersion, currentVersion) > 0) {
      const confirmResult = await Dialog.confirm({
        title: 'Update Available',
        message: `A new version  is available. Do you want to download and apply it now?`,
      });

      if (confirmResult.value) {
        const success = await downloadAndApplyUpdate(updateUrl, remoteVersion);
        if (success) {
          await Dialog.alert({
            title: 'Update Installed',
            message: 'The app will close to apply updates',
          });

          App.exitApp(); 
        }
      }
    } else {
      console.log('App is up to date.');
    }
  } catch (error) {
    console.error('Error checking for update:', error);
  }
}
