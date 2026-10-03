import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { AnimatedStar } from '../ui/AnimatedStar';
import { GradientButton } from '../ui/GradientButton';
import { colors, fonts, gradients, radius, spacing } from '../../theme';
import type { WinOutcome } from '../../types/game';

interface Props {
  levelId: number;
  score: number;
  outcome: WinOutcome;
  hasNext: boolean;
  spinAvailable: boolean;
  onNext: () => void;
  onReplay: () => void;
  onHome: () => void;
  onSpin: () => void;
}

export function WinModal({ levelId, score, outcome, hasNext, spinAvailable, onNext, onReplay, onHome, onSpin }: Props): React.JSX.Element {
  return (
    <Animated.View entering={FadeIn.duration(250)} style={styles.backdrop}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.card} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            Level Complete! 🎉
          </Text>
          <Text style={styles.level}>Level {levelId}</Text>
          <View style={styles.stars} accessible accessibilityLabel={`${outcome.stars} of 3 stars`}>
            {[0, 1, 2].map((i) => (
              <AnimatedStar key={i} filled={i < outcome.stars} delay={250 + i * 300} size={i === 1 ? 54 : 44} />
            ))}
          </View>
          <Text style={styles.score}>{score.toLocaleString('en-US')}</Text>
          {outcome.newHighScore ? <Text style={styles.high}>🏆 New High Score!</Text> : null}
          {outcome.isRescue && outcome.rescuedEmoji ? (
            <Text style={styles.rescue}>✨ You rescued {outcome.rescuedEmoji} ✨</Text>
          ) : null}
          {outcome.goldenJustUnlocked ? <Text style={styles.golden}>🔥 3-day streak! Golden critters unlocked ✨</Text> : null}
          {spinAvailable ? (
            <Pressable onPress={onSpin} accessibilityRole="button" accessibilityLabel="Lucky Spin available" style={({ pressed }) => [styles.spinBanner, pressed && { opacity: 0.8 }]}>
              <Text style={styles.spinText}>🎰 Lucky Spin available! Tap to spin</Text>
            </Pressable>
          ) : null}
          <View style={styles.buttons}>
            <GradientButton label={hasNext ? 'Next Level ▶' : 'Level Map ▶'} onPress={onNext} width={230} testID="win-next" />
            <GradientButton label="Replay 🔄" variant="outline" borderColor={colors.coral} onPress={onReplay} width={230} height={50} />
            <GradientButton label="Home 🏠" variant="text" onPress={onHome} width={230} height={44} />
          </View>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(59,47,74,0.45)', zIndex: 30 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: { fontFamily: fonts.display, fontSize: 28, color: colors.coral, textAlign: 'center' },
  level: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, marginTop: 2 },
  stars: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginVertical: spacing.md, height: 70 },
  score: { fontFamily: fonts.display, fontSize: 36, color: colors.text },
  high: { fontFamily: fonts.heavy, fontSize: 16, color: colors.gold, marginTop: 4 },
  rescue: { fontFamily: fonts.heavy, fontSize: 18, color: colors.violet, marginTop: spacing.sm },
  golden: { fontFamily: fonts.heavy, fontSize: 14, color: colors.orange, marginTop: spacing.sm, textAlign: 'center' },
  spinBanner: { marginTop: spacing.md, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: '#FEF3C7', borderWidth: 2, borderColor: colors.amber, minHeight: 44, justifyContent: 'center' },
  spinText: { fontFamily: fonts.heavy, fontSize: 15, color: '#B45309' },
  buttons: { marginTop: spacing.lg, gap: spacing.sm, alignItems: 'center' },
});

export const winGradient = gradients.primary;
