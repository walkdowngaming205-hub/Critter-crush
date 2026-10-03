import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, ZoomIn, useReducedMotion } from 'react-native-reanimated';
import { useGame } from '../src/state/GameProvider';
import { useGameEngine } from '../src/hooks/useGameEngine';
import { useBoardCell } from '../src/hooks/useBoardCell';
import { GameBoard } from '../src/components/game/GameBoard';
import { GameTopBar, ScoreRow } from '../src/components/game/GameTopBar';
import { PowerUpBar } from '../src/components/game/PowerUpBar';
import { GradientButton } from '../src/components/ui/GradientButton';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { ConfirmDialog } from '../src/components/ui/ConfirmDialog';
import { AnimatedStar } from '../src/components/ui/AnimatedStar';
import { DAILY_TARGET, DAILY_TIME_LIMIT_S, DAILY_TYPE_COUNT } from '../src/constants/levels';
import { CRITTER_ORDER, CRITTERS } from '../src/constants/critters';
import { createRng, hashString, shuffleInPlace } from '../src/engine/rng';
import { dateKey, formatHMS, formatMMSS, msUntilMidnight, prettyDate } from '../src/utils/date';
import { colors, fonts, gradients, radius, spacing } from '../src/theme';
import { haptics } from '../src/utils/haptics';
import type { CritterType } from '../src/types/game';

function dailyConfig(date: string): { seed: number; types: CritterType[] } {
  const seed = hashString(`critter-crush-${date}`);
  const types = shuffleInPlace([...CRITTER_ORDER], createRng(seed)).slice(0, DAILY_TYPE_COUNT);
  return { seed, types };
}

const goBackSafe = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};

function DailyGame({ date, onDone }: { date: string; onDone: (score: number) => void }): React.JSX.Element {
  const { state, recordDaily } = useGame();
  const reducedMotion = useReducedMotion();
  const cfg = useMemo(() => dailyConfig(date), [date]);
  const [remainingMs, setRemainingMs] = useState(DAILY_TIME_LIMIT_S * 1000);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const timeUp = remainingMs <= 0;
  const finishedRef = useRef(false);
  const cell = useBoardCell(52 + 72 + 86 + 20);

  const engine = useGameEngine({
    types: cfg.types,
    seed: cfg.seed,
    goldenEnabled: !!state.streak?.goldenTileUnlocked,
    reducedMotion,
    canPlay: !timeUp,
  });

  useEffect(() => {
    const endAt = Date.now() + DAILY_TIME_LIMIT_S * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
      if (left <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (timeUp && !engine.busy && !finishedRef.current) {
      finishedRef.current = true;
      const star = engine.score >= DAILY_TARGET;
      recordDaily(date, engine.score, star);
      if (star) haptics.success();
      else haptics.error();
      onDone(engine.score);
    }
  }, [timeUp, engine.busy, engine.score, date, recordDaily, onDone]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirmQuit(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <LinearGradient colors={gradients.gameplay} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <GameTopBar title="Daily Challenge ⭐" onBack={() => setConfirmQuit(true)}>
          <View style={styles.flex} />
          <Text style={styles.date}>{prettyDate()}</Text>
        </GameTopBar>
        <ScoreRow
          score={engine.score}
          targetLabel={`Bonus star at ${DAILY_TARGET.toLocaleString('en-US')}`}
          badgeValue={formatMMSS(remainingMs)}
          badgeLabel="time"
          badgeUrgent={remainingMs <= 30000}
          note={engine.score >= DAILY_TARGET ? '⭐ Bonus star earned!' : null}
        />
        <View style={styles.boardArea}>
          <GameBoard engine={engine} cell={cell} reducedMotion={reducedMotion} />
          {timeUp ? <Text style={styles.timeUp}>⏰ Time’s up!</Text> : null}
        </View>
        <PowerUpBar slots={[{ key: 'hint', emoji: '💡', label: 'Hint', disabled: engine.busy || timeUp, onPress: engine.showHint }]} />
      </SafeAreaView>
      <ConfirmDialog
        visible={confirmQuit}
        title="Quit challenge?"
        message="Your score will not be saved. You can try again today."
        confirmLabel="Quit"
        destructive
        onConfirm={() => {
          setConfirmQuit(false);
          finishedRef.current = true;
          goBackSafe();
        }}
        onCancel={() => setConfirmQuit(false)}
      />
    </LinearGradient>
  );
}

export default function DailyChallengeScreen(): React.JSX.Element {
  const { state } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [lastScore, setLastScore] = useState(0);
  const [playDate, setPlayDate] = useState(() => dateKey());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const today = dateKey(new Date(now));
  const record = state.dailyChallenges?.[today];
  const cfg = useMemo(() => dailyConfig(today), [today]);
  const onDone = useCallback((score: number) => {
    setLastScore(score);
    setPhase('result');
  }, []);

  if (phase === 'playing') return <DailyGame date={playDate} onDone={onDone} />;

  const completed = !!record?.completed;
  const starEarned = !!record?.starEarned;
  const totalDailyStars = Object.values(state.dailyChallenges ?? {}).filter((d) => d?.starEarned).length;

  return (
    <LinearGradient colors={gradients.festive} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScreenHeader title="Daily Challenge ⭐" onBack={goBackSafe} />
        <View style={styles.introWrap}>
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.card}>
            <Text style={styles.cardDate}>{prettyDate(new Date(now))}</Text>
            {phase === 'result' || completed ? (
              <>
                <Text style={styles.cardTitle}>{phase === 'result' ? 'Challenge Complete!' : 'Already completed today'}</Text>
                <View style={styles.starRow}>
                  <AnimatedStar filled={starEarned} delay={200} size={64} />
                </View>
                <Text style={styles.label}>{phase === 'result' ? 'Your score' : 'Best score today'}</Text>
                <Text style={styles.bigScore}>{(phase === 'result' ? lastScore : record?.score ?? 0).toLocaleString('en-US')}</Text>
                <Text style={[styles.result, { color: starEarned ? colors.success : colors.textMuted }]}>
                  {starEarned ? '⭐ Bonus star earned!' : `Reach ${DAILY_TARGET.toLocaleString('en-US')} to earn the bonus star`}
                </Text>
                <Animated.Text entering={FadeIn.delay(300)} style={styles.tomorrow}>
                  Come back tomorrow!
                </Animated.Text>
                <Text style={styles.countdown} accessibilityLabel={`Next challenge in ${formatHMS(msUntilMidnight(new Date(now)))}`}>
                  Next challenge in {formatHMS(msUntilMidnight(new Date(now)))}
                </Text>
                <GradientButton label="Home 🏠" onPress={() => router.dismissTo('/')} style={styles.btn} />
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Today’s Board</Text>
                <Text style={styles.critterRow}>{cfg.types.map((t) => CRITTERS[t]?.emoji ?? '').join(' ')}</Text>
                <View style={styles.rules}>
                  <Text style={styles.rule}>⏱  {Math.round(DAILY_TIME_LIMIT_S / 60)} minutes, unlimited moves</Text>
                  <Text style={styles.rule}>⭐  Score {DAILY_TARGET.toLocaleString('en-US')}+ for a bonus star</Text>
                  <Text style={styles.rule}>🌍  Same board for everyone today</Text>
                  <Text style={styles.rule}>💚  Costs no lives</Text>
                </View>
                <GradientButton
                  label="Start ▶"
                  gradient={gradients.daily}
                  onPress={() => {
                    setPlayDate(today);
                    setPhase('playing');
                  }}
                  style={styles.btn}
                  testID="daily-start"
                />
              </>
            )}
          </Animated.View>
          <Text style={styles.footer}>Daily stars collected: ⭐ {totalDailyStars}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  date: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.sm },
  timeUp: { marginTop: spacing.sm, fontFamily: fonts.display, fontSize: 20, color: colors.coral },
  introWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { width: '100%', maxWidth: 380, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
  cardDate: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
  cardTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.orange, marginTop: 4, textAlign: 'center' },
  critterRow: { fontSize: 34, marginVertical: spacing.md, textAlign: 'center' },
  rules: { alignSelf: 'stretch', gap: spacing.sm, marginBottom: spacing.sm },
  rule: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  starRow: { height: 80, justifyContent: 'center', marginVertical: spacing.sm },
  label: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  bigScore: { fontFamily: fonts.display, fontSize: 40, color: colors.text },
  result: { fontFamily: fonts.heavy, fontSize: 15, textAlign: 'center', marginTop: 4 },
  tomorrow: { fontFamily: fonts.display, fontSize: 20, color: colors.violet, marginTop: spacing.md },
  countdown: { fontFamily: fonts.heavy, fontSize: 15, color: colors.textMuted, marginTop: 4 },
  btn: { marginTop: spacing.lg },
  footer: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text, marginTop: spacing.md },
});
