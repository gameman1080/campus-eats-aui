import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Modules
import { useTheme } from './src/components/UiKit';
import LoginScreen from './src/screens/LoginScreen';
import RestaurantDash from './src/screens/RestaurantDash';
import StudentDash from './src/screens/StudentDash';
import BudgetSetup from './src/screens/BudgetSetup'; 
import SettingsModal from './src/components/SettingsModal';
import { ApiService } from './src/services/api';

// Helper for Web Persistence
const saveSetting = (key: string, value: any) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const loadSetting = (key: string, defaultValue: any) => {
  if (Platform.OS === 'web') {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  }
  return defaultValue;
};

// Helper to retrieve the saved budget preference
const loadSavedBudget = () => {
    if (Platform.OS === 'web') {
        const saved = localStorage.getItem('pref_dailyBudget');
        return saved ? JSON.parse(saved) : 60; // Default fallback
    }
    return 60;
}

export default function CampusEatsApp() {
  const [screen, setScreen] = useState('login');
  const [settingsVisible, setSettingsVisible] = useState(false);
  
  // App State
  const [selectedRestaurant, setSelectedRestaurant] = useState('Proxy');
  const [mealPlan, setMealPlan] = useState([]);
  const [financialData, setFinancialData] = useState(null);

  // Settings State (Initialized from LocalStorage if available)
  const [themeMode, setThemeMode] = useState<'system'|'light'|'dark'>(() => loadSetting('themeMode', 'system'));
  const [highContrast, setHighContrast] = useState(() => loadSetting('highContrast', false));
  const [largeText, setLargeText] = useState(() => loadSetting('largeText', false));
  const [ttsEnabled, setTtsEnabled] = useState(() => loadSetting('ttsEnabled', false));

  // Persist Settings when changed
  useEffect(() => saveSetting('themeMode', themeMode), [themeMode]);
  useEffect(() => saveSetting('highContrast', highContrast), [highContrast]);
  useEffect(() => saveSetting('largeText', largeText), [largeText]);
  useEffect(() => saveSetting('ttsEnabled', ttsEnabled), [ttsEnabled]);

  const theme = useTheme(themeMode, highContrast);

  // Persistence Logic: Check for existing plan on load
  useEffect(() => {
    checkExistingPlan();
  }, []);

  const checkExistingPlan = async () => {
    try {
        const existing = await ApiService.getTodayPlan();
        if (existing && existing.suggestions && existing.suggestions.length > 0) {
            setMealPlan(existing.suggestions);
            
            // FIX: Restore Daily Budget from LocalStorage if Backend returns "N/A"
            // The backend doesn't store the budget limit, so we use the client's persisted preference.
            const savedBudget = loadSavedBudget();
            
            setFinancialData({
                ...existing.financialStatus,
                dailySafeBudget: existing.financialStatus.dailySafeBudget === "N/A" 
                    ? savedBudget.toFixed(2) 
                    : existing.financialStatus.dailySafeBudget
            });
            return true; // Plan exists
        }
    } catch (e) {
        console.log("Error checking plan:", e);
    }
    return false; // No plan
  };

  const handleStudentLogin = async () => {
    // Force a check to ensure we have the latest state before routing
    const hasPlan = await checkExistingPlan();
    
    if (hasPlan) {
        setScreen('studentDash'); 
    } else {
        setScreen('budgetSetup'); 
    }
  };

  // LOGOUT HANDLER
  const handleLogout = () => {
    // 1. Clear session storage
    if (Platform.OS === 'web') {
        localStorage.removeItem('currentUser');
    }
    // 2. Reset app state if needed
    setSelectedRestaurant('Proxy');
    setMealPlan([]);
    setFinancialData(null);
    // 3. Navigate to login
    setScreen('login');
  };

  const screenProps = {
    theme,
    setScreen,
    largeText,
    ttsEnabled,
    openSettings: () => setSettingsVisible(true),
    onStudentLogin: handleStudentLogin,
    onLogout: handleLogout 
  };

  const renderScreen = () => {
    switch(screen) {
        case 'login': 
            return (
                <LoginScreen 
                    {...screenProps}
                    setSelectedRestaurant={setSelectedRestaurant} 
                />
            );
        case 'restDash':
            return (
                <RestaurantDash 
                    {...screenProps}
                    restaurantName={selectedRestaurant} 
                />
            );
        case 'budgetSetup':
             return (
                <BudgetSetup 
                    {...screenProps}
                    setMealPlan={setMealPlan}
                    setFinancialData={setFinancialData}
                />
             );
        case 'studentDash':
            return (
                <StudentDash 
                    {...screenProps}
                    mealPlan={mealPlan}
                    financialData={financialData}
                />
            );
        default:
            return <LoginScreen {...screenProps} setSelectedRestaurant={setSelectedRestaurant} />;
    }
  };

  const webContainerStyle = Platform.OS === 'web' ? {
    userSelect: 'none',
    cursor: 'default',
    height: '100vh', 
    overflow: 'hidden' 
  } as any : {};

  return (
    <View style={[{ flex: 1, backgroundColor: theme.bg }, webContainerStyle]}>
      <StatusBar style={theme.bg === '#000000' ? 'light' : 'auto'} />
      {renderScreen()}
      <SettingsModal 
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        theme={theme}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        largeText={largeText}
        setLargeText={setLargeText}
        ttsEnabled={ttsEnabled}
        setTtsEnabled={setTtsEnabled}
      />
    </View>
  );
}