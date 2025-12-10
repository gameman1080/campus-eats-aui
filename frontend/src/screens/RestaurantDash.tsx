import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Switch, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Plus, Trash2, Eye, Pencil, Save, X } from 'lucide-react-native';
import { ApiService } from '../services/api';
import { NavBar, TactileButton } from '../components/UiKit';

export default function RestaurantDash({ theme, setScreen, restaurantName, openSettings, largeText }: any) {
  const [menu, setMenu] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const fontBase = largeText ? 20 : 16;
  const fontSmall = largeText ? 16 : 12;
  const fontHeader = largeText ? 24 : 18;

  // Form State
  const [formItem, setFormItem] = useState({ 
    name: '', price: '', category: 'Lunch', ingredients: '', calories: '',
    is_vegan: false, contains_gluten: false, contains_peanuts: false, contains_dairy: false 
  });

  useEffect(() => { loadMenu(); }, [restaurantName]);

  const loadMenu = async () => {
    try {
        const data = await ApiService.getRestaurantMenu(restaurantName);
        setMenu(data);
    } catch (e) { Alert.alert("Error", "Could not load menu"); }
  };

  const startEdit = (item: any) => {
    setFormItem({
        name: item.name,
        price: item.price.toString(),
        category: item.category,
        ingredients: item.ingredients || '',
        calories: item.calories.toString(),
        is_vegan: item.is_vegan,
        contains_gluten: item.contains_gluten,
        contains_peanuts: item.contains_peanuts,
        contains_dairy: item.contains_dairy
    });
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const startAdd = () => {
    setFormItem({ 
        name: '', price: '', category: 'Lunch', ingredients: '', calories: '', 
        is_vegan: false, contains_gluten: false, contains_peanuts: false, contains_dairy: false 
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!formItem.name || !formItem.price) return Alert.alert("Required", "Name and Price are required.");

    try {
        const payload = { ...formItem, calories: Number(formItem.calories) };
        
        if (editingId) {
            // Update Mode
            await ApiService.updateMeal(editingId, payload, restaurantName);
            Alert.alert("Success", "Meal updated!");
        } else {
            // Add Mode
            await ApiService.addMeal(payload, restaurantName);
            Alert.alert("Success", "Meal added!");
        }
        
        setIsFormOpen(false);
        loadMenu();
    } catch (e) { Alert.alert("Error", "Operation failed"); }
  };

  const handleDelete = async (id: number) => {
    Alert.alert("Delete Item", "Confirm delete?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: 'destructive', onPress: async () => {
                await ApiService.deleteMeal(id, restaurantName);
                loadMenu(); 
            }}
    ]);
  };

  // --- RENDER FORM ---
  if (isFormOpen) {
    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <NavBar title={editingId ? "Edit Item" : "New Item"} onBack={() => setIsFormOpen(false)} theme={theme} />
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={[styles.label, { color: theme.textDim, fontSize: fontSmall }]}>Basic Info</Text>
                <TextInput 
                    placeholder="Meal Name" 
                    placeholderTextColor={theme.textDim} 
                    style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, fontSize: fontBase }]} 
                    value={formItem.name} 
                    onChangeText={t => setFormItem({...formItem, name: t})} 
                />
                
                <View style={{flexDirection:'row', gap: 10}}>
                    <TextInput 
                        placeholder="Price" 
                        placeholderTextColor={theme.textDim} 
                        style={[styles.input, { flex:1, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, fontSize: fontBase }]} 
                        value={formItem.price} 
                        keyboardType='numeric' 
                        onChangeText={t => setFormItem({...formItem, price: t})} 
                    />
                    <TextInput 
                        placeholder="Calories" 
                        placeholderTextColor={theme.textDim} 
                        style={[styles.input, { flex:1, backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, fontSize: fontBase }]} 
                        value={formItem.calories} 
                        keyboardType='numeric' 
                        onChangeText={t => setFormItem({...formItem, calories: t})} 
                    />
                </View>

                <TextInput 
                    placeholder="Category (Lunch, Dinner, Snack)" 
                    placeholderTextColor={theme.textDim} 
                    style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, fontSize: fontBase }]} 
                    value={formItem.category} 
                    onChangeText={t => setFormItem({...formItem, category: t})} 
                />
                
                <Text style={[styles.label, { color: theme.textDim, marginTop: 10, fontSize: fontSmall }]}>Ingredients</Text>
                <TextInput 
                    placeholder="e.g. Chicken, Flour, Milk" 
                    placeholderTextColor={theme.textDim} 
                    style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.border, fontSize: fontBase }]} 
                    value={formItem.ingredients} 
                    onChangeText={t => setFormItem({...formItem, ingredients: t})} 
                />

                <View style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 10, marginTop: 10 }}>
                    {['is_vegan', 'contains_gluten', 'contains_peanuts', 'contains_dairy'].map(key => (
                        <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderColor: theme.border }}>
                            <Text style={{ color: theme.text, textTransform: 'capitalize', fontSize: fontBase }}>{key.replace(/_/g, ' ')}</Text>
                            <Switch value={(formItem as any)[key]} onValueChange={v => setFormItem({...formItem, [key]: v})} />
                        </View>
                    ))}
                </View>

                <TactileButton theme={theme} onPress={handleSubmit} style={{ marginTop: 20 }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Save color="#FFF" />
                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: fontBase }}>
                            {editingId ? "Update Item" : "Save to Menu"}
                        </Text>
                    </View>
                </TactileButton>
            </ScrollView>
        </View>
    );
  }

  // --- RENDER DASH ---
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <NavBar 
            title={`Dashboard: ${restaurantName}`} 
            onLogout={() => setScreen('login')} 
            onSettings={openSettings}
            theme={theme} 
        />
        <View style={{ padding: 20 }}>
            <TactileButton theme={theme} onPress={startAdd}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Plus color="#FFF" />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: fontBase }}>Add Menu Item</Text>
                </View>
            </TactileButton>
        </View>

        <FlatList
            data={menu}
            contentContainerStyle={{ padding: 20 }}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
                <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.border }]}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: theme.text, fontSize: fontHeader, fontWeight: 'bold' }}>{item.name}</Text>
                            <Text style={{ color: theme.success, fontWeight: 'bold', fontSize: fontBase }}>{item.price} MAD</Text>
                        </View>
                        <Text style={{ color: theme.textDim, fontSize: fontSmall, marginTop: 4 }}>
                            {item.category} • {item.calories} kcal
                        </Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        {/* View Count */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 5 }}>
                            <Eye size={16} color={theme.textDim} />
                            <Text style={{ color: theme.textDim, fontSize: fontSmall }}>{item.popularity_score || 0}</Text>
                        </View>
                        
                        {/* Edit Button */}
                        <TouchableOpacity onPress={() => startEdit(item)} style={[styles.actionBtn, { backgroundColor: '#E0F2FE' }]}>
                            <Pencil size={20} color="#0284C7" />
                        </TouchableOpacity>

                        {/* Delete Button */}
                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={[styles.actionBtn, { backgroundColor: '#FEE2E2' }]}>
                            <Trash2 size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        />
    </View>
  );
}

const styles = StyleSheet.create({
    label: { fontWeight: 'bold', marginBottom: 5, fontSize: 12, textTransform: 'uppercase' },
    input: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 15 },
    card: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    actionBtn: { padding: 10, borderRadius: 8 }
});