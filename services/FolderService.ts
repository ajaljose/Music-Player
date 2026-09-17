import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { FolderData, Song } from '../types';
import { parseMp3Metadata, formatDuration } from './MetadataParser';
import { DEMO_SONGS } from './DemoSongs';

const FOLDER_STORAGE_KEY = '@selected_music_folder';
const LAST_PLAYLIST_STORAGE_KEY = '@selected_music_playlist';

export class FolderService {
  /**
   * Save folder metadata & song list to AsyncStorage
   */
  static async saveFolderData(folderData: FolderData): Promise<void> {
    try {
      await AsyncStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(folderData));
    } catch (e) {
      console.error('Failed to save folder data to storage', e);
    }
  }

  /**
   * Load saved folder data from AsyncStorage
   */
  static async getSavedFolderData(): Promise<FolderData | null> {
    try {
      const jsonStr = await AsyncStorage.getItem(FOLDER_STORAGE_KEY);
      if (jsonStr) {
        const data: FolderData = JSON.parse(jsonStr);
        return data;
      }
    } catch (e) {
      console.error('Failed to read saved folder data', e);
    }
    return null;
  }

  /**
   * Clear saved folder selection
   */
  static async clearSavedFolder(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FOLDER_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear saved folder', e);
    }
  }

  /**
   * Scan a folder URI and return list of MP3 songs contained within it
   */
  static async scanFolderForMp3s(folderUri: string, folderName: string): Promise<FolderData> {
    const songs: Song[] = [];

    try {
      const dirContents = await FileSystem.readDirectoryAsync(folderUri);
      
      // Filter ONLY .mp3 files
      const mp3Files = dirContents.filter(file => file.toLowerCase().endsWith('.mp3'));

      for (const fileName of mp3Files) {
        const fileUri = folderUri.endsWith('/') ? `${folderUri}${fileName}` : `${folderUri}/${fileName}`;
        const songMetadata = await parseMp3Metadata(fileUri, fileName);
        songs.push(songMetadata);
      }
    } catch (err) {
      console.warn('Error reading directory directly, fallback picker mode:', err);
    }

    const folderData: FolderData = {
      uri: folderUri,
      name: folderName,
      songCount: songs.length,
      songs,
      updatedAt: Date.now(),
    };

    await this.saveFolderData(folderData);
    return folderData;
  }

  /**
   * Pick an entire folder (Directory Picker) on Web, Android, or iOS
   */
  static async pickFolder(): Promise<FolderData | null> {
    try {
      // 1. Web Directory Picker
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
          try {
            const dirHandle = await (window as any).showDirectoryPicker();
            const folderName = dirHandle.name || 'Selected Folder';
            const songs: Song[] = [];

            async function scanDirectory(handle: any) {
              for await (const entry of handle.values()) {
                if (entry.kind === 'file') {
                  if (entry.name.toLowerCase().endsWith('.mp3')) {
                    const file = await entry.getFile();
                    const fileUri = URL.createObjectURL(file);
                    const song = await parseMp3Metadata(fileUri, file.name);
                    song.fileSize = file.size;
                    songs.push(song);
                  }
                } else if (entry.kind === 'directory') {
                  await scanDirectory(entry);
                }
              }
            }

            await scanDirectory(dirHandle);

            const folderData: FolderData = {
              uri: 'web://' + folderName,
              name: folderName,
              songCount: songs.length,
              songs,
              updatedAt: Date.now(),
            };

            await this.saveFolderData(folderData);
            return folderData;
          } catch (err: any) {
            if (err.name === 'AbortError') {
              return null;
            }
            console.warn('showDirectoryPicker failed or cancelled, falling back to input:', err);
          }
        }

        // Fallback for Web: Hidden input with webkitdirectory
        return new Promise<FolderData | null>((resolve) => {
          try {
            const input = document.createElement('input');
            input.type = 'file';
            input.setAttribute('webkitdirectory', 'true');
            input.setAttribute('directory', 'true');
            input.setAttribute('multiple', 'true');

            input.onchange = async (e: any) => {
              const files: FileList = e.target.files;
              if (!files || files.length === 0) {
                resolve(null);
                return;
              }

              let folderName = 'Selected Folder';
              if (files[0] && files[0].webkitRelativePath) {
                folderName = files[0].webkitRelativePath.split('/')[0] || 'Selected Folder';
              }

              const songs: Song[] = [];
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.name.toLowerCase().endsWith('.mp3')) {
                  const fileUri = URL.createObjectURL(file);
                  const song = await parseMp3Metadata(fileUri, file.name);
                  song.fileSize = file.size;
                  songs.push(song);
                }
              }

              const folderData: FolderData = {
                uri: 'web://' + folderName,
                name: folderName,
                songCount: songs.length,
                songs,
                updatedAt: Date.now(),
              };

              await this.saveFolderData(folderData);
              resolve(folderData);
            };

            input.oncancel = () => resolve(null);
            input.click();
          } catch (err) {
            console.error('Web folder input error:', err);
            resolve(null);
          }
        });
      }

      // 2. Android Directory Picker (Storage Access Framework)
      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) {
          return null;
        }

        const directoryUri = permissions.directoryUri;
        let folderName = 'Selected Folder';
        try {
          const decoded = decodeURIComponent(directoryUri);
          const parts = decoded.split(/[:/]/).filter(Boolean);
          folderName = parts[parts.length - 1] || 'Music Folder';
        } catch (e) {}

        const fileUris = await FileSystem.StorageAccessFramework.readDirectoryAsync(directoryUri);
        const songs: Song[] = [];

        for (const fileUri of fileUris) {
          const decodedUri = decodeURIComponent(fileUri);
          if (decodedUri.toLowerCase().endsWith('.mp3') || decodedUri.toLowerCase().includes('.mp3')) {
            const fileName = decodedUri.split('/').pop() || 'Track.mp3';
            const song = await parseMp3Metadata(fileUri, fileName);
            songs.push(song);
          }
        }

        const folderData: FolderData = {
          uri: directoryUri,
          name: folderName,
          songCount: songs.length,
          songs,
          updatedAt: Date.now(),
        };

        await this.saveFolderData(folderData);
        return folderData;
      }

      // 3. Fallback to file picker
      return await this.pickFilesOnly();
    } catch (error) {
      console.error('Error selecting folder:', error);
      return null;
    }
  }

  /**
   * Pick individual MP3 files from device storage
   */
  static async pickFilesOnly(): Promise<FolderData | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/x-mp3', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const pickedAssets = result.assets;
      const songs: Song[] = [];

      const samplePath = pickedAssets[0].uri;
      const pathParts = samplePath.split('/');
      let folderName = 'Selected Files';
      if (pathParts.length > 2) {
        folderName = decodeURIComponent(pathParts[pathParts.length - 2]) || 'Local Files';
      }

      for (const asset of pickedAssets) {
        if (asset.name.toLowerCase().endsWith('.mp3')) {
          const song = await parseMp3Metadata(asset.uri, asset.name);
          if (asset.size) {
            song.fileSize = asset.size;
          }
          songs.push(song);
        }
      }

      if (songs.length === 0) {
        return null;
      }

      const folderData: FolderData = {
        uri: samplePath,
        name: folderName,
        songCount: songs.length,
        songs,
        updatedAt: Date.now(),
      };

      await this.saveFolderData(folderData);
      return folderData;
    } catch (error) {
      console.error('Error selecting files:', error);
      return null;
    }
  }

  /**
   * Prompt user to pick a folder or select MP3 files from local storage
   */
  static async pickFolderOrFiles(): Promise<FolderData | null> {
    return await this.pickFolder();
  }

  /**
   * Provide initial default folder with high quality demo tracks if user has not picked a folder yet
   */
  static getDefaultDemoFolder(): FolderData {
    return {
      uri: 'demo://local-folder',
      name: 'Tattle Tales',
      songCount: DEMO_SONGS.length,
      songs: DEMO_SONGS,
      updatedAt: Date.now(),
    };
  }
}
