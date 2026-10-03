import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import type { Popup } from '../../hooks/useGameEngine';
import { colors, fonts } from '../../theme';

const COLORS: Record<string, string> = {
  'SWEET!': '#FF6B6B',
  'AMAZING!': '#A855F7',
  'LEGENDARY!': '#F59E0B',
};

function ComboPopupBase({ popup }: { popup: Popup }) {
  const tx = useSharedValue(popup.kind === 'combo' ? 220 : 0);
  const scale = useSharedValue(popup.kind === 'combo' ? 1 : 0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (popup.kind === 'combo') {
      tx.value = withSpring(0, { damping: 10, stiffness: 140 });
      opacity.value = withDelay(800, withTiming(0, { duration: 300 }));
    } else {
      scale.value = withSequence(withSpring(1.2, { damping: 8, stiffness: 200 }), withSpring(1));
      opacity.value = withDelay(600, withTiming(0, { duration: 300 }));
    }
  }, [popup.kind, tx, scale, opacity]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const color = popup.kind === 'combo' ? COLORS[popup.text] ?? colors.coral : popup.kind === 'mult' ? colors.violet : colors.text;
  return (
    <Animated.Text
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.text, popup.kind === 'combo' ? styles.combo : popup.kind === 'mult' ? styles.mult : styles.info, { color }, style]}
    >
      {popup.text}
    </Animated.Text>
  );
}

export const ComboPopup = React.memo(ComboPopupBase);

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: fonts.display,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  combo: { fontSize: 40, top: '38%' },
  mult: { fontSize: 34, top: '22%' },
  info: { fontSize: 22, top: '48%', backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, overflow: 'hidden' },
});
