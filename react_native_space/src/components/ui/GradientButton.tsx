import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, fonts, gradients, shadow } from '../../theme';
import { haptics } from '../../utils/haptics';

type Variant = 'gradient' | 'outline' | 'text';

interface Props {
  label: string;
  subtitle?: string;
  onPress: () => void;
  variant?: Variant;
  gradient?: readonly [string, string, ...string[]];
  borderColor?: string;
  textColor?: string;
  disabled?: boolean;
  loading?: boolean;
  width?: number | `${number}%`;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  badge?: React.ReactNode;
}

export function GradientButton({
  label,
  subtitle,
  onPress,
  variant = 'gradient',
  gradient = gradients.primary,
  borderColor = colors.coral,
  textColor,
  disabled,
  loading,
  width = 240,
  height = 56,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
  badge,
}: Props): React.JSX.Element {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isDisabled = !!disabled || !!loading;
  const fg = textColor ?? (variant === 'gradient' ? colors.white : variant === 'outline' ? borderColor : colors.textMuted);

  const content = (
    <View style={styles.inner}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          <Text style={[styles.label, { color: fg }, variant === 'text' && styles.textLabel]} numberOfLines={1}>
            {label}
          </Text>
          {!!subtitle && (
            <Text style={[styles.subtitle, { color: fg }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[{ width, opacity: isDisabled ? 0.55 : 1 }, aStyle, style]}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPressIn={() => {
          scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 250 });
        }}
        onPress={() => {
          haptics.light();
          onPress?.();
        }}
        android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false }}
        style={[
          styles.base,
          { height, borderRadius: height / 2 },
          variant === 'gradient' && shadow,
          variant === 'outline' && { borderWidth: 2, borderColor, backgroundColor: 'rgba(255,255,255,0.85)' },
        ]}
      >
        {variant === 'gradient' ? (
          <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]} />
        ) : null}
        {content}
        {badge}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  inner: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  label: { fontFamily: fonts.display, fontSize: 19, letterSpacing: 0.3 },
  textLabel: { fontSize: 17 },
  subtitle: { fontFamily: fonts.bold, fontSize: 12, opacity: 0.95, marginTop: 1 },
});
