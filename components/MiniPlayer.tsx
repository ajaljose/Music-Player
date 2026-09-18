import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PlaybackState } from '../services/AudioPlayerService';
import { COLORS, GRADIENTS } from '../constants/theme';

const DEFAULT_ARTWORK = require('../assets/default_album_art.jpg');

interface MiniPlayerProps {
  playbackState: PlaybackState;
  onTogglePlayPause: () => void;
  onOpenNowPlaying: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  playbackState,
  onTogglePlayPause,
  onOpenNowPlaying,
}) => {
  const { currentSong, isPlaying, positionMillis, durationMillis } = playbackState;

  if (!currentSong) return null;

  const title = currentSong.title || 'Unknown Track';
  const artist = currentSong.artist || 'Unknown Artist';
  const artworkSource = currentSong.artworkUri
    ? { uri: currentSong.artworkUri }
    : DEFAULT_ARTWORK;

  const progressRatio = durationMillis > 0 ? Math.min(1, Math.max(0, positionMillis / durationMillis)) : 0;
  const progressPercent = `${(progressRatio * 100).toFixed(2)}%`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onOpenNowPlaying}
      activeOpacity={0.9}
    >
      <View style={styles.contentRow}>
        {/* Album Artwork */}
        <Image source={artworkSource} style={styles.artwork} resizeMode="cover" />

        {/* Track Title & Artist */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.artistText} numberOfLines={1}>
            {artist}
          </Text>
        </View>

        {/* Play/Pause Button */}
        <TouchableOpacity
          style={styles.playBtnWrapper}
          onPress={onTogglePlayPause}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LinearGradient
            colors={GRADIENTS.playBtn}
            style={styles.playBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isPlaying ? (
              <Pause size={18} color={COLORS.darkBg} fill={COLORS.darkBg} />
            ) : (
              <Play size={18} color={COLORS.darkBg} fill={COLORS.darkBg} style={{ marginLeft: 2 }} />
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Non-interactive Progress Bar at bottom */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: progressPercent as any }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 14,
    backgroundColor: '#35333a',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: COLORS.darkerBg,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.lightGray,
    letterSpacing: 0.2,
  },
  artistText: {
    fontSize: 13,
    color: COLORS.slateGray,
    marginTop: 2,
    fontWeight: '500',
  },
  playBtnWrapper: {
    padding: 2,
  },
  playBtnGradient: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.yellowAccent,
  },
});
