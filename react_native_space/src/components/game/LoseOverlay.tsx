import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { GradientButton } from '../ui/GradientButton';
import { colors, fonts, gradients, spacing } from '../../theme';
import { formatMMSS } from '../../utils/date';

interface Props {
  score: number;
  target: number;
  lives: number;
  msToNextLife: number;
  onRetry: () => void;
  onHome: () => void;
  reducedMotion: boolean;
}

export function LoseOverlay({ score, target, lives, msToNextLife, onRetry, onHome, reducedMotion }: Props): React.JSX.Element {
  const wobble = useSharedValue(0);
  useEffect(() => {
    if (!reducedMotion) wobble.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [wobble, reducedMotion]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${-8 + wobble.value * 16}deg` }] }));
  const remaining = Math.max(0, target - score);
  const canRetry = lives > 0;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.wrap}>
      <LinearGradient colors={gradients.sad} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <Animated.Text style={[styles.emoji, style]}>😿</Animated.Text>
        <Text style={styles.title} accessibilityRole="header">
          Oh no!
        </Text>
        <Text style={styles.sub}>You needed {remaining.toLocaleString('en-US')} more points</Text>
        <Text style={styles.scoreLabel}>Your score</Text>
        <Text style={styles.score}>{score.toLocaleString('en-US')}</Text>
        <Text style={styles.lifeNote}>❤️ -1 life · {lives} left</Text>
        <View style={styles.buttons}>
          <GradientButton
            label={canRetry ? 'Try Again ❤️' : 'No lives!'}
            subtitle={canRetry ? 'Uses 1 life if you lose again' : `Next in ${formatMMSS(msToNextLife)}`}
            onPress={onRetry}
            disabled={!canRetry}
            testID="lose-retry"
          />
          <GradientButton label="Home 🏠" variant="outline" borderColor={colors.violet} onPress={onHome} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, zIndex: 30 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  emoji: { fontSize: 96 },
  title: { fontFamily: fonts.display, fontSize: 36, color: colors.text, marginTop: spacing.md },
  sub: { fontFamily: fonts.bold, fontSize: 16, color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
  scoreLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted, marginTop: spacing.lg },
  score: { fontFamily: fonts.display, fontSize: 40, color: colors.violet },
  lifeNote: { fontFamily: fonts.heavy, fontSize: 14, color: colors.coral, marginTop: spacing.sm },
  buttons: { gap: spacing.md, marginTop: spacing.xl, alignItems: 'center' },
});
