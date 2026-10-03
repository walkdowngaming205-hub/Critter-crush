import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLS, ROWS } from '../engine/board';

/** Computes a tile cell size that fits the 8x8 board in the remaining screen space. */
export function useBoardCell(reservedHeight: number): number {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const usableW = Math.min(width, 560) - 16 * 2 - 16;
  const usableH = height - insets.top - insets.bottom - reservedHeight;
  const cell = Math.floor(Math.min(usableW / COLS, usableH / ROWS, 60));
  return Math.max(30, cell);
}
