import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import { Nunito_400Regular, Nunito_700Bold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { GameProvider, useGame } from '../src/state/GameProvider';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch((e) => console.warn('[splash]', e));

const paperTheme = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: colors.violet, secondary: colors.coral, background: colors.bg },
};

function AppStack(): React.JSX.Element {
  const { loaded } = useGame();
  if (!loaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingEmoji}>🐱</Text>
        <ActivityIndicator color={colors.coral} />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        contentStyle: { backgroundColor: colors.bg },
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      <Stack.Screen name="gameplay" options={{ gestureEnabled: false, animation: 'fade_from_bottom' }} />
      <Stack.Screen name="daily-challenge" options={{ gestureEnabled: false, animation: 'fade_from_bottom' }} />
      <Stack.Screen name="lucky-spin" options={{ animation: 'fade_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout(): React.JSX.Element {
  const [fontsLoaded, fontError] = useFonts({
    FredokaOne_400Regular,
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (fontError) console.warn('[fonts] failed to load, using system fonts', fontError);
  }, [fontError]);

  const ready = fontsLoaded || !!fontError || timedOut;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch((e) => console.warn('[splash]', e));
  }, [ready]);

  if (!ready) return <View style={styles.loading} />;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <ErrorBoundary>
            <GameProvider>
              <StatusBar style="dark" />
              <AppStack />
            </GameProvider>
          </ErrorBoundary>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  loadingEmoji: { fontSize: 48, marginBottom: 12 },
});
