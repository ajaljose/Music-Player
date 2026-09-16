import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
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
} from 'lucide-react-native';
import { PlaybackState } from '../services/AudioPlayerService';
import { WaveformVisualizer } from './WaveformVisualizer';
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
  const isFavorite = currentSong ? !!currentSong.isFavorite : false;

  const artworkSource = currentSong?.artworkUri
    ? { uri: currentSong.artworkUri }
    : DEFAULT_ARTWORK;

  const progressRatio = durationMillis > 0 ? positionMillis / durationMillis : 0;

  const handleWaveformSeek = (ratio: number) => {
    if (durationMillis > 0) {
      onSeek(ratio * durationMillis);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
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

        {/* Audio Waveform Progress Visualizer */}
        <View style={styles.waveformSection}>
          <Text style={styles.timeText}>{formatDuration(positionMillis)}</Text>
          <WaveformVisualizer progress={progressRatio} onSeek={handleWaveformSeek} barCount={30} />
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
    alignItems: 'center',
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
  waveformSection: {
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
});
