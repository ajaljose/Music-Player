import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronDown,
  ListMusic,
  Heart,
  MoreHorizontal,
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Play,
  Pause,
  Info,
  Music2,
  User,
  Disc,
  Feather,
  Calendar,
} from 'lucide-react-native';
import { PlaybackState } from '../services/AudioPlayerService';
import { InteractiveSlider } from './InteractiveSlider';
import { formatDuration } from '../services/MetadataParser';
import { COLORS, GRADIENTS } from '../constants/theme';

const DEFAULT_ARTWORK = require('../assets/default_album_art.jpg');

interface NowPlayingProps {
  playbackState: PlaybackState;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (positionMs: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite?: () => void;
  onOpenLibrary: () => void;
}

const { width } = Dimensions.get('window');

export const NowPlayingScreen: React.FC<NowPlayingProps> = ({
  playbackState,
  onTogglePlayPause,
  onNext,
  onPrevious,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onOpenLibrary,
}) => {
  const { currentSong, isPlaying, positionMillis, durationMillis, shuffleEnabled, repeatMode } =
    playbackState;

  const title = currentSong ? currentSong.title : 'No Track Playing';
  const artist = currentSong ? currentSong.artist : 'Select a Folder';
  const album = currentSong?.album || 'Unknown Album';
  const composer = currentSong?.composer || 'Unknown Composer';
  const year = currentSong?.year || 'Unknown Year';
  const isFavorite = currentSong ? !!currentSong.isFavorite : false;

  const artworkSource = currentSong?.artworkUri
    ? { uri: currentSong.artworkUri }
    : DEFAULT_ARTWORK;

  const progressRatio = durationMillis > 0 ? positionMillis / durationMillis : 0;

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Curved Gradient Header Background */}
        <LinearGradient
          colors={GRADIENTS.header}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.topCurvedHeader}
        >
          {/* Header Controls */}
          <View style={styles.navHeader}>
            <TouchableOpacity onPress={onOpenLibrary} style={styles.headerBtn}>
              <ChevronDown size={28} color={COLORS.lightGray} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Now Playing</Text>

            <TouchableOpacity onPress={onOpenLibrary} style={styles.headerBtn}>
              <ListMusic size={24} color={COLORS.lightGray} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Circular Album Art (overlapping curved header) */}
        <View style={styles.artworkContainer}>
          <View style={styles.artworkGlowRing}>
            <Image source={artworkSource} style={styles.artworkImage} resizeMode="cover" />
          </View>
        </View>

        {/* Song Title & Artist info section */}
        <View style={styles.songInfoContainer}>
          <TouchableOpacity onPress={onToggleFavorite} style={styles.iconBtn}>
            <Heart
              size={24}
              color={isFavorite ? COLORS.yellowAccent : COLORS.slateGray}
              fill={isFavorite ? COLORS.yellowAccent : 'transparent'}
            />
          </TouchableOpacity>

          <View style={styles.titleWrapper}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.songArtist} numberOfLines={1}>
              {artist}
            </Text>
          </View>

          <TouchableOpacity style={styles.iconBtn}>
            <MoreHorizontal size={24} color={COLORS.slateGray} />
          </TouchableOpacity>
        </View>

        {/* Interactive Progress Bar */}
        <View style={styles.progressSection}>
          <Text style={styles.timeText}>{formatDuration(positionMillis)}</Text>
          <InteractiveSlider
            progress={progressRatio}
            onSeek={(ratio) => {
              if (durationMillis > 0) {
                onSeek(ratio * durationMillis);
              }
            }}
          />
          <Text style={styles.timeText}>{formatDuration(durationMillis)}</Text>
        </View>

        {/* Player Controls Bar */}
        <View style={styles.controlsRow}>
          {/* Shuffle Toggle */}
          <TouchableOpacity onPress={onToggleShuffle} style={styles.controlBtn}>
            <Shuffle size={20} color={shuffleEnabled ? COLORS.yellowAccent : COLORS.slateGray} />
          </TouchableOpacity>

          {/* Previous Track */}
          <TouchableOpacity onPress={onPrevious} style={styles.controlBtn}>
            <SkipBack size={26} color={COLORS.lightGray} fill={COLORS.lightGray} />
          </TouchableOpacity>

          {/* Play / Pause Yellow Accent Button */}
          <TouchableOpacity onPress={onTogglePlayPause} activeOpacity={0.8}>
            <LinearGradient
              colors={GRADIENTS.playBtn}
              style={styles.playButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isPlaying ? (
                <Pause size={30} color={COLORS.darkBg} fill={COLORS.darkBg} />
              ) : (
                <Play size={30} color={COLORS.darkBg} fill={COLORS.darkBg} style={{ marginLeft: 4 }} />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Next Track */}
          <TouchableOpacity onPress={onNext} style={styles.controlBtn}>
            <SkipForward size={26} color={COLORS.lightGray} fill={COLORS.lightGray} />
          </TouchableOpacity>

          {/* Repeat Mode Toggle */}
          <TouchableOpacity onPress={onToggleRepeat} style={styles.controlBtn}>
            {repeatMode === 'one' ? (
              <Repeat1 size={20} color={COLORS.yellowAccent} />
            ) : (
              <Repeat size={20} color={repeatMode === 'all' ? COLORS.yellowAccent : COLORS.slateGray} />
            )}
          </TouchableOpacity>
        </View>

        {/* Track Details Section at the Bottom */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Info size={18} color={COLORS.yellowAccent} />
            <Text style={styles.detailsHeaderText}>Track Information</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <Music2 size={16} color={COLORS.cyanAccent} />
              </View>
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{title}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <User size={16} color={COLORS.cyanAccent} />
              </View>
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Authors / Artists</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{artist}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <Disc size={16} color={COLORS.cyanAccent} />
              </View>
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Album</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{album}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <Feather size={16} color={COLORS.cyanAccent} />
              </View>
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Composer</Text>
                <Text style={styles.detailValue} numberOfLines={2}>{composer}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrapper}>
                <Calendar size={16} color={COLORS.cyanAccent} />
              </View>
              <View style={styles.detailTextWrapper}>
                <Text style={styles.detailLabel}>Year Recorded</Text>
                <Text style={styles.detailValue} numberOfLines={1}>{year}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  topCurvedHeader: {
    width: '100%',
    height: 350,
    borderBottomLeftRadius: width * 0.4,
    borderBottomRightRadius: width * 0.4,
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  headerBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.lightGray,
    letterSpacing: 0.5,
  },
  artworkContainer: {
    marginTop: -250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkGlowRing: {
    width: 320,
    height: 320,
    borderRadius: 25,
    backgroundColor: COLORS.darkerBg,
    padding: 6,
    shadowColor: COLORS.cyanAccent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  songInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 28,
  },
  iconBtn: {
    padding: 8,
  },
  titleWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  songTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.lightGray,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  songArtist: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.slateGray,
    marginTop: 4,
    textAlign: 'center',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.slateGray,
    width: 40,
    textAlign: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 24,
    marginBottom: 16,
  },
  controlBtn: {
    padding: 12,
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.yellowAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  detailsCard: {
    width: '90%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 18,
    marginTop: 16,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(105, 103, 115, 0.2)',
  },
  detailsHeaderText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.lightGray,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  detailsGrid: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0, 159, 183, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailTextWrapper: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.slateGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.lightGray,
    marginTop: 2,
  },
});

