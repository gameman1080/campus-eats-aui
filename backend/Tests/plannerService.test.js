const plannerService = require('../plannerService');
const db = require('../db');

// Mock the database module entirely
jest.mock('../db');

describe('PlannerService Unit Tests', () => {
  
  // Reset mocks before each test to ensure clean state
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- MOCK DATA ---
  const mockMenu = [
    { id: 1, name: 'Beef Burger', category: 'Dinner', price: 50, is_vegan: false, ingredients: 'Beef, Bun', is_available: true },
    { id: 2, name: 'Vegan Salad', category: 'Lunch', price: 30, is_vegan: true, ingredients: 'Lettuce, Tomato', is_available: true },
    { id: 3, name: 'Oatmeal', category: 'Breakfast', price: 15, is_vegan: true, ingredients: 'Oats, Water', is_available: true },
    { id: 4, name: 'Pizza', category: 'Dinner', price: 45, is_vegan: false, ingredients: 'Cheese, Dough', is_available: true },
    { id: 5, name: 'Cookie', category: 'Snack', price: 10, is_vegan: false, ingredients: 'Sugar, Flour', is_available: true }
  ];

  // ==========================================
  // 1. STUDENT SCENARIOS
  // ==========================================

  describe('generateMealPlan', () => {
    
    it('should generate a valid plan within budget', async () => {
      // Setup Mocks
      // Call 1: Get Menu Items
      db.query.mockResolvedValueOnce({ rows: mockMenu });
      // Call 2: Get History (Empty for this test)
      db.query.mockResolvedValueOnce({ rows: [] }); 
      // Calls 3+: Delete old logs, Insert new logs (Generic success)
      db.query.mockResolvedValue({ rowCount: 1 }); 

      const result = await plannerService.generateMealPlan('student-123', 100, {});

      // Assertions
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(parseFloat(result.financialStatus.planCost)).toBeLessThanOrEqual(100);
      expect(db.query).toHaveBeenCalledTimes(2 + result.suggestions.length * 2 + 1); // Menu + History + Delete + (Insert+Update per meal)
    });

    it('should filter by Dietary Preference (Vegan Only)', async () => {
      // Setup: Mock query to simulate SQL filter behavior (or just return all and let service filter)
      // Since your service adds SQL strings, we mock the return of the *modified* query.
      const veganItems = mockMenu.filter(i => i.is_vegan);
      db.query.mockResolvedValueOnce({ rows: veganItems }); 
      db.query.mockResolvedValueOnce({ rows: [] }); // History

      const result = await plannerService.generateMealPlan('student-123', 100, { veganOnly: true });

      const nonVeganInPlan = result.suggestions.find(m => !m.is_vegan);
      expect(nonVeganInPlan).toBeUndefined();
      // Verify SQL construction included the filter
      expect(db.query.mock.calls[0][0]).toContain('AND is_vegan = TRUE');
    });

    it('should filter out Custom Allergies (Application Level)', async () => {
      db.query.mockResolvedValueOnce({ rows: mockMenu });
      db.query.mockResolvedValueOnce({ rows: [] });

      // User is allergic to "Beef"
      const result = await plannerService.generateMealPlan('student-123', 100, { customAllergies: ['Beef'] });

      const hasBeef = result.suggestions.some(m => m.name.includes('Burger'));
      expect(hasBeef).toBe(false);
    });

    it('should enforce Variety Rules (No repeats from yesterday)', async () => {
      // Mock Menu
      db.query.mockResolvedValueOnce({ rows: mockMenu });
      
      // Mock History: User ate "Beef Burger" (ID 1) yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      db.query.mockResolvedValueOnce({ rows: [
        { meal_id: 1, log_date: yesterday.toISOString() } 
      ]});

      const result = await plannerService.generateMealPlan('student-123', 200, {});

      const burgerInPlan = result.suggestions.find(m => m.id === 1);
      expect(burgerInPlan).toBeUndefined(); // Should be excluded by variety logic
    });

    it('should handle Insufficient Budget gracefully', async () => {
      db.query.mockResolvedValueOnce({ rows: mockMenu });
      db.query.mockResolvedValueOnce({ rows: [] });

      // Budget is 5 MAD, but cheapest item is 10 MAD
      const result = await plannerService.generateMealPlan('student-123', 5, {});

      expect(result.suggestions.length).toBe(0);
      expect(result.financialStatus.planCost).toBe("0.00");
    });
  });

  describe('getTodayPlan', () => {
    it('should retrieve the persisted plan and calculate cost', async () => {
      const mockTodayPlan = [mockMenu[0], mockMenu[1]]; // Burger + Salad
      db.query.mockResolvedValueOnce({ rows: mockTodayPlan });

      const result = await plannerService.getTodayPlan('student-123');

      expect(result.suggestions).toHaveLength(2);
      expect(result.financialStatus.planCost).toBe("80.00"); // 50 + 30
    });
  });

  // ==========================================
  // 2. RESTAURANT SCENARIOS
  // ==========================================

  describe('updateMealItem', () => {
    it('should update meal details while preserving statistics', async () => {
      const updateData = {
        name: 'New Burger',
        price: 60,
        category: 'Dinner',
        ingredients: 'Wagyu',
        calories: 800,
        is_vegan: false, contains_gluten: true, contains_peanuts: false, contains_dairy: true
      };

      // Mock the UPDATE return
      db.query.mockResolvedValueOnce({ rows: [{ ...updateData, id: 1, popularity_score: 50 }] });

      const result = await plannerService.updateMealItem(1, updateData, 'Proxy');

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE catalog_schema.menu_items'),
        expect.arrayContaining(['New Burger', 60, 1, 'Proxy'])
      );
      expect(result.name).toBe('New Burger');
    });
  });

});