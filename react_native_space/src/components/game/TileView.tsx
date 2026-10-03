import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { Tile } from '../../types/game';
import { CRITTERS, SPECIAL_EMOJI } from '../../constants/critters';

interface Props {
  tile: Tile;
  row: number;
  col: number;
  cell: number;
  spawnRow: number | undefined;
  clearing: boolean;
  selected: boolean;
  hinted: boolean;
  shakeToken: number;
  reducedMotion: boolean;
}

const MOVE_SPRING = { damping: 12, stiffness: 150, mass: 0.7 };

function TileViewBase({ tile, row, col, cell, spawnRow, clearing, selected, hinted, shakeToken, reducedMotion }: Props) {
  const gap = Math.max(2, Math.round(cell * 0.06));
  const size = cell - gap;
  const x = useSharedValue(col * cell);
  const y = useSharedValue((spawnRow ?? row) * cell);
  const scale = useSharedValue(tile.special ? 0 : 1);
  const opacity = useSharedValue(spawnRow !== undefined && spawnRow < row ? 0 : 1);
  const shakeX = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (tile.special) scale.value = withSpring(1, { damping: 9, stiffness: 160 });
    if (opacity.value < 1) opacity.value = withTiming(1, { duration: reducedMotion ? 80 : 220 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    x.value = reducedMotion ? withTiming(col * cell, { duration: 100 }) : withSpring(col * cell, MOVE_SPRING);
  }, [col, cell, reducedMotion, x]);

  useEffect(() => {
    y.value = reducedMotion ? withTiming(row * cell, { duration: 120 }) : withSpring(row * cell, MOVE_SPRING);
  }, [row, cell, reducedMotion, y]);

  useEffect(() => {
    if (clearing) {
      scale.value = withSequence(withTiming(1.3, { duration: 90 }), withTiming(0, { duration: 160 }));
      opacity.value = withTiming(0, { duration: 250 });
    }
  }, [clearing, scale, opacity]);

  useEffect(() => {
    if (shakeToken > 0) {
      const d = reducedMotion ? 30 : 50;
      shakeX.value = withSequence(
        withTiming(-6, { duration: d }),
        withTiming(6, { duration: d }),
        withTiming(-4, { duration: d }),
        withTiming(4, { duration: d }),
        withTiming(0, { duration: d }),
      );
    }
  }, [shakeToken, reducedMotion, shakeX]);

  const animatedBorder = hinted || !!tile.special || tile.golden;
  useEffect(() => {
    if (animatedBorder && !reducedMotion) {
      pulse.value = withRepeat(withTiming(1, { duration: tile.special === 'rainbow' ? 1400 : 650 }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [animatedBorder, reducedMotion, tile.special, pulse]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + shakeX.value },
      { translateY: y.value },
      { scale: scale.value * (selected ? 1.08 : 1) * (hinted ? 1 + pulse.value * 0.08 : 1) },
    ],
    opacity: opacity.value,
  }));

  const def = CRITTERS[tile.type] ?? CRITTERS.cat;
  const borderColorBase = tile.golden ? '#F59E0B' : def.border;

  const borderStyle = useAnimatedStyle(() => {
    if (hinted) {
      return { borderColor: interpolateColor(pulse.value, [0, 1], ['#FFFFFF', '#FF6B6B']), borderWidth: 3 };
    }
    if (tile.special === 'rainbow') {
      return {
        borderColor: interpolateColor(pulse.value, [0, 0.25, 0.5, 0.75, 1], ['#F87171', '#FBBF24', '#34D399', '#38BDF8', '#A855F7']),
        borderWidth: 3,
      };
    }
    if (tile.special === 'bomb') {
      return { borderColor: interpolateColor(pulse.value, [0, 1], ['#EF4444', '#FECACA']), borderWidth: 3 };
    }
    if (tile.special === 'lineH' || tile.special === 'lineV') {
      return { borderColor: interpolateColor(pulse.value, [0, 1], ['#F59E0B', '#FEF08A']), borderWidth: 3 };
    }
    if (tile.golden) {
      return { borderColor: interpolateColor(pulse.value, [0, 1], ['#F59E0B', '#FFFBEB']), borderWidth: 2 };
    }
    return { borderColor: selected ? '#FFFFFF' : borderColorBase, borderWidth: selected ? 3 : 1.5 };
  });

  const emojiSize = Math.round(size * 0.62);
  const bg = tile.special === 'rainbow' ? '#FFFFFF' : tile.golden ? '#FCD34D' : def.color;
  const label = `${tile.golden ? 'golden ' : ''}${tile.special === 'rainbow' ? 'rainbow' : def.name}${
    tile.special && tile.special !== 'rainbow' ? (tile.special === 'bomb' ? ' bomb' : ' lightning') : ''
  } tile`;

  return (
    <Animated.View
      pointerEvents="none"
      accessible
      accessibilityLabel={label}
      accessibilityHint={`row ${row + 1} column ${col + 1}, ${label}`}
      style={[styles.wrap, { width: cell, height: cell, padding: gap / 2 }, containerStyle]}
    >
      <Animated.View
        style={[
          styles.tile,
          { width: size, height: size, borderRadius: Math.round(size * 0.28), backgroundColor: bg },
          selected && styles.selectedShadow,
          borderStyle,
        ]}
      >
        <View style={[styles.innerShine, { borderRadius: Math.round(size * 0.24) }]} />
        {(tile.special === 'lineH' || tile.special === 'lineV') && (
          <View
            style={[
              styles.stripe,
              tile.special === 'lineH'
                ? { height: Math.max(3, size * 0.12), width: size * 0.9 }
                : { width: Math.max(3, size * 0.12), height: size * 0.9 },
            ]}
          />
        )}
        <Text style={[styles.emoji, { fontSize: emojiSize, lineHeight: Math.round(emojiSize * 1.2) }]} allowFontScaling={false}>
          {tile.special === 'rainbow' ? SPECIAL_EMOJI.rainbow : def.emoji}
        </Text>
        {(tile.special === 'lineH' || tile.special === 'lineV' || tile.special === 'bomb') && (
          <Text style={[styles.badge, { fontSize: Math.round(size * 0.3) }]} allowFontScaling={false}>
            {SPECIAL_EMOJI[tile.special]}
          </Text>
        )}
        {tile.golden && (
          <Text style={[styles.sparkle, { fontSize: Math.round(size * 0.26) }]} allowFontScaling={false}>
            ✨
          </Text>
        )}
      </Animated.View>
    </Animated.View>
  );
}

export const TileView = React.memo(TileViewBase);

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, top: 0 },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  selectedShadow: {
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  innerShine: {
    position: 'absolute',
    top: 2,
    left: 3,
    right: 3,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  stripe: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 4,
  },
  emoji: { textAlign: 'center' },
  badge: { position: 'absolute', right: 1, bottom: 0 },
  sparkle: { position: 'absolute', left: 1, top: 0 },
});
