import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent, DimensionValue } from 'react-native';
import { COLORS } from '../constants/theme';

interface InteractiveSliderProps {
  progress: number; // 0.0 to 1.0
  onSeek: (ratio: number) => void;
  trackColor?: string;
  progressColor?: string;
  thumbColor?: string;
}

export const InteractiveSlider: React.FC<InteractiveSliderProps> = ({
  progress,
  onSeek,
  trackColor = 'rgba(105, 103, 115, 0.3)',
  progressColor = COLORS.yellowAccent,
  thumbColor = COLORS.yellowAccent,
}) => {
  const [sliderWidth, setSliderWidth] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [dragRatio, setDragRatio] = useState<number>(0);

  const sliderWidthRef = useRef<number>(0);
  const dragRatioRef = useRef<number>(0);
  const containerRef = useRef<View>(null);
  const leftOffsetRef = useRef<number>(0);

  useEffect(() => {
    sliderWidthRef.current = sliderWidth;
  }, [sliderWidth]);

  const updateRatioFromPageX = (pageX: number, leftOffset: number) => {
    if (sliderWidthRef.current <= 0) return 0;
    const touchX = pageX - leftOffset;
    const newRatio = Math.max(0, Math.min(1, touchX / sliderWidthRef.current));
    dragRatioRef.current = newRatio;
    setDragRatio(newRatio);
    return newRatio;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        setIsSeeking(true);
        containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
          leftOffsetRef.current = pageX;
          sliderWidthRef.current = width;
          updateRatioFromPageX(evt.nativeEvent.pageX, pageX);
        });
      },

      onPanResponderMove: (evt) => {
        updateRatioFromPageX(evt.nativeEvent.pageX, leftOffsetRef.current);
      },

      onPanResponderRelease: (evt) => {
        const finalRatio = updateRatioFromPageX(evt.nativeEvent.pageX, leftOffsetRef.current);
        setIsSeeking(false);
        onSeek(finalRatio);
      },

      onPanResponderTerminate: (evt) => {
        setIsSeeking(false);
        onSeek(dragRatioRef.current);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setSliderWidth(width);
    sliderWidthRef.current = width;
  };

  const effectiveRatio = isSeeking ? dragRatio : Math.max(0, Math.min(1, progress));
  const activePercent: DimensionValue = `${effectiveRatio * 100}%`;

  return (
    <View
      ref={containerRef}
      style={styles.touchContainer}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <View style={[styles.trackBg, { backgroundColor: trackColor }]}>
        <View style={[styles.trackActive, { width: activePercent, backgroundColor: progressColor }]} />
        <View
          style={[
            styles.thumb,
            {
              left: activePercent,
              backgroundColor: thumbColor,
              transform: [{ translateX: -8 }, { scale: isSeeking ? 1.3 : 1 }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  touchContainer: {
    height: 36,
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 10,
  },
  trackBg: {
    height: 5,
    borderRadius: 3,
    width: '100%',
    position: 'relative',
    overflow: 'visible',
  },
  trackActive: {
    height: '100%',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    top: -5.5,
    width: 16,
    height: 16,
    borderRadius: 8,
    elevation: 4,
    shadowColor: COLORS.yellowAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
