const db = require('./db');

class PlannerService {
  // === STUDENT FEATURES ===

  async generateMealPlan(studentId, daysRemaining, preferences) {
    const dailyBudget = parseFloat(daysRemaining);

    // 1. Fetch Candidates (Available items)
    let query = `SELECT * FROM catalog_schema.menu_items WHERE is_available = TRUE`;
    if (preferences.veganOnly) query += ' AND is_vegan = TRUE';
    if (preferences.gluten) query += ' AND contains_gluten = FALSE';
    if (preferences.peanuts) query += ' AND contains_peanuts = FALSE';
    if (preferences.dairy) query += ' AND contains_dairy = FALSE';

    const result = await db.query(query);
    let candidates = result.rows;

    // 2. Custom Filters
    if (preferences.customAllergies && preferences.customAllergies.length > 0) {
      candidates = candidates.filter(item => {
        const content = (item.name + ' ' + (item.ingredients || '')).toLowerCase();
        return !preferences.customAllergies.some(allergy => content.includes(allergy.toLowerCase()));
      });
    }

    // 3. VARIETY LOGIC
    const historyQuery = `
        SELECT meal_id, log_date 
        FROM student_schema.meal_logs 
        WHERE student_id = $1 
        AND log_date >= CURRENT_DATE - INTERVAL '7 days'
    `;
    const historyResult = await db.query(historyQuery, [studentId]);
    const logs = historyResult.rows;

    const formatDate = (date) => date.toISOString().split('T')[0];
    const todayStr = formatDate(new Date());
    const yest = new Date(); yest.setDate(yest.getDate() - 1);
    const yesterdayStr = formatDate(yest);

    const eatenRecently = new Set();
    const weeklyCounts = {};

    logs.forEach(l => {
        const d = new Date(l.log_date);
        const dStr = formatDate(d);
        if (dStr === yesterdayStr || dStr === todayStr) eatenRecently.add(l.meal_id);
        weeklyCounts[l.meal_id] = (weeklyCounts[l.meal_id] || 0) + 1;
    });

    const varietyCandidates = candidates.filter(c => {
        if (eatenRecently.has(c.id)) return false; 
        if ((weeklyCounts[c.id] || 0) >= 3) return false; 
        return true;
    });

    const poolToUse = varietyCandidates.length >= 3 ? varietyCandidates : candidates;

    // 4. Selection (Greedy)
    const plan = [];
    let currentTotal = 0;

    const selectItem = (category) => {
        const items = poolToUse.filter(i => i.category === category);
        if (!items.length) return null;
        items.sort(() => Math.random() - 0.5);
        for (let item of items) {
            if ((currentTotal + parseFloat(item.price)) <= dailyBudget) return item;
        }
        return null;
    };

    const b = selectItem('Breakfast');
    if (b) { plan.push(b); currentTotal += parseFloat(b.price); }

    const l = selectItem('Lunch');
    if (l) { plan.push(l); currentTotal += parseFloat(l.price); }

    const d = selectItem('Dinner');
    if (d) { plan.push(d); currentTotal += parseFloat(d.price); }

    if (preferences.extraTreat && (dailyBudget - currentTotal) > 15) {
        const s = selectItem('Snack');
        if (s) { plan.push(s); currentTotal += parseFloat(s.price); }
    }

    // 5. Persistence
    await db.query(`DELETE FROM student_schema.meal_logs WHERE student_id = $1 AND DATE(log_date) = CURRENT_DATE`, [studentId]);

    for (const meal of plan) {
        await db.query(`INSERT INTO student_schema.meal_logs (student_id, meal_id, log_date) VALUES ($1, $2, CURRENT_TIMESTAMP)`, [studentId, meal.id]);
        await db.query(`UPDATE catalog_schema.menu_items SET popularity_score = popularity_score + 1 WHERE id = $1`, [meal.id]);
    }

    return {
      financialStatus: { dailySafeBudget: dailyBudget.toFixed(2), planCost: currentTotal.toFixed(2) },
      suggestions: plan,
    };
  }

  async getTodayPlan(studentId) {
    const query = `
        SELECT m.* FROM student_schema.meal_logs l
        JOIN catalog_schema.menu_items m ON l.meal_id = m.id
        WHERE l.student_id = $1 AND DATE(l.log_date) = CURRENT_DATE
        ORDER BY l.log_date ASC
    `;
    const result = await db.query(query, [studentId]);
    const totalCost = result.rows.reduce((sum, item) => sum + parseFloat(item.price), 0);
    return { suggestions: result.rows, financialStatus: { dailySafeBudget: "N/A", planCost: totalCost.toFixed(2) } };
  }

  async getStudentHistory(studentId) {
    const query = `
        SELECT l.log_date, m.id, m.name, m.category, m.price, m.calories, m.ingredients, m.restaurant_name
        FROM student_schema.meal_logs l
        JOIN catalog_schema.menu_items m ON l.meal_id = m.id
        WHERE l.student_id = $1 ORDER BY l.log_date DESC
    `;
    try { const result = await db.query(query, [studentId]); return result.rows; } catch (e) { return []; }
  }

  // === RESTAURANT FEATURES ===
  async getRestaurantMenu(restaurantName) {
    const query = `SELECT * FROM catalog_schema.menu_items WHERE restaurant_name = $1 ORDER BY popularity_score DESC`;
    const result = await db.query(query, [restaurantName]);
    return result.rows;
  }

  async addMealItem(mealData, restaurantName) {
    const { name, price, category, ingredients, calories, is_vegan, contains_gluten, contains_peanuts, contains_dairy } = mealData;
    const query = `INSERT INTO catalog_schema.menu_items (name, price, category, ingredients, calories, is_vegan, contains_gluten, contains_peanuts, contains_dairy, is_available, popularity_score, restaurant_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, 0, $10) RETURNING *`;
    const values = [name, price, category, ingredients, calories, is_vegan, contains_gluten, contains_peanuts, contains_dairy, restaurantName];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // NEW: Update Logic (Persists Popularity Score)
  async updateMealItem(id, mealData, restaurantName) {
    const { name, price, category, ingredients, calories, is_vegan, contains_gluten, contains_peanuts, contains_dairy } = mealData;
    const query = `
        UPDATE catalog_schema.menu_items 
        SET name=$1, price=$2, category=$3, ingredients=$4, calories=$5, is_vegan=$6, contains_gluten=$7, contains_peanuts=$8, contains_dairy=$9
        WHERE id=$10 AND restaurant_name=$11
        RETURNING *
    `;
    const values = [name, price, category, ingredients, calories, is_vegan, contains_gluten, contains_peanuts, contains_dairy, id, restaurantName];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  async deleteMealItem(itemId, restaurantName) {
    const query = `DELETE FROM catalog_schema.menu_items WHERE id = $1 AND restaurant_name = $2 RETURNING id`;
    const result = await db.query(query, [itemId, restaurantName]);
    return result.rowCount > 0;
  }
}

module.exports = new PlannerService();