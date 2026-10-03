import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Divider, Switch } from 'react-native-paper';
import Constants from 'expo-constants';
import { useGame } from '../src/state/GameProvider';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { GradientButton } from '../src/components/ui/GradientButton';
import { ConfirmDialog } from '../src/components/ui/ConfirmDialog';
import { colors, fonts, gradients, radius, spacing } from '../src/theme';
import { haptics } from '../src/utils/haptics';

function ToggleRow({ emoji, label, value, onChange }: { emoji: string; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>
        {emoji}  {label}
      </Text>
      <Switch value={value} onValueChange={onChange} color={colors.violet} accessibilityLabel={label} />
    </View>
  );
}

export default function SettingsScreen(): React.JSX.Element {
  const { state, updateSettings, resetProgress } = useGame();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const streak = state.streak?.currentStreak ?? 0;

  return (
    <LinearGradient colors={gradients.screen} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScreenHeader title="Settings ⚙️" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <ToggleRow emoji="🔊" label="Sound Effects" value={!!state.settings?.soundEnabled} onChange={(v) => updateSettings({ soundEnabled: v })} />
            <Divider />
            <ToggleRow
              emoji="📳"
              label="Haptic Feedback"
              value={!!state.settings?.hapticsEnabled}
              onChange={(v) => {
                updateSettings({ hapticsEnabled: v });
                if (v) setTimeout(() => haptics.light(), 50);
              }}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔥 Streak</Text>
            <Text style={styles.streakValue}>{streak} day{streak === 1 ? '' : 's'}</Text>
            <Text style={styles.cardSub}>Play daily to keep your streak!</Text>
            <Text style={styles.cardSub}>
              {state.streak?.goldenTileUnlocked ? '✨ Golden critters unlocked' : `✨ Golden critters unlock at a 3-day streak (${Math.min(streak, 3)}/3)`}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Danger zone</Text>
            <Text style={styles.cardSub}>Erase all levels, stars, scores, power-ups and streaks.</Text>
            <GradientButton
              label="Reset All Progress"
              variant="outline"
              borderColor={colors.danger}
              onPress={() => setConfirm(true)}
              loading={busy}
              style={styles.resetBtn}
              width="100%"
              height={50}
            />
          </View>

          <Text style={styles.version}>Critter Crush v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </ScrollView>
        <ConfirmDialog
          visible={confirm}
          title="Reset progress?"
          message="This will erase all progress, scores, and unlocked levels. Are you sure?"
          confirmLabel="Reset"
          destructive
          onCancel={() => setConfirm(false)}
          onConfirm={async () => {
            setConfirm(false);
            setBusy(true);
            try {
              await resetProgress();
              haptics.success();
            } finally {
              setBusy(false);
            }
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: radius.lg, padding: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 52 },
  toggleLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  cardTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.text },
  streakValue: { fontFamily: fonts.display, fontSize: 30, color: colors.orange, marginTop: 4 },
  cardSub: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginTop: 4 },
  resetBtn: { marginTop: spacing.md },
  version: { textAlign: 'center', fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
});
