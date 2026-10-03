import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MAX_LIVES } from '../../constants/levels';
import { colors, fonts } from '../../theme';
import { formatMMSS } from '../../utils/date';

interface Props {
  lives: number;
  msToNext: number;
  compact?: boolean;
}

export function LivesDisplay({ lives, msToNext, compact }: Props): React.JSX.Element {
  return (
    <View style={styles.wrap} accessible accessibilityLabel={`${lives} of ${MAX_LIVES} lives`}>
      <View style={styles.hearts}>
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <Text key={i} style={[styles.heart, compact && styles.heartCompact]}>
            {i < lives ? '❤️' : '🤍'}
          </Text>
        ))}
      </View>
      {lives < MAX_LIVES && msToNext > 0 && !compact && <Text style={styles.timer}>Next life in {formatMMSS(msToNext)}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  hearts: { flexDirection: 'row', gap: 4 },
  heart: { fontSize: 24 },
  heartCompact: { fontSize: 16 },
  timer: { marginTop: 4, fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
});
