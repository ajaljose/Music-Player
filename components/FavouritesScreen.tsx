import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Play,
  Shuffle,
  Music,
  ChevronLeft,
} from 'lucide-react-native';
import { FolderData, Song } from '../types';
import { PlaybackState } from '../services/AudioPlayerService';
import { EqualizerIcon } from './EqualizerIcon';
import { COLORS, GRADIENTS } from '../constants/theme';

const DEFAULT_ARTWORK = require('../assets/default_album_art.jpg');

interface FavouritesScreenProps {
  folderData: FolderData | null;
  playbackState: PlaybackState;
  onSelectTrackFromList: (songs: Song[], index: number) => void;
  onPlayAllFavourites: (songs: Song[]) => void;
  onShuffleFavourites: (songs: Song[]) => void;
  onToggleFavorite: (songId: string) => void;
  onOpenLibrary: () => void;
}

export const FavouritesScreen: React.FC<FavouritesScreenProps> = ({
  folderData,
  playbackState,
  onSelectTrackFromList,
  onPlayAllFavourites,
  onShuffleFavourites,
  onToggleFavorite,
  onOpenLibrary,
}) => {
  const favoriteSongs = useMemo(() => {
    return (folderData?.songs || []).filter((song) => song.isFavorite);
  }, [folderData]);

  const currentSong = playbackState.currentSong;

  const renderTrackItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentTrack = currentSong?.id === item.id;
    const isPlaying = isCurrentTrack && playbackState.isPlaying;
    const trackArtSource = item.artworkUri ? { uri: item.artworkUri } : DEFAULT_ARTWORK;

    return (
      <TouchableOpacity
        style={[styles.trackRow, isCurrentTrack && styles.activeTrackRow]}
        onPress={() => onSelectTrackFromList(favoriteSongs, index)}
        activeOpacity={0.7}
      >
        <View style={styles.indexCol}>
          {isCurrentTrack ? (
            <EqualizerIcon isPlaying={isPlaying} />
          ) : (
            <Text style={styles.trackNumber}>{(index + 1).toString().padStart(2, '0')}</Text>
          )}
        </View>

        <Image source={trackArtSource} style={styles.trackThumb} />

        <View style={styles.trackMetaCol}>
          <Text
            style={[styles.trackTitle, isCurrentTrack && styles.activeTrackTitle]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.trackSubtitle} numberOfLines={1}>
            {item.artist} {item.album ? `· ${item.album}` : ''}
          </Text>
        </View>

        <Text style={styles.durationText}>{item.durationFormatted}</Text>

        <TouchableOpacity
          onPress={() => onToggleFavorite(item.id)}
          style={styles.heartBtn}
          activeOpacity={0.7}
        >
          <Heart
            size={20}
            color={COLORS.yellowAccent}
            fill={COLORS.yellowAccent}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={GRADIENTS.libraryBg} style={styles.container}>
        {/* Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={onOpenLibrary} style={styles.backBtn}>
            <ChevronLeft size={24} color={COLORS.lightGray} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Favorite Tracks</Text>
        </View>

        {/* Action Controls Bar */}
        {favoriteSongs.length > 0 && (
          <View style={styles.actionRow}>
            <View style={styles.favCountBadge}>
              <Heart size={14} color={COLORS.yellowAccent} fill={COLORS.yellowAccent} />
              <Text style={styles.favCountText}>
                {favoriteSongs.length} {favoriteSongs.length === 1 ? 'Song' : 'Songs'}
              </Text>
            </View>

            <View style={styles.btnGroup}>
              <TouchableOpacity
                style={styles.playAllBtn}
                onPress={() => onPlayAllFavourites(favoriteSongs)}
                activeOpacity={0.8}
              >
                <Play size={14} color={COLORS.darkBg} fill={COLORS.darkBg} />
                <Text style={styles.playAllText}>Play All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shuffleBtn}
                onPress={() => onShuffleFavourites(favoriteSongs)}
                activeOpacity={0.8}
              >
                <Shuffle size={14} color={COLORS.lightGray} />
                <Text style={styles.shuffleText}>Shuffle</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Favorites List */}
        <FlatList
          data={favoriteSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Heart size={56} color={COLORS.slateGray} />
              <Text style={styles.emptyTitle}>No Favorite Songs Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the heart icon on any track in your library or search results to save it here for quick access.
              </Text>
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={onOpenLibrary}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreBtnText}>Go to Music Library</Text>
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
    backgroundColor: COLORS.darkBg,
  },
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.lightGray,
    letterSpacing: 0.3,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  favCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slateGray,
  },
  btnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.yellowAccent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  playAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkBg,
  },
  shuffleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  shuffleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.lightGray,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(105, 103, 115, 0.15)',
  },
  activeTrackRow: {
    backgroundColor: COLORS.activeTrackBg,
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  indexCol: {
    width: 28,
    alignItems: 'center',
  },
  trackNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.slateGray,
  },
  trackThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginLeft: 8,
  },
  trackMetaCol: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.lightGray,
  },
  activeTrackTitle: {
    color: COLORS.yellowAccent,
  },
  trackSubtitle: {
    fontSize: 12,
    color: COLORS.slateGray,
    marginTop: 3,
  },
  durationText: {
    fontSize: 12,
    color: COLORS.slateGray,
    marginRight: 8,
  },
  heartBtn: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: COLORS.lightGray,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.slateGray,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    marginTop: 24,
    backgroundColor: COLORS.yellowAccent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  exploreBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkBg,
  },
});
