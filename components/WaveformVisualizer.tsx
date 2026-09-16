import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';

interface WaveformProps {
  progress: number; // 0.0 to 1.0
  onSeek?: (progress: number) => void;
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformProps> = ({
  progress,
  onSeek,
  barCount = 32,
}) => {
  // Generate dynamic heights matching waveform design
  const heights = [
    12, 18, 10, 24, 16, 32, 20, 28, 14, 38,
    46, 22, 18, 30, 42, 54, 36, 48, 62, 40,
    52, 34, 26, 44, 28, 18, 22, 14, 20, 12,
    16, 10
  ];

  const handlePress = (evt: any) => {
    if (!onSeek) return;
    const { locationX } = evt.nativeEvent;
    const width = Dimensions.get('window').width - 120;
    const newProgress = Math.max(0, Math.min(1, locationX / width));
    onSeek(newProgress);
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.container}>
        {heights.slice(0, barCount).map((height, index) => {
          const barProgress = index / barCount;
          const isActive = barProgress <= progress;
          return (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height: height,
                  backgroundColor: isActive ? COLORS.waveformActive : COLORS.waveformInactive,
                },
              ]}
            />
          );
        })}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 70,
    paddingHorizontal: 8,
    flex: 1,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
});
