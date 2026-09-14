import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Search,
  Play,
  Shuffle,
  FolderSync,
  Heart,
  Music,
} from 'lucide-react-native';
import { FolderData, Song } from '../types';
import { PlaybackState } from '../services/AudioPlayerService';
import { EqualizerIcon } from './EqualizerIcon';

const DEFAULT_ARTWORK = require('../assets/default_album_art.jpg');

interface LibraryScreenProps {
  folderData: FolderData | null;
  playbackState: PlaybackState;
  onSelectTrack: (index: number) => void;
  onPlayAll: () => void;
  onShuffleAll: () => void;
  onChangeFolder: () => void;
  onBackToNowPlaying: () => void;
  onToggleFavorite?: (songId: string) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  folderData,
  playbackState,
  onSelectTrack,
  onPlayAll,
  onShuffleAll,
  onChangeFolder,
  onBackToNowPlaying,
  onToggleFavorite,
}) => {
  const songs = folderData?.songs || [];
  const folderName = folderData?.name || 'Local Folder';
  const songCount = folderData?.songCount || songs.length;
  const currentSong = playbackState.currentSong;

  const renderTrackItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentTrack = currentSong?.id === item.id;
    const isPlaying = isCurrentTrack && playbackState.isPlaying;
    const trackNum = (index + 1).toString().padStart(2, '0');
    const trackArtSource = item.artworkUri ? { uri: item.artworkUri } : DEFAULT_ARTWORK;

    return (
      <TouchableOpacity
        style={[styles.trackRow, isCurrentTrack && styles.activeTrackRow]}
        onPress={() => onSelectTrack(index)}
        activeOpacity={0.7}
      >
        {/* Track Index or Equalizer Icon */}
        <View style={styles.indexCol}>
          {isCurrentTrack ? (
            <EqualizerIcon isPlaying={isPlaying} />
          ) : (
            <Text style={styles.trackNumber}>{trackNum}</Text>
          )}
        </View>

        {/* Small Track Album Art Thumbnail */}
        <Image source={trackArtSource} style={styles.trackThumb} />

        {/* Track Title & Artist */}
        <View style={styles.trackMetaCol}>
          <Text
            style={[styles.trackTitle, isCurrentTrack && styles.activeTrackTitle]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.trackSubtitle} numberOfLines={1}>
            {item.artist} · {item.durationFormatted}
          </Text>
        </View>

        {/* Favorite Heart Icon */}
        <TouchableOpacity
          onPress={() => onToggleFavorite && onToggleFavorite(item.id)}
          style={styles.heartBtn}
        >
          <Heart
            size={20}
            color={item.isFavorite ? '#00f0ff' : '#45435a'}
            fill={item.isFavorite ? '#00f0ff' : 'transparent'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const headerArtwork = currentSong?.artworkUri
    ? { uri: currentSong.artworkUri }
    : songs.length > 0 && songs[0].artworkUri
    ? { uri: songs[0].artworkUri }
    : DEFAULT_ARTWORK;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#0a071e', '#130c2a']} style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onBackToNowPlaying} style={styles.iconBtn}>
            <ChevronLeft size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Profile</Text>

          <TouchableOpacity style={styles.iconBtn}>
            <Search size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Album / Folder Profile Header Card */}
        <View style={styles.profileCard}>
          {/* Avatar Cover */}
          <View style={styles.avatarWrapper}>
            <Image source={headerArtwork} style={styles.avatarImage} />
          </View>

          {/* Folder / Album Title */}
          <Text style={styles.albumTitle} numberOfLines={1}>
            {folderName}
          </Text>

          {/* Stats Badges Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{songCount}</Text>
              <Text style={styles.statLabel}>Songs</Text>
            </View>
          </View>

          {/* Action Buttons Row: Play & Shuffle */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity onPress={onPlayAll} style={styles.playAllBtn} activeOpacity={0.8}>
              <LinearGradient
                colors={['#ff7a00', '#ff3b00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.playGradient}
              >
                <Play size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.playAllText}>Play</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onShuffleAll}
              style={styles.shuffleAllBtn}
              activeOpacity={0.8}
            >
              <Shuffle size={18} color="#FFFFFF" />
              <Text style={styles.shuffleAllText}>Shuffle</Text>
            </TouchableOpacity>
          </View>

          {/* Dedicated Option to Change Folder */}
          <TouchableOpacity onPress={onChangeFolder} style={styles.changeFolderBtn}>
            <FolderSync size={18} color="#ff6b00" />
            <Text style={styles.changeFolderText}>Change Music Folder</Text>
          </TouchableOpacity>
        </View>

        {/* Track List */}
        <FlatList
          data={songs}
          keyExtractor={item => item.id}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Music size={48} color="#3b3952" />
              <Text style={styles.emptyText}>No MP3 files found in selected folder</Text>
              <TouchableOpacity onPress={onChangeFolder} style={styles.selectFolderBtn}>
                <Text style={styles.selectFolderBtnText}>Select Folder</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a071e',
  },
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '85%',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8a89a0',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  playAllBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  playGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 8,
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shuffleAllBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  shuffleAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  changeFolderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  changeFolderText: {
    fontSize: 13,
    color: '#ff6b00',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activeTrackRow: {
    backgroundColor: 'rgba(255, 107, 0, 0.06)',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  indexCol: {
    width: 28,
    alignItems: 'center',
  },
  trackNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trackThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginLeft: 8,
  },
  trackMetaCol: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeTrackTitle: {
    color: '#ff7a00',
  },
  trackSubtitle: {
    fontSize: 13,
    color: '#8a89a0',
    marginTop: 3,
  },
  heartBtn: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#8a89a0',
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  selectFolderBtn: {
    marginTop: 16,
    backgroundColor: '#ff6b00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  selectFolderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
