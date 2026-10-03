import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import { useGame } from '../src/state/GameProvider';
import { getLevel, LEVEL_COUNT } from '../src/constants/levels';
import { useGameEngine, type PowerUpKind } from '../src/hooks/useGameEngine';
import { useBoardCell } from '../src/hooks/useBoardCell';
import { GameBoard } from '../src/components/game/GameBoard';
import { GameTopBar, ScoreRow } from '../src/components/game/GameTopBar';
import { PowerUpBar, type PowerUpSlot } from '../src/components/game/PowerUpBar';
import { StarProgressBar } from '../src/components/ui/StarProgressBar';
import { WinModal } from '../src/components/game/WinModal';
import { LoseOverlay } from '../src/components/game/LoseOverlay';
import { RescueCelebration } from '../src/components/game/RescueCelebration';
import { ConfirmDialog } from '../src/components/ui/ConfirmDialog';
import { GradientButton } from '../src/components/ui/GradientButton';
import { colors, fonts, gradients, spacing } from '../src/theme';
import { haptics } from '../src/utils/haptics';
import type { LevelDef, WinOutcome } from '../src/types/game';

type Phase = 'playing' | 'rescue' | 'won' | 'lost';

const goBackSafe = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/level-select');
};

function LevelGame({ def, onReplay }: { def: LevelDef; onReplay: () => void }): React.JSX.Element {
  const { state, msToNextLife, recordLevelWin, loseLife, consumeInventory, pendingSpinLevel } = useGame();
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>('playing');
  const [outcome, setOutcome] = useState<WinOutcome | null>(null);
  const [freeShuffle, setFreeShuffle] = useState(true);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const finishedRef = useRef(false);
  const cell = useBoardCell(52 + 72 + 86 + 40);

  const onConsumePowerUp = useCallback((kind: PowerUpKind) => consumeInventory(kind), [consumeInventory]);
  const engine = useGameEngine({
    types: def.availableTypes,
    goldenEnabled: !!state.streak?.goldenTileUnlocked,
    reducedMotion,
    canPlay: phase === 'playing',
    onConsumePowerUp,
  });
  const movesLeft = Math.max(0, def.maxMoves - engine.movesUsed);
  const targetReached = engine.score >= def.targetScore;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (engine.score >= def.targetScore) {
      const o = recordLevelWin(def.levelId, engine.score, movesLeft);
      setOutcome(o);
      haptics.success();
      if (o.isRescue) {
        setPhase('rescue');
        setTimeout(() => setPhase('won'), 2300);
      } else {
        setPhase('won');
      }
    } else {
      loseLife();
      haptics.error();
      setPhase('lost');
    }
  }, [engine.score, def, movesLeft, recordLevelWin, loseLife]);

  useEffect(() => {
    if (phase === 'playing' && !engine.busy && movesLeft <= 0) finish();
  }, [phase, engine.busy, movesLeft, finish]);

  const requestQuit = useCallback(() => {
    if (phase !== 'playing') {
      goBackSafe();
      return;
    }
    setConfirmQuit(true);
  }, [phase]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      requestQuit();
      return true;
    });
    return () => sub.remove();
  }, [requestQuit]);

  const doQuit = () => {
    setConfirmQuit(false);
    if (engine.movesUsed > 0 && phase === 'playing') loseLife();
    finishedRef.current = true;
    goBackSafe();
  };

  const inv = state.inventory;
  const shuffleCount = (freeShuffle ? 1 : 0) + (inv?.shuffle ?? 0);
  const controlsDisabled = engine.busy || phase !== 'playing';
  const slots: PowerUpSlot[] = [
    {
      key: 'shuffle',
      emoji: '🔀',
      label: 'Shuffle',
      count: shuffleCount,
      disabled: controlsDisabled || shuffleCount <= 0,
      onPress: async () => {
        if (freeShuffle) {
          const ok = await engine.shuffle();
          if (ok) setFreeShuffle(false);
        } else if (consumeInventory('shuffle')) {
          await engine.shuffle();
        }
      },
    },
    { key: 'hint', emoji: '💡', label: 'Hint', disabled: controlsDisabled, onPress: engine.showHint },
    {
      key: 'bomb',
      emoji: '💣',
      label: engine.armed === 'bomb' ? 'Tap tile' : 'Bomb',
      count: inv?.bomb ?? 0,
      active: engine.armed === 'bomb',
      disabled: controlsDisabled || (inv?.bomb ?? 0) <= 0,
      onPress: () => engine.setArmed(engine.armed === 'bomb' ? null : 'bomb'),
    },
    {
      key: 'lightning',
      emoji: '⚡',
      label: engine.armed === 'lightning' ? 'Tap tile' : 'Lightning',
      count: inv?.lightning ?? 0,
      active: engine.armed === 'lightning',
      disabled: controlsDisabled || (inv?.lightning ?? 0) <= 0,
      onPress: () => engine.setArmed(engine.armed === 'lightning' ? null : 'lightning'),
    },
  ];

  const nextId = def.levelId < LEVEL_COUNT ? def.levelId + 1 : null;

  return (
    <LinearGradient colors={gradients.gameplay} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <GameTopBar title={`Level ${def.levelId}`} onBack={requestQuit}>
          <StarProgressBar score={engine.score} thresholds={def.starThresholds} />
        </GameTopBar>
        <ScoreRow
          score={engine.score}
          targetLabel={`Target: ${def.targetScore.toLocaleString('en-US')}`}
          badgeValue={String(movesLeft)}
          badgeLabel="moves"
          badgeUrgent={movesLeft <= 5}
          note={targetReached ? '🎯 Target reached! Keep going for more stars' : null}
        />
        <View style={styles.boardArea}>
          <GameBoard engine={engine} cell={cell} reducedMotion={reducedMotion} />
          {engine.armed ? <Text style={styles.armedHint}>Tap any tile to use your {engine.armed === 'bomb' ? '💣 bomb' : '⚡ lightning'}</Text> : null}
        </View>
        <PowerUpBar slots={slots} />
        <View style={styles.finishRow}>
          {targetReached && phase === 'playing' ? (
            <GradientButton label="Finish Level ✔" height={40} width={200} gradient={gradients.daily} disabled={engine.busy} onPress={finish} testID="finish-level" />
          ) : null}
        </View>
      </SafeAreaView>

      {phase === 'rescue' && outcome?.rescuedEmoji ? <RescueCelebration emoji={outcome.rescuedEmoji} reducedMotion={reducedMotion} /> : null}
      {phase === 'won' && outcome ? (
        <WinModal
          levelId={def.levelId}
          score={engine.score}
          outcome={outcome}
          hasNext={nextId !== null}
          spinAvailable={outcome.stars >= 3 && pendingSpinLevel === def.levelId}
          onNext={() => {
            if (nextId) router.replace({ pathname: '/gameplay', params: { levelId: String(nextId) } });
            else router.replace('/level-select');
          }}
          onReplay={onReplay}
          onHome={() => router.dismissTo('/')}
          onSpin={() => router.push({ pathname: '/lucky-spin', params: { available: 'true', levelId: String(def.levelId) } })}
        />
      ) : null}
      {phase === 'lost' ? (
        <LoseOverlay
          score={engine.score}
          target={def.targetScore}
          lives={state.lives}
          msToNextLife={msToNextLife}
          onRetry={onReplay}
          onHome={() => router.dismissTo('/')}
          reducedMotion={reducedMotion}
        />
      ) : null}
      <ConfirmDialog
        visible={confirmQuit}
        title="Quit level?"
        message={engine.movesUsed > 0 ? 'Your progress on this level will be lost and you will lose 1 life.' : 'Your progress on this level will be lost.'}
        confirmLabel="Quit"
        destructive
        onConfirm={doQuit}
        onCancel={() => setConfirmQuit(false)}
      />
    </LinearGradient>
  );
}

export default function GameplayScreen(): React.JSX.Element {
  const { levelId = '' } = useLocalSearchParams<{ levelId?: string }>();
  const id = parseInt(String(levelId ?? ''), 10);
  const def = Number.isFinite(id) ? getLevel(id) : null;
  const { state, msToNextLife } = useGame();
  const [run, setRun] = useState(0);
  const progress = state.levels?.find((l) => l.levelId === def?.levelId);
  const [entryLives] = useState(state.lives);

  if (!def || !progress?.unlocked) {
    return (
      <View style={styles.center}>
        <Text style={styles.msgEmoji}>🔒</Text>
        <Text style={styles.msg}>{def ? 'This level is still locked.' : 'Level not found.'}</Text>
        <GradientButton label="Level Map" onPress={() => router.replace('/level-select')} />
      </View>
    );
  }
  if (entryLives <= 0 && run === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.msgEmoji}>💔</Text>
        <Text style={styles.msg}>You are out of lives.</Text>
        <Text style={styles.sub}>Next life in {Math.ceil(msToNextLife / 60000)} min</Text>
        <GradientButton label="Back" onPress={goBackSafe} />
      </View>
    );
  }
  return <LevelGame key={`${def.levelId}-${run}`} def={def} onReplay={() => setRun((r) => r + 1)} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boardArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.sm },
  armedHint: { marginTop: spacing.sm, fontFamily: fonts.heavy, fontSize: 14, color: colors.coral },
  finishRow: { height: 48, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: spacing.md, padding: spacing.lg },
  msgEmoji: { fontSize: 56 },
  msg: { fontFamily: fonts.display, fontSize: 22, color: colors.text, textAlign: 'center' },
  sub: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },
});
