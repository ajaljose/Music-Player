import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Alert } from 'react-native';
import { FolderData, Song, TabType } from './types';
import { FolderService } from './services/FolderService';
import { AudioPlayerService, PlaybackState } from './services/AudioPlayerService';
import { NowPlayingScreen } from './components/NowPlayingScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { SearchScreen } from './components/SearchScreen';
import { FavouritesScreen } from './components/FavouritesScreen';
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
      if (savedFolder.uri === 'demo://local-folder') {
        const demoFolder = FolderService.getDefaultDemoFolder();
        const updatedSongs = demoFolder.songs.map((ds) => {
          const saved = savedFolder.songs.find((s) => s.id === ds.id);
          return saved ? { ...ds, isFavorite: saved.isFavorite } : ds;
        });
        const updatedFolder: FolderData = { ...demoFolder, songs: updatedSongs };
        setFolderData(updatedFolder);
        playerService.setPlaylist(updatedFolder.songs, 0);
        return;
      }
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
    if (folderData?.songs) {
      playerService.setPlaylist(folderData.songs, index);
    }
    await playerService.playTrackAtIndex(index);
    setActiveTab('home'); // Jump to Now Playing view when track selected
  };

  const handleSelectTrackFromCustomList = async (songs: Song[], index: number) => {
    if (songs && songs.length > 0) {
      playerService.setPlaylist(songs, index);
      await playerService.playTrackAtIndex(index);
      setActiveTab('home');
    }
  };

  const handlePlayAll = async () => {
    if (folderData?.songs && folderData.songs.length > 0) {
      playerService.setPlaylist(folderData.songs, 0);
      await playerService.playTrackAtIndex(0);
      setActiveTab('home');
    }
  };

  const handlePlayCustomList = async (songs: Song[]) => {
    if (songs && songs.length > 0) {
      playerService.setPlaylist(songs, 0);
      await playerService.playTrackAtIndex(0);
      setActiveTab('home');
    }
  };

  const handleShuffleAll = async () => {
    if (folderData?.songs && folderData.songs.length > 0) {
      playerService.setPlaylist(folderData.songs, 0);
      if (!playbackState.shuffleEnabled) {
        playerService.toggleShuffle();
      }
      await playerService.playTrackAtIndex(0);
      setActiveTab('home');
    }
  };

  const handleShuffleCustomList = async (songs: Song[]) => {
    if (songs && songs.length > 0) {
      playerService.setPlaylist(songs, 0);
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

    let updatedFavStatus = false;
    const updatedSongs = folderData.songs.map((song) => {
      if (song.id === targetId) {
        updatedFavStatus = !song.isFavorite;
        return { ...song, isFavorite: updatedFavStatus };
      }
      return song;
    });

    const updatedFolder: FolderData = {
      ...folderData,
      songs: updatedSongs,
    };

    setFolderData(updatedFolder);
    FolderService.saveFolderData(updatedFolder);
    playerService.updateSongFavorite(targetId, updatedFavStatus);
  };

  const renderMainView = () => {
    switch (activeTab) {
      case 'library':
        return (
          <LibraryScreen
            folderData={folderData}
            playbackState={playbackState}
            onSelectTrack={handleSelectTrack}
            onPlayAll={handlePlayAll}
            onShuffleAll={handleShuffleAll}
            onChangeFolder={handlePickFolder}
            onBackToNowPlaying={() => setActiveTab('home')}
            onToggleFavorite={handleToggleFavorite}
            onOpenSearch={() => setActiveTab('search')}
          />
        );
      case 'search':
        return (
          <SearchScreen
            folderData={folderData}
            playbackState={playbackState}
            onSelectTrackFromList={handleSelectTrackFromCustomList}
            onPlayAllResults={handlePlayCustomList}
            onToggleFavorite={handleToggleFavorite}
          />
        );
      case 'favourites':
        return (
          <FavouritesScreen
            folderData={folderData}
            playbackState={playbackState}
            onSelectTrackFromList={handleSelectTrackFromCustomList}
            onPlayAllFavourites={handlePlayCustomList}
            onShuffleFavourites={handleShuffleCustomList}
            onToggleFavorite={handleToggleFavorite}
            onOpenLibrary={() => setActiveTab('library')}
          />
        );
      case 'home':
      default:
        return (
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
        );
    }
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBg} />

      {/* Main Screen Router */}
      <View style={styles.mainView}>{renderMainView()}</View>

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
