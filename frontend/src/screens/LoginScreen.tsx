import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, TextInput, Alert, Platform, Switch } from 'react-native';
import { ChefHat, GraduationCap, ChevronRight, X, Settings, ArrowLeft, User, CheckCircle } from 'lucide-react-native';
import { TactileButton } from '../components/UiKit';
import { ApiService } from '../services/api';

const KNOWN_RESTAURANTS = ['Proxy', 'Cossa', 'American', 'Pizzeria', 'Cafette'];
const SAFE_PASSWORD_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/;

// --- PERSISTENCE HELPERS ---
const saveSession = (user: any) => {
    if (Platform.OS === 'web') localStorage.setItem('currentUser', JSON.stringify(user));
};
const loadSession = () => {
    if (Platform.OS === 'web') {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    }
    return null;
};
const clearSession = () => {
    if (Platform.OS === 'web') localStorage.removeItem('currentUser');
}

// --- HELPER COMPONENTS ---
const Header = ({ theme, title, onBack }: any) => (
  <View style={{ width: '100%', flexDirection:'row', alignItems:'center', marginBottom: 30 }}>
      <TouchableOpacity onPress={onBack} style={{ padding: 10 }}>
          <ArrowLeft color={theme.text} size={28} />
      </TouchableOpacity>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: 'bold', marginLeft: 10 }}>{title}</Text>
  </View>
);

const Input = ({ theme, fontSize, ...props }: any) => (
  <TextInput 
      placeholderTextColor={theme.textDim} 
      style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, fontSize }]}
      {...props}
  />
);

export default function LoginScreen({ navigation, theme, setScreen, setSelectedRestaurant, largeText, openSettings, onStudentLogin }: any) {
  const [mode, setMode] = useState('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [restName, setRestName] = useState('Proxy');
  const [loading, setLoading] = useState(false);

  const titleSize = largeText ? 40 : 32;
  const subTitleSize = largeText ? 18 : 14;
  const btnTextSize = largeText ? 18 : 16;

  // --- AUTO LOGIN CHECK ---
  useEffect(() => {
    const checkSession = async () => {
        const savedUser = loadSession();
        if (savedUser) {
            setLoading(true);
            setTimeout(async () => {
                if (savedUser.role === 'restaurant') {
                    setSelectedRestaurant(savedUser.name);
                    setScreen('restDash');
                } else {
                    await onStudentLogin();
                }
                setLoading(false);
            }, 800);
        }
    };
    checkSession();
  }, []);

  // --- HANDLERS ---

  const handleLogin = async () => {
    if(!email || !password) return Alert.alert("Required", "Please fill in both email and password.");
    
    setLoading(true);
    try {
        const data = await ApiService.login({ email, password });
        
        if (rememberMe) saveSession(data.user);
        else clearSession();

        if (data.user.role === 'restaurant') {
            setSelectedRestaurant(data.user.name);
            setScreen('restDash');
        } else {
            await onStudentLogin(); 
        }
    } catch (e: any) {
        Alert.alert("Login Failed", e.message || "Invalid credentials.");
    } finally {
        setLoading(false);
    }
  };

  const handleRegStudent = async () => {
    if(!firstName || !lastName || !password) return Alert.alert("Required", "Please fill all fields.");
    if (!SAFE_PASSWORD_REGEX.test(password)) return Alert.alert("Invalid Password", "Password contains incompatible characters.");

    // We send names, backend handles email generation
    const displayName = `${firstName} ${lastName}`;
    const initialEmailGuess = `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}@aui.ma`;

    setLoading(true);
    try {
        // Pass firstName and lastName for smart email generation
        const data = await ApiService.register({ 
            email: initialEmailGuess, // Fallback/Hint
            password, 
            role: 'student', 
            displayName,
            firstName, 
            lastName 
        });
        
        // Use the ACTUAL email returned by the server
        const finalEmail = data.user.email;

        setEmail(finalEmail);
        setPassword(password);
        setMode('login');
        Alert.alert("Account Created", `Your generated email is: ${finalEmail}\n\nCredentials filled automatically. Please log in.`);
    } catch (e: any) {
        Alert.alert("Registration Failed", e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleRegRestaurant = async () => {
    if(!password) return Alert.alert("Required", "Password is required.");
    if (!SAFE_PASSWORD_REGEX.test(password)) return Alert.alert("Invalid Password", "Password contains incompatible characters.");
    
    const genEmail = `${restName.toLowerCase()}@aui.ma`;

    setLoading(true);
    try {
        const data = await ApiService.register({ email: genEmail, password, role: 'restaurant', displayName: restName });
        
        setEmail(data.user.email);
        setPassword(password);
        setMode('login');
        Alert.alert("Restaurant Registered", `Credentials set for ${data.user.email}. Please log in.`);
    } catch (e: any) {
        Alert.alert("Registration Failed", e.message);
    } finally {
        setLoading(false);
    }
  };

  // --- RENDER ---

  if (mode === 'login') {
      return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <Header title="Log In" onBack={() => setMode('landing')} theme={theme} />
            <View style={{ width: '100%', gap: 15 }}>
                <Input placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" theme={theme} fontSize={btnTextSize} />
                <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry theme={theme} fontSize={btnTextSize} />
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 5 }}>
                    <Text style={{ color: theme.textDim }}>Remember Me</Text>
                    <Switch value={rememberMe} onValueChange={setRememberMe} trackColor={{ false: theme.border, true: theme.primary }} />
                </View>
                <TactileButton theme={theme} onPress={handleLogin}>
                    <Text style={{color: '#FFF', fontWeight:'bold', fontSize: btnTextSize}}>{loading ? 'Logging in...' : 'Log In'}</Text>
                </TactileButton>
            </View>
        </View>
      );
  }

  if (mode === 'reg_student') {
      return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <Header title="Student Registration" onBack={() => setMode('landing')} theme={theme} />
            <View style={{ width: '100%', gap: 15 }}>
                <Input placeholder="First Name" value={firstName} onChangeText={setFirstName} theme={theme} fontSize={btnTextSize} />
                <Input placeholder="Last Name" value={lastName} onChangeText={setLastName} theme={theme} fontSize={btnTextSize} />
                <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry theme={theme} fontSize={btnTextSize} />
                
                {/* Updated Message to reflect dynamic generation */}
                <View style={{ padding: 10, backgroundColor: theme.cardBg, borderRadius: 8 }}>
                    <Text style={{ color: theme.textDim, fontSize: 12 }}>Estimated Email:</Text>
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
                        {firstName && lastName ? `${firstName.charAt(0).toLowerCase()}.${lastName.toLowerCase()}@aui.ma` : '...'}
                    </Text>
                    <Text style={{ color: theme.textDim, fontSize: 10, marginTop: 4 }}>
                        (If taken, we'll auto-adjust it for you)
                    </Text>
                </View>

                <TactileButton theme={theme} onPress={handleRegStudent}><Text style={{color: '#FFF', fontWeight:'bold', fontSize: btnTextSize}}>{loading ? 'Creating...' : 'Register'}</Text></TactileButton>
            </View>
        </View>
      );
  }

  if (mode === 'reg_rest') {
      return (
         <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <Header title="Restaurant Registration" onBack={() => setMode('landing')} theme={theme} />
            <View style={{ width: '100%', gap: 15 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                    {KNOWN_RESTAURANTS.map(r => (
                        <TouchableOpacity key={r} onPress={() => setRestName(r)} style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: restName === r ? theme.primary : theme.border }}>
                            <Text style={{ color: theme.text }}>{r}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <Input placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry theme={theme} fontSize={btnTextSize} />
                <View style={{ padding: 10, backgroundColor: theme.cardBg, borderRadius: 8 }}>
                    <Text style={{ color: theme.textDim, fontSize: 12 }}>Login Email:</Text>
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}>
                        {restName ? `${restName.toLowerCase()}@aui.ma` : '...'}
                    </Text>
                </View>
                <TactileButton theme={theme} onPress={handleRegRestaurant}><Text style={{color: '#FFF', fontWeight:'bold', fontSize: btnTextSize}}>{loading ? 'Registering...' : 'Register'}</Text></TactileButton>
            </View>
        </View>
      );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <TouchableOpacity onPress={openSettings} style={[styles.settingsBtn, Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}]}><Settings color={theme.textDim} size={28} /></TouchableOpacity>
      <View style={[styles.logo, { backgroundColor: theme.primary }]}><Text style={{ fontSize: 40, fontWeight: 'bold', color: '#FFF' }}>CE</Text></View>
      <Text style={[styles.title, { color: theme.text, fontSize: titleSize }]}>Campus Eats AUI</Text>
      
      {loading && mode === 'landing' ? (
        <View style={{ marginVertical: 20 }}><Text style={{ color: theme.textDim }}>Logging you in...</Text></View>
      ) : (
        <View style={{ width: '100%', gap: 16 }}>
            <TactileButton theme={theme} onPress={() => setMode('login')}><Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: btnTextSize }}>Log In</Text></TactileButton>
            <TactileButton theme={theme} variant="secondary" onPress={() => setMode('reg_student')}><View style={{flexDirection:'row', gap:10}}><GraduationCap color={theme.text} size={24}/><Text style={{ color: theme.text, fontWeight: 'bold', fontSize: btnTextSize }}>Register as Student</Text></View></TactileButton>
            <TactileButton theme={theme} variant="secondary" onPress={() => setMode('reg_rest')}><View style={{flexDirection:'row', gap:10}}><ChefHat color={theme.text} size={24}/><Text style={{ color: theme.text, fontWeight: 'bold', fontSize: btnTextSize }}>Register as Restaurant</Text></View></TactileButton>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  settingsBtn: { position: 'absolute', top: 60, right: 30, padding: 10 },
  logo: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontWeight: 'bold', marginBottom: 10 },
  input: { width: '100%', padding: 15, borderRadius: 10, borderWidth: 1 }
});