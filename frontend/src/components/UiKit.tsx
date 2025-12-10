import React, { useRef } from 'react';

import { 
  Animated, Pressable, View, Text, StyleSheet, Platform, 
  useColorScheme, Switch as RNSwitch, TouchableOpacity 
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { ArrowLeft, LogOut, Settings } from 'lucide-react-native';

// === THEME ENGINE ===
export const useTheme = (preference: 'system' | 'light' | 'dark', highContrast: boolean) => {
  const systemScheme = useColorScheme();
  const isDark = preference === 'system' ? systemScheme === 'dark' : preference === 'dark';

  if (highContrast) {
    return {
      bg: '#000000', cardBg: '#121212', text: '#FFD700', textDim: '#FFFFFF',
      primary: '#FFD700', primaryText: '#000000', border: '#FFFFFF',
      success: '#00FF00', error: '#FF0000', inputBg: '#333'
    };
  }
  return isDark ? {
    bg: '#0f172a', cardBg: '#1e293b', text: '#f1f5f9', textDim: '#94a3b8',
    primary: '#3b82f6', primaryText: '#ffffff', border: '#334155',
    success: '#10b981', error: '#ef4444', inputBg: '#1e293b'
  } : {
    bg: '#f8fafc', cardBg: '#ffffff', text: '#0f172a', textDim: '#64748b',
    primary: '#2563eb', primaryText: '#ffffff', border: '#e2e8f0',
    success: '#10b981', error: '#ef4444', inputBg: '#ffffff'
  };
};

// === TACTILE BUTTON (BOUNCY & REACTIVE) ===
export const TactileButton = ({ onPress, style, children, variant = 'primary', theme }: any) => {
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Animation Config
  const springConfig = {
    useNativeDriver: Platform.OS !== 'web',
    friction: 3, // Bouncy
    tension: 40,
  };

  const handlePressIn = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleValue, { toValue: 0.96, ...springConfig }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, ...springConfig }).start();
  };

  // Web Hover Effects
  const handleHoverIn = () => {
    if (Platform.OS === 'web') {
        Animated.spring(scaleValue, { toValue: 1.02, ...springConfig }).start();
    }
  };

  const handleHoverOut = () => {
    if (Platform.OS === 'web') {
        Animated.spring(scaleValue, { toValue: 1, ...springConfig }).start();
    }
  };

  const webStyles = Platform.OS === 'web' ? { 
    cursor: 'pointer', 
    userSelect: 'none',
    WebkitUserSelect: 'none',
    transition: '0.2s'
  } as any : {};

  return (
    <Pressable 
      onPress={onPress} 
      onPressIn={handlePressIn} 
      onPressOut={handlePressOut}
      onHoverIn={handleHoverIn}   // Web Cursor Reactivity
      onHoverOut={handleHoverOut} // Web Cursor Reactivity
      style={webStyles}
    >
      <Animated.View style={[
        styles.btnBase, 
        variant === 'primary' ? { backgroundColor: theme.primary } : { borderWidth: 1, borderColor: theme.border },
        variant === 'card' ? { alignItems: 'flex-start', padding: 12 } : {}, 
        style, 
        { transform: [{ scale: scaleValue }] }
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

// === HAPTIC SLIDER ===
export const HapticSlider = ({ value, onValueChange, min, max, step, theme }: any) => {
  const lastHapticValue = useRef(value);

  const handleValueChange = (val: number) => {
    if (Math.round(val) !== Math.round(lastHapticValue.current)) {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      lastHapticValue.current = val;
    }
    onValueChange(val);
  };

  const webStyles = Platform.OS === 'web' ? { 
    width: '100%',
    cursor: 'grab',
    touchAction: 'none'
  } as any : { width: '100%' };

  return (
    <View style={webStyles}>
        <Slider
            style={{ width: '100%', height: 40 }}
            minimumValue={min}
            maximumValue={max}
            step={step}
            value={value}
            onValueChange={handleValueChange}
            minimumTrackTintColor={theme.primary}
            maximumTrackTintColor={theme.border}
            thumbTintColor={theme.primary}
        />
    </View>
  );
};

// === NAV BAR ===
export const NavBar = ({ title, onBack, onLogout, onSettings, theme }: any) => (
  <View style={[styles.navBar, { borderBottomColor: theme.border }]}>
    <View style={{flexDirection:'row', alignItems:'center', gap:12}}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}>
          <ArrowLeft color={theme.text} size={24} />
        </TouchableOpacity>
      )}
      <Text style={[styles.navTitle, { color: theme.text }]}>{title}</Text>
    </View>
    
    <View style={{ flexDirection: 'row', gap: 15 }}>
        {onSettings && (
        <TouchableOpacity onPress={onSettings} style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}>
            <Settings color={theme.textDim} size={24} />
        </TouchableOpacity>
        )}
        {onLogout && (
        <TouchableOpacity onPress={onLogout} style={Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}}>
            <LogOut color={theme.error} size={24} />
        </TouchableOpacity>
        )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  btnBase: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.1, shadowRadius: 4 },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60, borderBottomWidth: 1 },
  navTitle: { fontSize: 20, fontWeight: 'bold' }
});