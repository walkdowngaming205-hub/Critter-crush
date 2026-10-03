import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useGame } from '../src/state/GameProvider';
import { GradientButton } from '../src/components/ui/GradientButton';
import { LivesDisplay } from '../src/components/ui/LivesDisplay';
import { FloatingCritter } from '../src/components/ui/FloatingCritter';
import { colors, fonts, gradients, radius, spacing } from '../src/theme';
import { dateKey, yesterdayKey } from '../src/utils/date';

const HOME_CRITTERS = ['🐱', '🐶', '🐰', '🦊'];

export default function HomeScreen(): React.JSX.Element {
  const { state, msToNextLife } = useGame();
  const reducedMotion = useReducedMotion();
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    bounce.value = withRepeat(
      withSequence(withTiming(-8, { duration: 700, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) })),
      -1,
      false,
    );
  }, [bounce, reducedMotion]);
  const titleStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  const today = dateKey();
  const dailyDone = !!state.dailyChallenges?.[today]?.completed;
  const last = state.streak?.lastPlayedDate;
  const streakActive = last === today || last === yesterdayKey();
  const streak = streakActive ? state.streak?.currentStreak ?? 0 : 0;
  const inv = state.inventory;
  const invTotal = (inv?.shuffle ?? 0) + (inv?.bomb ?? 0) + (inv?.lightning ?? 0);

  return (
    <LinearGradient colors={gradients.home} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.Text style={[styles.title, titleStyle]} accessibilityRole="header">
            Critter Crush
          </Animated.Text>
          {streak >= 1 ? (
            <View style={styles.streak} accessible accessibilityLabel={`${streak} day streak`}>
              <Text style={styles.streakText}>🔥 {streak} day streak!</Text>
            </View>
          ) : null}
          <Text style={styles.goldenNote}>
            {state.streak?.goldenTileUnlocked
              ? '✨ Golden critters unlocked — worth 5x points!'
              : 'Play 3 days in a row to unlock golden critters ✨'}
          </Text>

          <View style={styles.critters}>
            {HOME_CRITTERS.map((e, i) => (
              <FloatingCritter key={e} emoji={e} delay={i * 250} reducedMotion={reducedMotion} />
            ))}
          </View>

          <View style={styles.buttons}>
            <GradientButton label="▶  Play" onPress={() => router.push('/level-select')} testID="play-button" accessibilityHint="Opens the level map" />
            <GradientButton
              label={dailyDone ? '✅ Daily Challenge' : '⭐ Daily Challenge'}
              subtitle={dailyDone ? 'Completed!' : 'New board every day'}
              gradient={gradients.daily}
              onPress={() => router.push('/daily-challenge')}
              testID="daily-button"
            />
            <GradientButton label="🏆 High Scores" variant="outline" borderColor={colors.coral} onPress={() => router.push('/high-scores')} />
            <GradientButton label="⚙️ Settings" variant="outline" borderColor={colors.gray} textColor={colors.text} onPress={() => router.push('/settings')} />
          </View>

          {invTotal > 0 ? (
            <View style={styles.inventory} accessible accessibilityLabel="Power-up inventory">
              <Text style={styles.invTitle}>Your power-ups</Text>
              <Text style={styles.invText}>
                🔀 {inv?.shuffle ?? 0}   💣 {inv?.bomb ?? 0}   ⚡ {inv?.lightning ?? 0}
              </Text>
            </View>
          ) : null}

          {(state.rescuedAnimals?.length ?? 0) > 0 ? (
            <Text style={styles.rescued}>Rescued: {(state.rescuedAnimals ?? []).join(' ')}</Text>
          ) : null}

          <View style={styles.lives}>
            <LivesDisplay lives={state.lives} msToNext={msToNextLife} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md, flexGrow: 1, justifyContent: 'center' },
  title: {
    fontFamily: fonts.display,
    fontSize: 44,
    color: colors.coral,
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 4,
  },
  streak: { marginTop: spacing.sm, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 6 },
  streakText: { fontFamily: fonts.heavy, fontSize: 15, color: colors.orange },
  goldenNote: { marginTop: spacing.sm, fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  critters: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xl, height: 80, alignItems: 'center' },
  buttons: { gap: spacing.md, alignItems: 'center' },
  inventory: { marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: 'center' },
  invTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  invText: { fontFamily: fonts.heavy, fontSize: 17, color: colors.text, marginTop: 2 },
  rescued: { marginTop: spacing.md, fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  lives: { marginTop: spacing.lg },
});
