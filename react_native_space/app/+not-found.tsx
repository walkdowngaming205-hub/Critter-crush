import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { GradientButton } from '../src/components/ui/GradientButton';
import { colors, fonts } from '../src/theme';

export default function NotFound(): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>🙀</Text>
      <Text style={styles.title}>This critter wandered off!</Text>
      <Text style={styles.sub}>The page you are looking for does not exist.</Text>
      <GradientButton label="Go Home 🏠" onPress={() => router.replace('/')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24, gap: 12 },
  emoji: { fontSize: 64 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.text, textAlign: 'center' },
  sub: { fontFamily: fonts.body, fontSize: 16, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
});
