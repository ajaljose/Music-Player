export interface Song {
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  composer?: string;
  year?: string;
  durationMillis: number;
  durationFormatted: string;
  artworkUri: string | null; // Base64 data URI or image URL or local asset
  isFavorite?: boolean;
  fileSize?: number;
}

export interface FolderData {
  uri: string;
  name: string;
  songCount: number;
  songs: Song[];
  updatedAt: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type TabType = 'home' | 'search' | 'library' | 'hotlist';
