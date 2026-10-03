import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

let enabled = true;
export function setHapticsEnabled(v: boolean): void {
  enabled = v;
}

const canRun = (): boolean => enabled && Platform.OS !== 'web';

function run(p: Promise<void> | undefined): void {
  p?.catch?.((e: unknown) => console.warn('[haptics]', e));
}

export const haptics = {
  light: () => canRun() && run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => canRun() && run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => canRun() && run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  error: () => canRun() && run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
  success: () => canRun() && run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  select: () => canRun() && run(Haptics.selectionAsync()),
};
