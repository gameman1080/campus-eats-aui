import { Platform, Alert } from 'react-native';

const YOUR_IPV4_ADDRESS = '10.0.2.2'; // Change this to your LAN IP for physical device

const BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:3000' 
  : `http://${YOUR_IPV4_ADDRESS}:3000`;

export const ApiService = {
  // === AUTH ===
  login: async (credentials: any) => {
    try {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        return data;
    } catch (e: any) { throw e; }
  },

  register: async (userData: any) => {
    try {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        return data;
    } catch (e: any) { throw e; }
  },

  // === STUDENT ===
  generatePlan: async (budget: number, preferences: any) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); 

      const res = await fetch(`${BASE_URL}/api/student/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            studentId: 'student-123', 
            daysRemaining: budget, 
            preferences 
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server Error ${res.status}: ${errorText}`);
      }
      return await res.json();
    } catch (error: any) {
      if (error.name === 'AbortError') throw new Error("Connection timed out. Check IP/Firewall.");
      throw error;
    }
  },

  getTodayPlan: async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/student/plan/today`);
        if (!res.ok) return null;
        return await res.json();
      } catch (e) { return null; }
  },

  getHistory: async () => {
    try {
        const res = await fetch(`${BASE_URL}/api/student/history`);
        if (!res.ok) throw new Error("Failed to fetch history");
        return await res.json();
    } catch (e) { return []; }
  },

  // === RESTAURANT ===
  getRestaurantMenu: async (restaurantName: string) => {
    try {
      const res = await fetch(`${BASE_URL}/api/restaurant/stats?restaurant=${restaurantName}`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) { return []; }
  },

  addMeal: async (mealData: any, restaurantName: string) => {
    const res = await fetch(`${BASE_URL}/api/restaurant/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mealData, restaurant_name: restaurantName })
    });
    return await res.json();
  },

  // NEW: Update Function
  updateMeal: async (id: number, mealData: any, restaurantName: string) => {
    const res = await fetch(`${BASE_URL}/api/restaurant/item/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...mealData, restaurant_name: restaurantName })
    });
    return await res.json();
  },

  deleteMeal: async (itemId: number, restaurantName: string) => {
    const res = await fetch(`${BASE_URL}/api/restaurant/item/${itemId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_name: restaurantName })
    });
    return res.ok;
  }
};