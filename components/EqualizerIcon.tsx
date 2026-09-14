import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export const EqualizerIcon: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(14)).current;
  const bar3 = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (isPlaying) {
      const createAnim = (val: Animated.Value, min: number, max: number, duration: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(val, { toValue: max, duration, useNativeDriver: false }),
            Animated.timing(val, { toValue: min, duration, useNativeDriver: false }),
          ])
        );
      };

      const anim1 = createAnim(bar1, 4, 18, 400);
      const anim2 = createAnim(bar2, 6, 22, 500);
      const anim3 = createAnim(bar3, 4, 16, 350);

      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
      };
    } else {
      bar1.setValue(6);
      bar2.setValue(14);
      bar3.setValue(10);
    }
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, { height: bar1 }]} />
      <Animated.View style={[styles.bar, { height: bar2 }]} />
      <Animated.View style={[styles.bar, { height: bar3 }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 22,
    height: 24,
  },
  bar: {
    width: 3.5,
    backgroundColor: '#ff7a00',
    borderRadius: 2,
    marginHorizontal: 1.5,
  },
});
