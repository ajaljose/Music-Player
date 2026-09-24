import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, LayoutChangeEvent, DimensionValue } from 'react-native';
import { COLORS } from '../constants/theme';

interface InteractiveSliderProps {
  progress: number; // 0.0 to 1.0
  onSeek: (ratio: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: () => void;
  trackColor?: string;
  progressColor?: string;
  thumbColor?: string;
}

const safeRatio = (val: number): number => {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) return 0;
  return Math.max(0, Math.min(1, val));
};

export const InteractiveSlider: React.FC<InteractiveSliderProps> = ({
  progress,
  onSeek,
  onSlidingStart,
  onSlidingComplete,
  trackColor = 'rgba(105, 103, 115, 0.3)',
  progressColor = COLORS.yellowAccent,
  thumbColor = COLORS.yellowAccent,
}) => {
  const [sliderWidth, setSliderWidth] = useState<number>(0);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [dragRatio, setDragRatio] = useState<number>(0);

  const sliderWidthRef = useRef<number>(0);
  const dragRatioRef = useRef<number>(0);
  const leftOffsetRef = useRef<number>(0);

  useEffect(() => {
    sliderWidthRef.current = sliderWidth;
  }, [sliderWidth]);

  const updateRatioFromEvent = (evt: any): number => {
    const nativeEvt = evt?.nativeEvent;
    if (!nativeEvt) return safeRatio(dragRatioRef.current);

    const pageX = nativeEvt.pageX;
    const locationX = nativeEvt.locationX;

    // Calculate left offset of the container on screen synchronously
    if (typeof pageX === 'number' && typeof locationX === 'number' && !isNaN(pageX) && !isNaN(locationX)) {
      leftOffsetRef.current = pageX - locationX;
    }

    const width = sliderWidthRef.current;
    if (width <= 0) return safeRatio(progress);

    let touchX = 0;
    if (typeof pageX === 'number' && !isNaN(pageX) && leftOffsetRef.current > 0) {
      touchX = pageX - leftOffsetRef.current;
    } else if (typeof locationX === 'number' && !isNaN(locationX)) {
      touchX = locationX;
    }

    const newRatio = safeRatio(touchX / width);
    dragRatioRef.current = newRatio;
    setDragRatio(newRatio);
    return newRatio;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (evt) => {
        setIsSeeking(true);
        onSlidingStart?.();
        updateRatioFromEvent(evt);
      },

      onPanResponderMove: (evt) => {
        updateRatioFromEvent(evt);
      },

      onPanResponderRelease: (evt) => {
        const finalRatio = updateRatioFromEvent(evt);
        setIsSeeking(false);
        onSlidingComplete?.();
        onSeek(finalRatio);
      },

      onPanResponderTerminate: (evt) => {
        const finalRatio = safeRatio(dragRatioRef.current);
        setIsSeeking(false);
        onSlidingComplete?.();
        onSeek(finalRatio);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      setSliderWidth(width);
      sliderWidthRef.current = width;
    }
  };

  const effectiveRatio = isSeeking ? safeRatio(dragRatio) : safeRatio(progress);
  const activePercent: DimensionValue = `${(effectiveRatio * 100).toFixed(2)}%` as DimensionValue;

  return (
    <View
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

