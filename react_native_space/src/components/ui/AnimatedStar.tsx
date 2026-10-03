import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

interface Props {
  filled: boolean;
  delay: number;
  size?: number;
}

export function AnimatedStar({ filled, delay, size = 44 }: Props): React.JSX.Element {
  const rot = useSharedValue(0);
  const scale = useSharedValue(0);
  useEffect(() => {
    rot.value = withDelay(delay, withTiming(360, { duration: 600 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 140 }));
  }, [delay, rot, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }, { scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Text style={[styles.star, { fontSize: size }, !filled && styles.dim]}>⭐</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  star: { textAlign: 'center' },
  dim: { opacity: 0.2 },
});
