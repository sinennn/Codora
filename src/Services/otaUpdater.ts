import axios from 'axios';
import JSZip from 'jszip';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';

const VERSION_JSON_URL = 'https://codora-gamma.vercel.app/version.json';
const BUILD_TIME_VERSION = '1.0.0';
const UPDATE_DIRECTORY = 'capacitor_data';
const UPDATE_STATUS_KEY = 'update_status';

interface UpdateStatus {
  version: string;
  lastCheck: number;
  updateAvailable: boolean;
  updateDownloaded: boolean;
}

export async function checkForUpdate() {
  try {
    const currentVersion = await getCurrentVersion();
    console.log('Current version:', currentVersion);

    const response = await axios.get(VERSION_JSON_URL);
    const remoteVersion = response.data.version;
    const updateUrl = response.data.zipUrl;

    console.log('Remote version:', remoteVersion);

    if (compareVersions(remoteVersion, currentVersion) > 0) {

      downloadUpdateInBackground(updateUrl, remoteVersion);
    } else {
      console.log('App is up to date.');
    }
  } catch (err) {
    console.error('Error checking for update:', err);
    throw err;
  }
}

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

async function setUpdateStatus(status: UpdateStatus) {
  await Preferences.set({
    key: UPDATE_STATUS_KEY,
    value: JSON.stringify(status)
  });
}

export async function getUpdateStatus(): Promise<UpdateStatus | null> {
  const { value } = await Preferences.get({ key: UPDATE_STATUS_KEY });
  return value ? JSON.parse(value) : null;
}

async function downloadUpdateInBackground(updateUrl: string, newVersion: string) {
  try {
    await setUpdateStatus({
      version: newVersion,
      lastCheck: Date.now(),
      updateAvailable: true,
      updateDownloaded: false
    });

    try {
      await Filesystem.rmdir({
        path: UPDATE_DIRECTORY,
        directory: Directory.Data,
        recursive: true
      });
    } catch {
      // Directory might not exist, that's okay
    }

    await Filesystem.mkdir({
      path: UPDATE_DIRECTORY,
      directory: Directory.Data,
      recursive: true
    });

    const response = await axios.get(updateUrl, { responseType: 'arraybuffer' });
    const zip = await JSZip.loadAsync(response.data);

    // Process files while maintaining directory structure
    const filePromises = Object.entries(zip.files).map(async ([relativePath, file]) => {
      if (file.dir) {
        // Create directory
        await Filesystem.mkdir({
          path: `${UPDATE_DIRECTORY}/${relativePath}`,
          directory: Directory.Data,
          recursive: true
        });
        return;
      }

      // Get file data and write it
      const fileData = await file.async('base64');
      await Filesystem.writeFile({
        path: `${UPDATE_DIRECTORY}/${relativePath}`,
        data: fileData,
        directory: Directory.Data,
        recursive: true
      });
    });

    await Promise.all(filePromises);

    await setUpdateStatus({
      version: newVersion,
      lastCheck: Date.now(),
      updateAvailable: true,
      updateDownloaded: true
    });

    await Preferences.set({
      key: 'server_base_path',
      value: `${UPDATE_DIRECTORY}`
    });

  } catch (error) {
    console.error('Background update download failed:', error);
    await setUpdateStatus({
      version: newVersion,
      lastCheck: Date.now(),
      updateAvailable: false,
      updateDownloaded: false
    });
  }
}

// Add listener for app state changes to handle updates on app close
export async function initializeUpdateListener() {
  App.addListener('appStateChange', async ({ isActive }) => {
    if (!isActive) {  // App is going to background/being closed
      const updateStatus = await getUpdateStatus();
      if (updateStatus?.updateDownloaded) {
        try {
          // Apply the update
          await saveCurrentVersion(updateStatus.version);

          // Reset update status
          await setUpdateStatus({
            version: updateStatus.version,
            lastCheck: Date.now(),
            updateAvailable: false,
            updateDownloaded: false
          });

          // Set server base path for next app start
          await Preferences.set({
            key: 'server_base_path',
            value: `${UPDATE_DIRECTORY}`
          });
        } catch (error) {
          console.error('Failed to apply update during app close:', error);
        }
      }
    }
  });
}

// Modify checkAndApplyPendingUpdate to remove the restart
export async function checkAndApplyPendingUpdate() {
  const updateStatus = await getUpdateStatus();

  if (updateStatus?.updateDownloaded) {
    try {
      // Apply the update
      await saveCurrentVersion(updateStatus.version);

      // Reset update status
      await setUpdateStatus({
        version: updateStatus.version,
        lastCheck: Date.now(),
        updateAvailable: false,
        updateDownloaded: false
      });

      // Set server base path for next app start
      await Preferences.set({
        key: 'server_base_path',
        value: `${UPDATE_DIRECTORY}`
      });

      // Note: Update will be applied when user closes the app
      // No immediate restart needed
    } catch (error) {
      console.error('Failed to apply pending update:', error);
    }
  }
}
