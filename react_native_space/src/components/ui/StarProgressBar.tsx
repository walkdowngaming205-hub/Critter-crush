import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

interface Props {
  score: number;
  thresholds: [number, number, number];
}

export function StarProgressBar({ score, thresholds }: Props): React.JSX.Element {
  const max = Math.max(1, thresholds[2]);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(Math.min(1, score / max), { duration: 400 });
  }, [score, max, progress]);
  const fill = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View style={styles.wrap} accessible accessibilityLabel={`Score progress ${Math.round(Math.min(1, score / max) * 100)} percent`}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fill]}>
          <LinearGradient colors={['#FBBF24', '#FF6B6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </View>
      {thresholds.map((t, i) => {
        const left = `${Math.min(100, (t / max) * 100)}%` as const;
        const earned = score >= t;
        return (
          <View key={i} style={[styles.marker, { left }]}>
            <Text style={[styles.star, !earned && styles.starDim]}>⭐</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 26, justifyContent: 'center', flex: 1, marginHorizontal: 12 },
  track: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.8)', overflow: 'hidden', borderWidth: 1, borderColor: colors.boardBorder },
  fill: { height: '100%', borderRadius: 5, overflow: 'hidden' },
  marker: { position: 'absolute', top: 0, marginLeft: -10, width: 20, alignItems: 'center' },
  star: { fontSize: 16 },
  starDim: { opacity: 0.3 },
});
