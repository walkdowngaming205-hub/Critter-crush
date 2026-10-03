import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../../theme';
import { haptics } from '../../utils/haptics';

export interface PowerUpSlot {
  key: string;
  emoji: string;
  label: string;
  count?: number | null;
  disabled?: boolean;
  active?: boolean;
  onPress: () => void;
}

export function PowerUpBar({ slots }: { slots: PowerUpSlot[] }): React.JSX.Element {
  return (
    <View style={styles.bar}>
      {slots.map((s) => (
        <Pressable
          key={s.key}
          testID={`powerup-${s.key}`}
          accessibilityRole="button"
          accessibilityLabel={`${s.label}${typeof s.count === 'number' ? `, ${s.count} available` : ''}`}
          accessibilityState={{ disabled: !!s.disabled, selected: !!s.active }}
          disabled={s.disabled}
          onPress={() => {
            haptics.light();
            s.onPress?.();
          }}
          style={({ pressed }) => [styles.slotWrap, pressed && !s.disabled && { transform: [{ scale: 0.92 }] }]}
        >
          <View style={[styles.slot, s.active && styles.active, s.disabled && styles.disabled]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            {typeof s.count === 'number' ? (
              <View style={[styles.badge, s.count <= 0 && styles.badgeEmpty]}>
                <Text style={styles.badgeText}>{s.count}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.label} numberOfLines={1}>
            {s.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 6 },
  slotWrap: { alignItems: 'center', width: 62 },
  slot: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.boardBorder,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  active: { borderColor: colors.coral, borderWidth: 3, backgroundColor: '#FFF1F1' },
  disabled: { opacity: 0.4 },
  emoji: { fontSize: 24 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeEmpty: { backgroundColor: colors.gray },
  badgeText: { color: colors.white, fontFamily: fonts.heavy, fontSize: 11 },
  label: { fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted, marginTop: 3 },
});
