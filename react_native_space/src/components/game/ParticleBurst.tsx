import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

interface Props {
  x: number;
  y: number;
  color: string;
  size: number;
}

const COUNT = 8;

function Dot({ angle, distance, color, dotSize, progress }: { angle: number; distance: number; color: string; dotSize: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.7 },
    ],
    opacity: 1 - progress.value,
  }));
  return (
    <Animated.View
      style={[styles.dot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color, marginLeft: -dotSize / 2, marginTop: -dotSize / 2 }, style]}
    />
  );
}

function ParticleBurstBase({ x, y, color, size }: Props) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [progress]);
  const dotSize = Math.max(4, Math.round(size * 0.16));
  return (
    <View pointerEvents="none" style={[styles.wrap, { left: x, top: y }]}>
      {Array.from({ length: COUNT }).map((_, i) => (
        <Dot
          key={i}
          angle={(i / COUNT) * Math.PI * 2 + (i % 2) * 0.3}
          distance={size * (0.7 + (i % 3) * 0.2)}
          color={i % 3 === 0 ? '#FFFFFF' : color}
          dotSize={dotSize}
          progress={progress}
        />
      ))}
    </View>
  );
}

export const ParticleBurst = React.memo(ParticleBurstBase);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', width: 0, height: 0 },
  dot: { position: 'absolute', left: 0, top: 0 },
});
