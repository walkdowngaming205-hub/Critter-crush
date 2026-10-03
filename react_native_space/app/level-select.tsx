import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions, type ListRenderItemInfo } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useGame } from '../src/state/GameProvider';
import { LEVELS } from '../src/constants/levels';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { LivesDisplay } from '../src/components/ui/LivesDisplay';
import { ConfirmDialog } from '../src/components/ui/ConfirmDialog';
import { colors, fonts, gradients, radius, spacing } from '../src/theme';
import { haptics } from '../src/utils/haptics';
import { formatMMSS } from '../src/utils/date';
import type { LevelProgress } from '../src/types/game';

const ROW_H = 112;
const NODE = 64;
const OFFSETS = [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7];

interface NodeProps {
  item: LevelProgress;
  isCurrent: boolean;
  offset: number;
  nextOffset: number | null;
  onPress: (item: LevelProgress) => void;
  reducedMotion: boolean;
}

const nodeColors = (stars: number): readonly [string, string] => {
  if (stars >= 3) return ['#FDE68A', '#F59E0B'] as const;
  if (stars === 2) return ['#C4B5FD', '#A855F7'] as const;
  return ['#A7F3D0', '#34D399'] as const;
};

const LevelNode = React.memo(function LevelNode({ item, isCurrent, offset, nextOffset, onPress, reducedMotion }: NodeProps) {
  const glow = useSharedValue(0);
  const shake = useSharedValue(0);
  const isRescue = item.levelId % 5 === 0;
  const completed = item.stars > 0;

  useEffect(() => {
    if (isCurrent && !reducedMotion) glow.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    else glow.value = 0;
  }, [isCurrent, reducedMotion, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + glow.value * 0.35 }],
    opacity: isCurrent ? 0.45 - glow.value * 0.35 : 0,
  }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const handlePress = () => {
    if (!item.unlocked) {
      haptics.error();
      shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-5, { duration: 50 }), withTiming(0, { duration: 50 }));
      return;
    }
    onPress(item);
  };

  return (
    <View style={styles.row}>
      {nextOffset !== null && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {[0.25, 0.42, 0.59, 0.76].map((t) => (
            <View
              key={t}
              style={[
                styles.pathDot,
                {
                  top: ROW_H / 2 + t * ROW_H - 3,
                  left: '50%',
                  marginLeft: offset + (nextOffset - offset) * t - 3,
                },
              ]}
            />
          ))}
        </View>
      )}
      <Animated.View style={[styles.nodeWrap, { marginLeft: offset * 2 }, shakeStyle]}>
        <Animated.View style={[styles.glow, glowStyle]} />
        <Pressable
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={`Level ${item.levelId}${item.unlocked ? '' : ', locked'}${completed ? `, ${item.stars} stars` : ''}${isRescue ? ', animal rescue level' : ''}`}
          accessibilityState={{ disabled: !item.unlocked }}
          style={({ pressed }) => [styles.node, !item.unlocked && styles.locked, pressed && item.unlocked && { transform: [{ scale: 0.95 }] }]}
        >
          {completed ? (
            <LinearGradient colors={nodeColors(item.stars)} style={[StyleSheet.absoluteFill, { borderRadius: NODE / 2 }]} />
          ) : null}
          {item.unlocked ? (
            <Text style={[styles.nodeText, completed && styles.nodeTextDone]}>{item.levelId}</Text>
          ) : (
            <Text style={styles.lock}>🔒</Text>
          )}
        </Pressable>
        <View style={styles.starsRow}>
          {completed
            ? [1, 2, 3].map((s) => (
                <Text key={s} style={[styles.miniStar, s > item.stars && styles.miniStarDim]}>
                  ⭐
                </Text>
              ))
            : null}
        </View>
        {isRescue ? (
          <View style={styles.rescueBadge}>
            <Text style={styles.rescueText}>🐾 Animal Rescue!</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
});

export default function LevelSelectScreen(): React.JSX.Element {
  const { state, msToNextLife } = useGame();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const amplitude = Math.min(110, Math.max(60, (Math.min(width, 520) - NODE) / 2 - 70)) / 2;
  const [noLives, setNoLives] = useState(false);

  const levels = useMemo(() => state.levels ?? [], [state.levels]);
  const currentId = useMemo(() => {
    const firstUnplayed = levels.find((l) => l.unlocked && l.stars === 0);
    return firstUnplayed?.levelId ?? levels.filter((l) => l.unlocked).slice(-1)[0]?.levelId ?? 1;
  }, [levels]);
  const currentIndex = Math.max(0, levels.findIndex((l) => l.levelId === currentId));

  const onPress = useCallback(
    (item: LevelProgress) => {
      if ((state.lives ?? 0) <= 0) {
        setNoLives(true);
        return;
      }
      router.push({ pathname: '/gameplay', params: { levelId: String(item.levelId) } });
    },
    [state.lives],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<LevelProgress>) => (
      <LevelNode
        item={item}
        isCurrent={item.levelId === currentId}
        offset={(OFFSETS[index % OFFSETS.length] ?? 0) * amplitude}
        nextOffset={index < levels.length - 1 ? (OFFSETS[(index + 1) % OFFSETS.length] ?? 0) * amplitude : null}
        onPress={onPress}
        reducedMotion={reducedMotion}
      />
    ),
    [currentId, amplitude, levels.length, onPress, reducedMotion],
  );

  const getItemLayout = useCallback((_: unknown, index: number) => ({ length: ROW_H, offset: ROW_H * index, index }), []);

  return (
    <LinearGradient colors={gradients.map} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScreenHeader title="Select Level" onBack={() => router.back()} />
        <View style={styles.livesBar}>
          <LivesDisplay lives={state.lives} msToNext={msToNextLife} compact />
          <Text style={styles.starsTotal}>⭐ {state.totalStars} / {LEVELS.length * 3}</Text>
        </View>
        <FlatList
          data={levels}
          keyExtractor={(l) => String(l.levelId)}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialScrollIndex={Math.max(0, currentIndex - 2)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
        <ConfirmDialog
          visible={noLives}
          title="Out of lives 💔"
          message={`You need a life to play. Next life in ${formatMMSS(msToNextLife)}.`}
          confirmLabel="OK"
          cancelLabel={null}
          onConfirm={() => setNoLives(false)}
          onCancel={() => setNoLives(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  livesBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  starsTotal: { fontFamily: fonts.heavy, fontSize: 15, color: colors.text },
  list: { paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  row: { height: ROW_H, alignItems: 'center', justifyContent: 'center' },
  nodeWrap: { alignItems: 'center', justifyContent: 'center', width: 160 },
  glow: { position: 'absolute', top: 0, width: NODE, height: NODE, borderRadius: NODE / 2, backgroundColor: colors.coral },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
    shadowColor: '#0F766E',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  locked: { backgroundColor: colors.grayLight, opacity: 0.6 },
  nodeText: { fontFamily: fonts.display, fontSize: 24, color: colors.coral },
  nodeTextDone: { color: colors.white, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } },
  lock: { fontSize: 24 },
  starsRow: { flexDirection: 'row', height: 18, marginTop: 2 },
  miniStar: { fontSize: 13 },
  miniStarDim: { opacity: 0.25 },
  pathDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.95)' },
  rescueBadge: { position: 'absolute', top: -14, backgroundColor: colors.orange, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  rescueText: { fontFamily: fonts.heavy, fontSize: 11, color: colors.white },
});
