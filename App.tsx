import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Alert } from 'react-native';
import { FolderData, TabType } from './types';
import { FolderService } from './services/FolderService';
import { AudioPlayerService, PlaybackState } from './services/AudioPlayerService';
import { NowPlayingScreen } from './components/NowPlayingScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { COLORS } from './constants/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [folderData, setFolderData] = useState<FolderData | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentSong: null,
    isPlaying: false,
    positionMillis: 0,
    durationMillis: 180000,
    isBuffering: false,
    shuffleEnabled: false,
    repeatMode: 'off',
    currentIndex: 0,
    playlist: [],
  });

  const playerService = AudioPlayerService.getInstance();

  useEffect(() => {
    // 1. Subscribe to real-time audio player state updates
    const unsubscribe = playerService.subscribe((state) => {
      setPlaybackState(state);
    });

    // 2. Initialize saved folder from AsyncStorage on app launch
    loadSavedFolder();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadSavedFolder = async () => {
    const savedFolder = await FolderService.getSavedFolderData();

    if (savedFolder && savedFolder.songs.length > 0) {
      setFolderData(savedFolder);
      playerService.setPlaylist(savedFolder.songs, 0);
    } else {
      // Fallback demo folder so app is fully functional on initial run
      const demoFolder = FolderService.getDefaultDemoFolder();
      setFolderData(demoFolder);
      playerService.setPlaylist(demoFolder.songs, 0);
    }
  };

  const handlePickFolder = async () => {
    const result = await FolderService.pickFolderOrFiles();
    if (result && result.songs.length > 0) {
      setFolderData(result);
      playerService.setPlaylist(result.songs, 0);
      await playerService.playTrackAtIndex(0);
      Alert.alert('Folder Loaded', `Successfully loaded ${result.songs.length} MP3 files from "${result.name}".`);
    } else if (result && result.songs.length === 0) {
      Alert.alert('No MP3 Files Found', 'The selected folder does not contain any .mp3 files.');
    }
  };

  const handleSelectTrack = async (index: number) => {
    await playerService.playTrackAtIndex(index);
    setActiveTab('home'); // Jump to Now Playing view when track selected
  };

  const handlePlayAll = async () => {
    if (folderData?.songs && folderData.songs.length > 0) {
      playerService.setPlaylist(folderData.songs, 0);
      await playerService.playTrackAtIndex(0);
      setActiveTab('home');
    }
  };

  const handleShuffleAll = async () => {
    if (folderData?.songs && folderData.songs.length > 0) {
      if (!playbackState.shuffleEnabled) {
        playerService.toggleShuffle();
      }
      await playerService.playTrackAtIndex(0);
      setActiveTab('home');
    }
  };

  const handleToggleFavorite = (songId?: string) => {
    const targetId = songId || playbackState.currentSong?.id;
    if (!targetId || !folderData) return;

    const updatedSongs = folderData.songs.map(song => {
      if (song.id === targetId) {
        return { ...song, isFavorite: !song.isFavorite };
      }
      return song;
    });

    const updatedFolder: FolderData = {
      ...folderData,
      songs: updatedSongs,
    };

    setFolderData(updatedFolder);
    FolderService.saveFolderData(updatedFolder);
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBg} />

      {/* Main Screen Router */}
      <View style={styles.mainView}>
        {activeTab === 'library' ? (
          <LibraryScreen
            folderData={folderData}
            playbackState={playbackState}
            onSelectTrack={handleSelectTrack}
            onPlayAll={handlePlayAll}
            onShuffleAll={handleShuffleAll}
            onChangeFolder={handlePickFolder}
            onBackToNowPlaying={() => setActiveTab('home')}
            onToggleFavorite={handleToggleFavorite}
          />
        ) : (
          <NowPlayingScreen
            playbackState={playbackState}
            onTogglePlayPause={() => playerService.togglePlayPause()}
            onNext={() => playerService.playNext()}
            onPrevious={() => playerService.playPrevious()}
            onSeek={(ms) => playerService.seekTo(ms)}
            onToggleShuffle={() => playerService.toggleShuffle()}
            onToggleRepeat={() => playerService.toggleRepeat()}
            onToggleFavorite={() => handleToggleFavorite()}
            onOpenLibrary={() => setActiveTab('library')}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
  },
  mainView: {
    flex: 1,
  },
});
