import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, Alert, Switch, Platform } from 'react-native';
import { Plus, X, Check } from 'lucide-react-native';
import { NavBar, TactileButton } from '../components/UiKit';
import { ApiService } from '../services/api';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

// Persistence Helper
const savePref = (key: string, value: any) => {
  if (Platform.OS === 'web') localStorage.setItem(`pref_${key}`, JSON.stringify(value));
};
const loadPref = (key: string, defaultValue: any) => {
  if (Platform.OS === 'web') {
    const saved = localStorage.getItem(`pref_${key}`);
    return saved ? JSON.parse(saved) : defaultValue;
  }
  return defaultValue;
};

export default function BudgetSetup({ theme, setScreen, setMealPlan, setFinancialData, openSettings, largeText, onLogout }: any) {
  // Initialize state from Storage
  const [dailyBudget, setDailyBudget] = useState(() => loadPref('dailyBudget', 60));
  const [allergies, setAllergies] = useState(() => loadPref('allergies', { 
    gluten: false, peanuts: false, dairy: false, veganOnly: false 
  }));
  const [customList, setCustomList] = useState<string[]>(() => loadPref('customList', []));
  
  const [loading, setLoading] = useState(false);
  const [extraTreat, setExtraTreat] = useState(() => loadPref('extraTreat', false));
  const [customAllergy, setCustomAllergy] = useState('');
  
  const lastHapticValue = useRef(dailyBudget);

  // Dynamic Fonts
  const fontBase = largeText ? 20 : 16;
  const fontTitle = largeText ? 24 : 18;
  const fontHuge = largeText ? 60 : 48;

  const canAffordTreat = dailyBudget >= 120;

  // Save on Change
  useEffect(() => savePref('dailyBudget', dailyBudget), [dailyBudget]);
  useEffect(() => savePref('allergies', allergies), [allergies]);
  useEffect(() => savePref('customList', customList), [customList]);
  useEffect(() => savePref('extraTreat', extraTreat), [extraTreat]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
        const data = await ApiService.generatePlan(dailyBudget, { 
            ...allergies, 
            customAllergies: customList,
            extraTreat: canAffordTreat && extraTreat 
        });

        if (data.error) {
           Alert.alert("Plan Error", data.error);
           return;
        }

        setMealPlan(data.suggestions);
        setFinancialData(data.financialStatus);
        setScreen('studentDash');
    } catch (e: any) {
        Alert.alert("Connection Error", "Please ensure the backend is running.\n\n" + e.message);
    } finally {
        setLoading(false);
    }
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim().length > 0) {
        setCustomList([...customList, customAllergy.trim()]);
        setCustomAllergy('');
    }
  };

  const handleSliderChange = (val: number) => {
    if (Math.round(val) !== Math.round(lastHapticValue.current)) {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      lastHapticValue.current = val;
    }
    setDailyBudget(val);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <NavBar 
        title="Plan Setup" 
        onBack={() => setScreen('login')} 
        onLogout={onLogout}
        onSettings={openSettings}
        theme={theme} 
      />
      
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        <View style={{ alignItems: 'center', marginBottom: 20, width: '100%' }}>
            <Text style={{ color: theme.textDim, fontWeight: 'bold', fontSize: fontBase }}>DAILY BUDGET (MAD)</Text>
            <Text style={{ color: theme.primary, fontSize: fontHuge, fontWeight: 'bold' }}>{Math.round(dailyBudget)}</Text>
            
            <View style={{ width: '100%', ...(Platform.OS === 'web' ? { touchAction: 'none' } : {}) }}>
                <Slider 
                    style={{ width: '100%', height: 40 }} 
                    minimumValue={45} 
                    maximumValue={200} 
                    step={5} 
                    value={dailyBudget} 
                    onValueChange={handleSliderChange} 
                    minimumTrackTintColor={theme.primary} 
                    maximumTrackTintColor={theme.border} 
                    thumbTintColor={theme.primary} 
                />
            </View>
            <Text style={{ color: theme.textDim, marginTop: 5, fontSize: fontBase }}>Range: 45 - 200 MAD</Text>
        </View>

        {canAffordTreat && (
            <TouchableOpacity 
                onPress={() => setExtraTreat(!extraTreat)}
                style={[styles.treatCard, { backgroundColor: extraTreat ? '#ECFDF5' : theme.cardBg, borderColor: extraTreat ? '#10B981' : theme.border }]}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: extraTreat ? '#10B981' : theme.textDim, alignItems: 'center', justifyContent: 'center' }}>
                        {extraTreat && <Check size={16} color="#10B981" />}
                    </View>
                    <View>
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: fontBase }}>Extra Treat unlocked! 🎉</Text>
                        <Text style={{ color: theme.textDim, fontSize: fontBase * 0.8 }}>Get 4 meals instead of 3 today.</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )}

        <Text style={{ color: theme.textDim, marginBottom: 10, fontWeight: 'bold', marginTop: 20, fontSize: fontBase }}>RESTRICTIONS</Text>
        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
            {['gluten', 'peanuts', 'dairy', 'veganOnly'].map(key => (
                <View key={key} style={[styles.row, { borderColor: theme.border }]}>
                    <Text style={{ color: theme.text, textTransform: 'capitalize', fontSize: fontBase }}>
                        {key === 'veganOnly' ? 'Vegan Only' : `No ${key}`}
                    </Text>
                    <Switch 
                        value={(allergies as any)[key]} 
                        onValueChange={v => setAllergies({...allergies, [key]: v})}
                    />
                </View>
            ))}
        </View>

        <Text style={{ color: theme.textDim, marginBottom: 10, fontWeight: 'bold', marginTop: 20, fontSize: fontBase }}>CUSTOM EXCLUSIONS</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 15 }}>
            <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, fontSize: fontBase }]}
                placeholder="e.g. Mushrooms"
                placeholderTextColor={theme.textDim}
                value={customAllergy}
                onChangeText={setCustomAllergy}
                onSubmitEditing={addCustomAllergy}
            />
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.success }]} onPress={addCustomAllergy}>
                <Plus color="#FFF" />
            </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
            {customList.map((item, i) => (
                <TouchableOpacity key={i} style={styles.chip} onPress={() => {
                        const list = [...customList];
                        list.splice(i, 1);
                        setCustomList(list);
                    }}>
                    <Text style={{ color: '#B91C1C', fontSize: fontBase }}>{item}</Text>
                    <X size={14} color="#B91C1C" />
                </TouchableOpacity>
            ))}
        </View>

        <TactileButton theme={theme} onPress={handleGenerate}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: fontTitle }}>
                {loading ? "Generating..." : "Generate Meal Plan"}
            </Text>
        </TactileButton>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  treatCard: { borderRadius: 12, borderWidth: 1, padding: 15, marginBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, alignItems: 'center' },
  input: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1 },
  addBtn: { width: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  chip: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 5 }
});