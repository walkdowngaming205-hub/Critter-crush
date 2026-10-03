import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

interface Props {
  emoji: string;
  delay: number;
  size?: number;
  amplitude?: number;
  reducedMotion?: boolean;
}

export function FloatingCritter({ emoji, delay, size = 52, amplitude = 12, reducedMotion }: Props): React.JSX.Element {
  const t = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [delay, reducedMotion, t]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -amplitude + t.value * amplitude * 2 }, { rotateZ: `${-6 + t.value * 12}deg` }],
  }));
  return (
    <Animated.View style={style}>
      <Text style={[styles.emoji, { fontSize: size }]} accessibilityElementsHidden importantForAccessibility="no">
        {emoji}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  emoji: { textAlign: 'center' },
});
