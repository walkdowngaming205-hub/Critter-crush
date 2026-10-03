import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '../../theme';
import { haptics } from '../../utils/haptics';

interface TopProps {
  title: string;
  onBack: () => void;
  children?: React.ReactNode;
}

export function GameTopBar({ title, onBack, children }: TopProps): React.JSX.Element {
  return (
    <View style={styles.top}>
      <Pressable
        onPress={() => {
          haptics.light();
          onBack?.();
        }}
        accessibilityRole="button"
        accessibilityLabel="Quit level"
        hitSlop={6}
        style={({ pressed }) => [styles.back, pressed && { opacity: 0.6 }]}
      >
        <Ionicons name="close" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {children}
    </View>
  );
}

interface ScoreProps {
  score: number;
  targetLabel: string;
  badgeValue: string;
  badgeLabel: string;
  badgeUrgent?: boolean;
  note?: string | null;
}

export function ScoreRow({ score, targetLabel, badgeValue, badgeLabel, badgeUrgent, note }: ScoreProps): React.JSX.Element {
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreBlock} accessible accessibilityLabel={`Score ${score}. ${targetLabel}`}>
        <Text style={styles.score} testID="score-value">
          {score.toLocaleString('en-US')}
        </Text>
        <Text style={styles.target}>{targetLabel}</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
      </View>
      <View style={[styles.badge, badgeUrgent && styles.badgeUrgent]} accessible accessibilityLabel={`${badgeValue} ${badgeLabel}`}>
        <Text style={styles.badgeValue} testID="moves-value">
          {badgeValue}
        </Text>
        <Text style={styles.badgeLabel}>{badgeLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', height: 52, paddingHorizontal: spacing.md },
  back: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.display, fontSize: 18, color: colors.text, marginLeft: spacing.sm, maxWidth: 150 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, height: 72 },
  scoreBlock: { flex: 1 },
  score: { fontFamily: fonts.display, fontSize: 30, color: colors.text },
  target: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  note: { fontFamily: fonts.heavy, fontSize: 12, color: colors.success },
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  badgeUrgent: { backgroundColor: colors.coral },
  badgeValue: { fontFamily: fonts.display, fontSize: 22, color: colors.white, lineHeight: 26 },
  badgeLabel: { fontFamily: fonts.bold, fontSize: 10, color: colors.white },
});
