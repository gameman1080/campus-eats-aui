import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Modal, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { Activity } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { NavBar, TactileButton } from '../components/UiKit';
import { ApiService } from '../services/api';

export default function StudentDash({ theme, setScreen, mealPlan, financialData, openSettings, largeText, ttsEnabled, onLogout }: any) {
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLog, setHistoryLog] = useState<any[]>([]);

  // Font Scaling
  const fontBase = largeText ? 20 : 16;
  const fontSmall = largeText ? 16 : 12;
  const fontHeader = largeText ? 28 : 24;

  // TTS on Load
  useEffect(() => {
    if (ttsEnabled && mealPlan && mealPlan.length > 0) {
        const names = mealPlan.map((m: any) => m.name).join(', ');
        Speech.speak(`Here is your meal plan: ${names}`);
    }
  }, [mealPlan]);

  // Load History from DB
  useEffect(() => {
    if (showHistory) {
        ApiService.getHistory()
            .then(setHistoryLog)
            .catch(() => {});
    }
  }, [showHistory]);

  const handleMealPress = (meal: any) => {
    setSelectedMeal(meal);
    if (ttsEnabled) {
        Speech.speak(`${meal.name}. ${meal.calories} calories. Ingredients: ${meal.ingredients}`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <NavBar 
        title="Today's Plan" 
        onLogout={onLogout} 
        onSettings={openSettings}
        theme={theme} 
      />

      {/* Financial Summary */}
      {financialData && (
        <View style={[styles.summaryCard, { backgroundColor: theme.cardBg }]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
                <Text style={{color: theme.textDim, fontSize: fontSmall, fontWeight:'bold'}}>TOTAL COST</Text>
                <Text style={{color: theme.textDim, fontSize: fontSmall, fontWeight:'bold'}}>DAILY LIMIT</Text>
            </View>
            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <Text style={{color: theme.text, fontSize: fontHeader, fontWeight: 'bold'}}>{financialData.planCost || 0} MAD</Text>
                <Text style={{color: theme.primary, fontSize: fontHeader, fontWeight: 'bold'}}>{financialData.dailySafeBudget} MAD</Text>
            </View>
        </View>
      )}

      {/* Action Bar */}
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 10 }}>
        <TactileButton theme={theme} style={{ flex: 1 }} onPress={() => setScreen('budgetSetup')}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: fontBase }}>Preferences</Text>
        </TactileButton>
        <TactileButton theme={theme} variant="secondary" style={{ flex: 1 }} onPress={() => setShowHistory(true)}>
            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: fontBase }}>History</Text>
        </TactileButton>
      </View>

      {/* Meal List */}
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {(!mealPlan || mealPlan.length === 0) && (
            <Text style={{ color: theme.textDim, textAlign: 'center', marginTop: 20, fontSize: fontBase }}>
                No meals found within your budget. Try adjusting your preferences.
            </Text>
        )}
        
        {mealPlan?.map((item: any, idx: number) => (
            <TactileButton 
                key={idx} 
                theme={theme} 
                variant="card"
                style={{ marginBottom: 15 }} 
                onPress={() => handleMealPress(item)}
            >
                <View style={{ width: '100%' }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                        <Text style={{ fontSize: fontSmall, color: theme.textDim, textTransform: 'uppercase', fontWeight: 'bold' }}>
                            {item.category}
                        </Text>
                        <Text style={{ fontSize: fontBase, color: theme.success, fontWeight: 'bold' }}>
                            {item.price} MAD
                        </Text>
                    </View>
                    <Text style={{ color: theme.text, fontSize: fontBase + 2, fontWeight: 'bold' }}>{item.name}</Text>
                    <Text style={{ color: theme.textDim, fontSize: fontSmall }}>{item.restaurant_name}</Text>
                </View>
            </TactileButton>
        ))}
      </ScrollView>

      {/* History Modal */}
      <Modal visible={showHistory} animationType="slide" onRequestClose={() => setShowHistory(false)}>
         <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <NavBar title="History" onBack={() => setShowHistory(false)} theme={theme} />
            <FlatList 
                data={historyLog}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ padding: 20 }}
                renderItem={({item}) => (
                    <TouchableOpacity 
                        onPress={() => handleMealPress(item)}
                        style={[
                            styles.card, 
                            { backgroundColor: theme.cardBg, borderColor: theme.border },
                            Platform.OS === 'web' ? { userSelect: 'none', cursor: 'pointer' } as any : {}
                        ]}
                    >
                        <View style={{flex: 1}}>
                            <Text style={{ color: theme.textDim, fontSize: fontSmall }}>
                                {item.log_date ? new Date(item.log_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                            </Text>
                            <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: fontBase }}>{item.name}</Text>
                        </View>
                        <Text style={{ color: theme.success, fontWeight: 'bold', fontSize: fontBase }}>{item.price} MAD</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <Text style={{ textAlign: 'center', color: theme.textDim, marginTop: 20, fontSize: fontBase }}>No history found.</Text>
                }
            />
         </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={!!selectedMeal} transparent animationType="fade" onRequestClose={() => setSelectedMeal(null)}>
        <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.cardBg }]}>
                <Text style={{ fontSize: fontHeader, fontWeight: 'bold', color: theme.text }}>{selectedMeal?.name}</Text>
                <Text style={{ color: theme.textDim, marginBottom: 20, fontSize: fontBase }}>{selectedMeal?.restaurant_name}</Text>
                
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Activity size={fontBase} color={theme.textDim} />
                        <Text style={{ color: theme.textDim, fontSize: fontBase }}>{selectedMeal?.calories} kcal</Text>
                    </View>
                </View>

                <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: fontBase }}>Ingredients</Text>
                <Text style={{ color: theme.textDim, fontStyle: 'italic', marginBottom: 20, fontSize: fontBase }}>
                    {selectedMeal?.ingredients || "No ingredients listed"}
                </Text>

                <TactileButton theme={theme} onPress={() => setSelectedMeal(null)}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: fontBase }}>Close</Text>
                </TactileButton>
            </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: { margin: 20, padding: 20, borderRadius: 12, marginBottom: 20 },
  card: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', padding: 25, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
});