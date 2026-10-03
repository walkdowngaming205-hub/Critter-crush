import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
  Easing,
  ZoomIn,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useGame } from '../src/state/GameProvider';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { GradientButton } from '../src/components/ui/GradientButton';
import { colors, fonts, gradients, radius, spacing } from '../src/theme';
import { haptics } from '../src/utils/haptics';
import type { InventoryKind } from '../src/types/game';

type Reward = { kind: 'points'; amount: number } | { kind: 'item'; item: InventoryKind } | { kind: 'life' };

interface Segment {
  label: string;
  emoji: string;
  color: string;
  weight: number;
  reward: Reward;
}

const SEGMENTS: Segment[] = [
  { label: '+500', emoji: '💰', color: '#FF8A8A', weight: 24, reward: { kind: 'points', amount: 500 } },
  { label: 'Shuffle', emoji: '🔀', color: '#93C5FD', weight: 15, reward: { kind: 'item', item: 'shuffle' } },
  { label: '+1000', emoji: '💰', color: '#FDE68A', weight: 18, reward: { kind: 'points', amount: 1000 } },
  { label: 'Life', emoji: '❤️', color: '#F9A8D4', weight: 12, reward: { kind: 'life' } },
  { label: '+2000', emoji: '💎', color: '#86EFAC', weight: 10, reward: { kind: 'points', amount: 2000 } },
  { label: 'Bomb', emoji: '💣', color: '#C4B5FD', weight: 10, reward: { kind: 'item', item: 'bomb' } },
  { label: '+5000', emoji: '👑', color: '#FDBA74', weight: 3, reward: { kind: 'points', amount: 5000 } },
  { label: 'Lightning', emoji: '⚡', color: '#67E8F9', weight: 8, reward: { kind: 'item', item: 'lightning' } },
];
const SEG_ANGLE = 360 / SEGMENTS.length;

function pickWeighted(): number {
  const total = SEGMENTS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SEGMENTS.length; i++) {
    r -= SEGMENTS[i]?.weight ?? 0;
    if (r <= 0) return i;
  }
  return 0;
}

function slicePath(i: number, r: number): string {
  const a0 = ((i * SEG_ANGLE) * Math.PI) / 180;
  const a1 = (((i + 1) * SEG_ANGLE) * Math.PI) / 180;
  const x0 = r + r * Math.sin(a0);
  const y0 = r - r * Math.cos(a0);
  const x1 = r + r * Math.sin(a1);
  const y1 = r - r * Math.cos(a1);
  return `M ${r} ${r} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`;
}

export default function LuckySpinScreen(): React.JSX.Element {
  const { available = '' } = useLocalSearchParams<{ available?: string; levelId?: string }>();
  const { pendingSpinLevel, consumeSpin, addLevelPoints, addInventory, addLife } = useGame();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const size = Math.min(320, width - 48);
  const r = size / 2;

  const [canSpin] = useState(() => available === 'true' && pendingSpinLevel !== null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [collected, setCollected] = useState(false);
  const levelRef = useRef<number | null>(null);
  const rotation = useSharedValue(0);
  const pointer = useSharedValue(0);

  const wheelStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rotation.value}deg` }] }));
  const pointerStyle = useAnimatedStyle(() => ({ transform: [{ translateY: pointer.value }] }));

  useEffect(() => {
    if (!canSpin) return;
    // keep a reference so the reward applies to the level that earned it
    levelRef.current = pendingSpinLevel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSpinEnd = (idx: number) => {
    setSpinning(false);
    setResult(idx);
    haptics.success();
    pointer.value = withSequence(withSpring(-10, { damping: 4, stiffness: 300 }), withSpring(0));
  };

  const spin = () => {
    if (spinning || result !== null || !canSpin) return;
    const lvl = consumeSpin();
    levelRef.current = lvl ?? levelRef.current;
    const idx = pickWeighted();
    const center = idx * SEG_ANGLE + SEG_ANGLE / 2;
    const jitter = (Math.random() - 0.5) * (SEG_ANGLE * 0.6);
    const target = 360 * 6 + (360 - center) + jitter;
    setSpinning(true);
    haptics.medium();
    rotation.value = 0;
    rotation.value = withTiming(target, { duration: reducedMotion ? 600 : 4200, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onSpinEnd)(idx);
    });
  };

  const collect = () => {
    if (result === null || collected) return;
    const seg = SEGMENTS[result];
    if (!seg) return;
    const reward = seg.reward;
    if (reward.kind === 'points' && levelRef.current !== null) addLevelPoints(levelRef.current, reward.amount);
    if (reward.kind === 'item') addInventory(reward.item, 1);
    if (reward.kind === 'life') addLife();
    setCollected(true);
    haptics.success();
  };

  const seg = result !== null ? SEGMENTS[result] : null;
  const rewardText = (() => {
    if (!seg) return '';
    if (seg.reward.kind === 'points') return `${seg.label} points added to Level ${levelRef.current ?? ''}!`;
    if (seg.reward.kind === 'life') return 'An extra life ❤️';
    return `A free ${seg.label} power-up for your inventory!`;
  })();

  return (
    <LinearGradient colors={gradients.festive} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScreenHeader title="Lucky Spin! 🎰" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={styles.content}>
          {!canSpin ? (
            <View style={styles.card}>
              <Text style={styles.bigEmoji}>🎰</Text>
              <Text style={styles.title}>No spin available</Text>
              <Text style={styles.sub}>Earn 3 stars on any level to unlock a Lucky Spin!</Text>
              <GradientButton label="Level Map" onPress={() => router.replace('/level-select')} style={styles.btn} />
            </View>
          ) : (
            <>
              <View style={{ width: size, height: size + 20, alignItems: 'center' }}>
                <Animated.View style={[styles.pointer, pointerStyle]}>
                  <View style={styles.pointerTri} />
                </Animated.View>
                <Animated.View style={[{ width: size, height: size, marginTop: 20 }, wheelStyle]} accessible accessibilityLabel="Prize wheel">
                  <Svg width={size} height={size}>
                    {SEGMENTS.map((s, i) => (
                      <Path key={s.label} d={slicePath(i, r)} fill={s.color} stroke="#FFFFFF" strokeWidth={3} />
                    ))}
                    <Circle cx={r} cy={r} r={r - 2} stroke="#FFFFFF" strokeWidth={6} fill="none" />
                    <Circle cx={r} cy={r} r={26} fill="#FFFFFF" />
                  </Svg>
                  {SEGMENTS.map((s, i) => (
                    <View key={s.label} pointerEvents="none" style={[StyleSheet.absoluteFill, styles.labelWrap, { transform: [{ rotateZ: `${i * SEG_ANGLE + SEG_ANGLE / 2}deg` }] }]}>
                      <Text style={[styles.segEmoji, { marginTop: r * 0.14 }]}>{s.emoji}</Text>
                      <Text style={styles.segLabel}>{s.label}</Text>
                    </View>
                  ))}
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.hub]}>
                    <Text style={styles.hubText}>🍀</Text>
                  </View>
                </Animated.View>
              </View>

              {seg ? (
                <Animated.View entering={ZoomIn.springify()} style={styles.resultCard}>
                  <Text style={styles.resultEmoji}>{seg.emoji}</Text>
                  <Text style={styles.resultTitle}>You won {seg.label}!</Text>
                  <Text style={styles.sub}>{rewardText}</Text>
                  {collected ? (
                    <GradientButton label="Continue ▶" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={styles.btn} />
                  ) : (
                    <GradientButton label="Collect 🎁" gradient={gradients.daily} onPress={collect} style={styles.btn} testID="spin-collect" />
                  )}
                </Animated.View>
              ) : (
                <GradientButton label={spinning ? 'Spinning…' : 'SPIN!'} onPress={spin} disabled={spinning} height={64} style={styles.btn} testID="spin-button" />
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  card: { width: '100%', maxWidth: 360, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
  bigEmoji: { fontSize: 64 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, marginTop: spacing.sm },
  sub: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  btn: { marginTop: spacing.lg },
  pointer: { position: 'absolute', top: 0, zIndex: 5, alignItems: 'center' },
  pointerTri: {
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.violet,
  },
  labelWrap: { alignItems: 'center' },
  segEmoji: { fontSize: 24 },
  segLabel: { fontFamily: fonts.heavy, fontSize: 13, color: colors.text },
  hub: { alignItems: 'center', justifyContent: 'center' },
  hubText: { fontSize: 26 },
  resultCard: { marginTop: spacing.lg, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.xl, padding: spacing.md, alignItems: 'center', width: '100%', maxWidth: 360 },
  resultEmoji: { fontSize: 44 },
  resultTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.coral },
});
