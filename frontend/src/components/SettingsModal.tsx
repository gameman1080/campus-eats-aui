import React from 'react';

import { View, Text, Modal, Switch, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { X, Moon, Sun, Type, Volume2, Eye } from 'lucide-react-native';

import { TactileButton } from './UiKit';

export default function SettingsModal({
  visible,
  onClose,
  theme,
  themeMode,
  setThemeMode,
  highContrast,
  setHighContrast,
  largeText,
  setLargeText,
  ttsEnabled,
  setTtsEnabled,
}: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: theme.cardBg }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold' }}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Theme Section */}
          <Text style={[styles.sectionTitle, { color: theme.textDim }]}>APPEARANCE</Text>
          <View style={styles.row}>
            <TouchableOpacity
              onPress={() => setThemeMode('light')}
              style={[
                styles.themeBtn,
                { borderColor: theme.border },
                themeMode === 'light' && { borderColor: theme.primary, borderWidth: 2 },
              ]}
            >
              <Sun color={theme.text} />
              <Text style={{ color: theme.text }}>Light</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setThemeMode('dark')}
              style={[
                styles.themeBtn,
                { borderColor: theme.border },
                themeMode === 'dark' && { borderColor: theme.primary, borderWidth: 2 },
              ]}
            >
              <Moon color={theme.text} />
              <Text style={{ color: theme.text }}>Dark</Text>
            </TouchableOpacity>
          </View>

          {/* Accessibility Section */}
          <Text style={[styles.sectionTitle, { color: theme.textDim, marginTop: 20 }]}>
            ACCESSIBILITY
          </Text>

          <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.text }}>High Contrast</Text>
            <Switch value={highContrast} onValueChange={setHighContrast} />
          </View>

          <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.text }}>Large Text</Text>
            <Switch value={largeText} onValueChange={setLargeText} />
          </View>

          <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
            <Text style={{ color: theme.text }}>Text-to-Speech</Text>
            <Switch value={ttsEnabled} onValueChange={setTtsEnabled} />
          </View>

          <TactileButton theme={theme} onPress={onClose} style={{ marginTop: 20 }}>
            Done
          </TactileButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  card: { borderRadius: 20, padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  themeBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(128,128,128,0.1)',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
});
