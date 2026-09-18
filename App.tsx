import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, Alert, Modal, Text, TouchableOpacity } from 'react-native';
import { Folder, Music, X } from 'lucide-react-native';
import { FolderData, Song, TabType } from './types';
import { FolderService } from './services/FolderService';
import { AudioPlayerService, PlaybackState } from './services/AudioPlayerService';
import { NowPlayingScreen } from './components/NowPlayingScreen';
import { LibraryScreen } from './components/LibraryScreen';
import { SearchScreen } from './components/SearchScreen';
import { FavouritesScreen } from './components/FavouritesScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { MiniPlayer } from './components/MiniPlayer';
import { COLORS } from './constants/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [folderData, setFolderData] = useState<FolderData | null>(null);
  const [pickerModalVisible, setPickerModalVisible] = useState<boolean>(false);
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

  const handleOpenPickerModal = () => {
    setPickerModalVisible(true);
  };

  const handleSelectFolder = async () => {
    setPickerModalVisible(false);
    const result = await FolderService.pickFolder();
    if (result && result.songs.length > 0) {
      setFolderData(result);
      playerService.setPlaylist(result.songs, 0);
      await playerService.playTrackAtIndex(0);
      Alert.alert('Folder Loaded', `Successfully loaded ${result.songs.length} MP3 files from "${result.name}".`);
    } else if (result && result.songs.length === 0) {
      Alert.alert('No MP3 Files Found', 'The selected folder does not contain any .mp3 files.');
    }
  };

  const handleSelectFiles = async () => {
    setPickerModalVisible(false);
    const result = await FolderService.pickFilesOnly();
    if (result && result.songs.length > 0) {
      setFolderData(result);
      playerService.setPlaylist(result.songs, 0);
      await playerService.playTrackAtIndex(0);
      Alert.alert('Files Loaded', `Successfully loaded ${result.songs.length} MP3 files.`);
    } else if (result && result.songs.length === 0) {
      Alert.alert('No MP3 Files Selected', 'No valid .mp3 files were selected.');
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
            onChangeFolder={handleOpenPickerModal}
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

      {/* Mini Player Bar (shown on all screens except home when a song is loaded) */}
      {activeTab !== 'home' && (
        <MiniPlayer
          playbackState={playbackState}
          onTogglePlayPause={() => playerService.togglePlayPause()}
          onOpenNowPlaying={() => setActiveTab('home')}
        />
      )}

      {/* Bottom Navigation Bar */}
      <BottomNavigation activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* Import Music Source Modal */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Music</Text>
              <TouchableOpacity onPress={() => setPickerModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={COLORS.slateGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select how you would like to load songs:</Text>

            <TouchableOpacity style={styles.sourceOptionCard} onPress={handleSelectFolder} activeOpacity={0.8}>
              <View style={styles.sourceIconWrapper}>
                <Folder size={24} color={COLORS.yellowAccent} />
              </View>
              <View style={styles.sourceTextWrapper}>
                <Text style={styles.sourceOptionTitle}>Select Folder Directory</Text>
                <Text style={styles.sourceOptionDesc}>Pick an entire folder to scan and import all MP3 files inside it.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sourceOptionCard} onPress={handleSelectFiles} activeOpacity={0.8}>
              <View style={[styles.sourceIconWrapper, { backgroundColor: 'rgba(0, 159, 183, 0.15)' }]}>
                <Music size={24} color={COLORS.cyanAccent} />
              </View>
              <View style={styles.sourceTextWrapper}>
                <Text style={styles.sourceOptionTitle}>Select MP3 Files</Text>
                <Text style={styles.sourceOptionDesc}>Choose specific .mp3 audio files individually from storage.</Text>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.lightGray,
  },
  closeBtn: {
    padding: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.slateGray,
    marginBottom: 20,
  },
  sourceOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  sourceIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(252, 213, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  sourceTextWrapper: {
    flex: 1,
  },
  sourceOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.lightGray,
  },
  sourceOptionDesc: {
    fontSize: 12,
    color: COLORS.slateGray,
    marginTop: 3,
    lineHeight: 16,
  },
});

