import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { colors, fonts } from '../../theme';

const CONFETTI_COLORS = ['#FF6B6B', '#A855F7', '#34D399', '#38BDF8', '#FBBF24', '#F472B6'];

function Confetti({ index, reducedMotion }: { index: number; reducedMotion: boolean }) {
  const p = useSharedValue(0);
  const angle = (index / 24) * Math.PI * 2;
  const dist = 120 + (index % 4) * 30;
  useEffect(() => {
    if (!reducedMotion) p.value = withDelay(350, withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, [p, reducedMotion]);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: Math.cos(angle) * dist * p.value },
      { translateY: Math.sin(angle) * dist * p.value + p.value * p.value * 60 },
      { rotateZ: `${p.value * 540}deg` },
    ],
    opacity: p.value === 0 ? 0 : 1 - p.value * 0.8,
  }));
  return <Animated.View style={[styles.confetti, { backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length] }, style]} />;
}

export function RescueCelebration({ emoji, reducedMotion }: { emoji: string; reducedMotion: boolean }): React.JSX.Element {
  const { height } = useWindowDimensions();
  const y = useSharedValue(height * 0.5);
  const scale = useSharedValue(0.3);
  useEffect(() => {
    y.value = withSpring(0, { damping: 11, stiffness: 90 });
    scale.value = withSpring(1, { damping: 7, stiffness: 120 });
  }, [y, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }, { scale: scale.value }] }));
  return (
    <View style={styles.wrap} accessibilityLiveRegion="assertive" accessibilityLabel={`You rescued ${emoji}!`}>
      <View style={styles.center}>
        {Array.from({ length: 24 }).map((_, i) => (
          <Confetti key={i} index={i} reducedMotion={reducedMotion} />
        ))}
        <Animated.Text style={[styles.emoji, style]}>{emoji}</Animated.Text>
      </View>
      <Text style={styles.text}>You rescued {emoji}!</Text>
      <Text style={styles.sub}>🐾 Animal Rescue complete</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,248,240,0.92)', alignItems: 'center', justifyContent: 'center', zIndex: 20 },
  center: { alignItems: 'center', justifyContent: 'center', width: 10, height: 140 },
  confetti: { position: 'absolute', width: 10, height: 14, borderRadius: 3 },
  emoji: { fontSize: 110 },
  text: { fontFamily: fonts.display, fontSize: 30, color: colors.coral, marginTop: 24 },
  sub: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted, marginTop: 6 },
});
