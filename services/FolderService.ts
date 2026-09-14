import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
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
   * Prompt user to pick a folder or select MP3 files from local storage
   */
  static async pickFolderOrFiles(): Promise<FolderData | null> {
    try {
      // Pick audio files or folder from device
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/mp3', 'audio/x-mp3', 'application/octet-stream', '*/*'], // filter MP3 files
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const pickedAssets = result.assets;
      const songs: Song[] = [];

      // Determine folder name from the first file path if available
      const samplePath = pickedAssets[0].uri;
      const pathParts = samplePath.split('/');
      let folderName = 'Selected Folder';
      if (pathParts.length > 2) {
        folderName = decodeURIComponent(pathParts[pathParts.length - 2]) || 'Local Folder';
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
      console.error('Error selecting folder/files:', error);
      return null;
    }
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
