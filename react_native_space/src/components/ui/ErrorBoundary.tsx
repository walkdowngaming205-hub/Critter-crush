import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.emoji}>😿</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <ScrollView style={styles.box}>
            <Text style={styles.msg}>{String(this.state.error?.message ?? this.state.error)}</Text>
            <Text style={styles.stack}>{this.state.error?.stack ?? ''}</Text>
          </ScrollView>
          <Pressable accessibilityRole="button" accessibilityLabel="Try again" style={styles.btn} onPress={() => this.setState({ error: null })}>
            <Text style={styles.btnText}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#FFF8F0', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 56 },
  title: { fontSize: 22, fontWeight: '800', color: '#3B2F4A', marginVertical: 12 },
  box: { maxHeight: 260, alignSelf: 'stretch', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12 },
  msg: { color: '#DC2626', fontWeight: '700', marginBottom: 8 },
  stack: { color: '#6F6380', fontSize: 11 },
  btn: { marginTop: 16, backgroundColor: '#FF6B6B', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});
