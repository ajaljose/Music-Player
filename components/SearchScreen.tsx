import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search as SearchIcon,
  X,
  Play,
  Heart,
  Music,
} from 'lucide-react-native';
import { FolderData, Song } from '../types';
import { PlaybackState } from '../services/AudioPlayerService';
import { EqualizerIcon } from './EqualizerIcon';
import { COLORS, GRADIENTS } from '../constants/theme';

const DEFAULT_ARTWORK = require('../assets/default_album_art.jpg');

type SearchCategory = 'all' | 'titles' | 'artists' | 'albums';

interface SearchScreenProps {
  folderData: FolderData | null;
  playbackState: PlaybackState;
  onSelectTrackFromList: (songs: Song[], index: number) => void;
  onPlayAllResults: (songs: Song[]) => void;
  onToggleFavorite: (songId: string) => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  folderData,
  playbackState,
  onSelectTrackFromList,
  onPlayAllResults,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');

  const allSongs = folderData?.songs || [];
  const currentSong = playbackState.currentSong;

  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allSongs;

    return allSongs.filter((song) => {
      const titleMatch = song.title.toLowerCase().includes(q);
      const artistMatch = song.artist.toLowerCase().includes(q);
      const albumMatch = song.album.toLowerCase().includes(q);
      const composerMatch = song.composer ? song.composer.toLowerCase().includes(q) : false;

      switch (selectedCategory) {
        case 'titles':
          return titleMatch;
        case 'artists':
          return artistMatch || composerMatch;
        case 'albums':
          return albumMatch;
        case 'all':
        default:
          return titleMatch || artistMatch || albumMatch || composerMatch;
      }
    });
  }, [allSongs, searchQuery, selectedCategory]);

  const categories: { key: SearchCategory; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'titles', label: 'Titles' },
    { key: 'artists', label: 'Artists' },
    { key: 'albums', label: 'Albums' },
  ];

  const renderTrackItem = ({ item, index }: { item: Song; index: number }) => {
    const isCurrentTrack = currentSong?.id === item.id;
    const isPlaying = isCurrentTrack && playbackState.isPlaying;
    const trackArtSource = item.artworkUri ? { uri: item.artworkUri } : DEFAULT_ARTWORK;

    return (
      <TouchableOpacity
        style={[styles.trackRow, isCurrentTrack && styles.activeTrackRow]}
        onPress={() => onSelectTrackFromList(filteredSongs, index)}
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
            color={item.isFavorite ? COLORS.yellowAccent : COLORS.slateGray}
            fill={item.isFavorite ? COLORS.yellowAccent : 'transparent'}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={GRADIENTS.libraryBg} style={styles.container}>
        {/* Title Header */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Search Music</Text>
        </View>

        {/* Search Input Box */}
        <View style={styles.searchBoxWrapper}>
          <View style={styles.searchBox}>
            <SearchIcon size={20} color={COLORS.slateGray} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs, artists, albums..."
              placeholderTextColor={COLORS.slateGray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                <X size={18} color={COLORS.slateGray} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Chips */}
        <View style={styles.categoriesRow}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, isSelected && styles.selectedChip]}
                onPress={() => setSelectedCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Subheader / Results Count & Action */}
        {filteredSongs.length > 0 && searchQuery.length > 0 && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCountText}>
              Found {filteredSongs.length} {filteredSongs.length === 1 ? 'song' : 'songs'}
            </Text>
            <TouchableOpacity
              style={styles.playResultsBtn}
              onPress={() => onPlayAllResults(filteredSongs)}
              activeOpacity={0.8}
            >
              <Play size={14} color={COLORS.darkBg} fill={COLORS.darkBg} />
              <Text style={styles.playResultsText}>Play All Results</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Songs List */}
        <FlatList
          data={filteredSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderTrackItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Music size={52} color={COLORS.slateGray} />
              <Text style={styles.emptyTitle}>
                {searchQuery.length > 0 ? 'No Matching Songs Found' : 'Explore Your Music'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.length > 0
                  ? `No tracks found matching "${searchQuery}". Try a different keyword or category.`
                  : 'Type a track name, artist, or album above to search your music library.'}
              </Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.lightGray,
    letterSpacing: 0.3,
  },
  searchBoxWrapper: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.lightGray,
    fontSize: 16,
    height: '100%',
  },
  clearBtn: {
    padding: 6,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  selectedChip: {
    backgroundColor: COLORS.yellowAccent,
    borderColor: COLORS.yellowAccent,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slateGray,
  },
  selectedChipText: {
    color: COLORS.darkBg,
    fontWeight: '700',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  resultsCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.slateGray,
  },
  playResultsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.yellowAccent,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playResultsText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.darkBg,
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
});
