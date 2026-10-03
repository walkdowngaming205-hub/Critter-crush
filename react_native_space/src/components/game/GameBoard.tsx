import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import type { GameEngine, Direction } from '../../hooks/useGameEngine';
import { COLS, ROWS } from '../../engine/board';
import { TileView } from './TileView';
import { ParticleBurst } from './ParticleBurst';
import { ComboPopup } from './ComboPopup';
import { colors, radius, shadow } from '../../theme';

interface Props {
  engine: GameEngine;
  cell: number;
  reducedMotion: boolean;
}

const BOARD_PAD = 6;

export function GameBoard({ engine, cell, reducedMotion }: Props): React.JSX.Element {
  const { board, spawnRows, clearingIds, shakeTokens, selected, hint, popups, bursts, multiplier, onTapCell, onSwipe } = engine;
  const width = cell * COLS;
  const height = cell * ROWS;

  const gesture = useMemo(() => {
    const cellAt = (x: number, y: number) => ({
      r: Math.max(0, Math.min(ROWS - 1, Math.floor(y / cell))),
      c: Math.max(0, Math.min(COLS - 1, Math.floor(x / cell))),
    });
    let fired = false;
    let start = { r: 0, c: 0 };
    const pan = Gesture.Pan()
      .runOnJS(true)
      .minDistance(8)
      .onStart((e) => {
        fired = false;
        start = cellAt(e.x - e.translationX, e.y - e.translationY);
      })
      .onUpdate((e) => {
        if (fired) return;
        const threshold = cell * 0.3;
        const ax = Math.abs(e.translationX);
        const ay = Math.abs(e.translationY);
        if (Math.max(ax, ay) < threshold) return;
        fired = true;
        const dir: Direction = ax > ay ? (e.translationX > 0 ? 'right' : 'left') : e.translationY > 0 ? 'down' : 'up';
        onSwipe(start, dir);
      });
    const tap = Gesture.Tap()
      .runOnJS(true)
      .maxDistance(10)
      .onEnd((e, success) => {
        if (success) onTapCell(cellAt(e.x, e.y));
      });
    return Gesture.Race(pan, tap);
  }, [cell, onSwipe, onTapCell]);

  const tiles = useMemo(() => {
    const out: React.JSX.Element[] = [];
    const hintKeys = new Set((hint ?? []).map((p) => `${p.r},${p.c}`));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const t = board?.[r]?.[c];
        if (!t) continue;
        out.push(
          <TileView
            key={t.id}
            tile={t}
            row={r}
            col={c}
            cell={cell}
            spawnRow={spawnRows[t.id]}
            clearing={clearingIds.has(t.id)}
            selected={!!selected && selected.r === r && selected.c === c}
            hinted={hintKeys.has(`${r},${c}`)}
            shakeToken={shakeTokens[t.id] ?? 0}
            reducedMotion={reducedMotion}
          />,
        );
      }
    }
    return out;
  }, [board, cell, spawnRows, clearingIds, selected, hint, shakeTokens, reducedMotion]);

  return (
    <View style={[styles.outer, { width: width + BOARD_PAD * 2, height: height + BOARD_PAD * 2 }]}>
      <LinearGradient colors={['#FFF9EF', '#FFEFD9']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      <GestureDetector gesture={gesture}>
        <View
          style={{ width, height }}
          accessibilityRole="adjustable"
          accessibilityLabel="Game board. Tap a tile then an adjacent tile, or swipe a tile, to swap."
        >
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: COLS }).map((__, c) => (
              <View
                key={`bg-${r}-${c}`}
                pointerEvents="none"
                style={[styles.cellBg, { left: c * cell, top: r * cell, width: cell, height: cell, backgroundColor: (r + c) % 2 === 0 ? 'rgba(243,223,193,0.35)' : 'rgba(255,255,255,0.25)' }]}
              />
            )),
          )}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.clip]}>
            {tiles}
          </View>
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {bursts.map((b) => (
              <ParticleBurst key={b.id} x={b.c * cell + cell / 2} y={b.r * cell + cell / 2} color={b.color} size={cell} />
            ))}
            {popups.map((p) => (
              <ComboPopup key={p.id} popup={p} />
            ))}
          </View>
        </View>
      </GestureDetector>
      {multiplier > 1 && (
        <View pointerEvents="none" style={styles.multBadge}>
          <Text style={styles.multText}>{`${multiplier}x combo`}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.lg,
    padding: BOARD_PAD,
    backgroundColor: colors.board,
    borderWidth: 2,
    borderColor: colors.boardBorder,
    overflow: 'visible',
    ...shadow,
  },
  cellBg: { position: 'absolute', borderRadius: 6 },
  clip: { overflow: 'hidden', borderRadius: radius.md },
  multBadge: {
    position: 'absolute',
    top: -14,
    right: 8,
    backgroundColor: colors.violet,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  multText: { color: colors.white, fontWeight: '800', fontSize: 13 },
});
