import React, { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGame } from '../src/state/GameProvider';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { LEVELS } from '../src/constants/levels';
import { colors, fonts, gradients, radius, spacing } from '../src/theme';
import type { LevelProgress } from '../src/types/game';

const Row = React.memo(function Row({ item }: { item: LevelProgress }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`Level ${item.levelId}, ${item.stars} stars, high score ${item.highScore}, best moves left ${item.bestMovesLeft}`}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>{item.levelId}</Text>
      </View>
      <Text style={styles.stars}>
        {[1, 2, 3].map((s) => (s <= item.stars ? '⭐' : '☆')).join('')}
      </Text>
      <View style={styles.flex}>
        <Text style={styles.score}>{item.highScore.toLocaleString('en-US')}</Text>
        <Text style={styles.moves}>{item.bestMovesLeft} moves left</Text>
      </View>
    </View>
  );
});

export default function HighScoresScreen(): React.JSX.Element {
  const { state } = useGame();
  const completed = useMemo(() => (state.levels ?? []).filter((l) => l.stars > 0).sort((a, b) => a.levelId - b.levelId), [state.levels]);
  const daily = Object.values(state.dailyChallenges ?? {});
  const bestDaily = daily.reduce((m, d) => Math.max(m, d?.score ?? 0), 0);
  const dailyStars = daily.filter((d) => d?.starEarned).length;

  const header = (
    <View style={styles.stats}>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>
          ⭐ {state.totalStars}/{LEVELS.length * 3}
        </Text>
        <Text style={styles.statLabel}>Total stars</Text>
      </View>
      <View style={styles.statBox}>
        <Text style={styles.statValue}>
          ✅ {completed.length}/{LEVELS.length}
        </Text>
        <Text style={styles.statLabel}>Levels completed</Text>
      </View>
    </View>
  );

  const footer = (
    <View style={styles.dailySection}>
      <Text style={styles.sectionTitle}>Daily Challenge</Text>
      <View style={styles.stats}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{bestDaily.toLocaleString('en-US')}</Text>
          <Text style={styles.statLabel}>Best daily score</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>⭐ {dailyStars}</Text>
          <Text style={styles.statLabel}>Daily stars</Text>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={gradients.screen} style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScreenHeader title="High Scores 🏆" onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <FlatList
          data={completed}
          keyExtractor={(l) => String(l.levelId)}
          renderItem={({ item }: ListRenderItemInfo<LevelProgress>) => <Row item={item} />}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🐾</Text>
              <Text style={styles.emptyText}>No levels completed yet. Go crush some critters!</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  stats: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  statValue: { fontFamily: fonts.display, fontSize: 20, color: colors.text },
  statLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  levelBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  levelText: { fontFamily: fonts.display, fontSize: 18, color: colors.white },
  stars: { fontSize: 16, color: colors.gold, width: 72 },
  score: { fontFamily: fonts.display, fontSize: 20, color: colors.text, textAlign: 'right' },
  moves: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, textAlign: 'right' },
  dailySection: { marginTop: spacing.lg },
  sectionTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.text, marginBottom: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
});
