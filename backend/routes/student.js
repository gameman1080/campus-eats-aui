const express = require('express');
const router = express.Router();
const pool = require('../db');

// RECOMMENDATION ENGINE
router.post('/plan', async (req, res) => {
  try {
    const { budget, allergies, customAllergies, logging, includeTreats } = req.body; 
    const dailyBudget = parseFloat(budget) || 50;
    const studentId = 'test_user'; 

    let filter = `WHERE is_available = TRUE`;
    if (allergies.gluten) filter += ` AND contains_gluten = FALSE`;
    if (allergies.peanuts) filter += ` AND contains_peanuts = FALSE`;
    if (allergies.dairy) filter += ` AND contains_dairy = FALSE`;
    if (allergies.veganOnly) filter += ` AND is_vegan = TRUE`;

    const result = await pool.query(`SELECT * FROM catalog_schema.menu_items ${filter}`);
    let allMeals = result.rows;

    if (customAllergies && customAllergies.length > 0) {
        allMeals = allMeals.filter(meal => {
            const content = (meal.name + ' ' + (meal.ingredients || '')).toLowerCase();
            return !customAllergies.some(allergy => content.includes(allergy.toLowerCase()));
        });
    }

    const historyRes = await pool.query(
        `SELECT meal_id FROM student_schema.meal_logs 
         WHERE student_id = $1 AND log_date > CURRENT_DATE - 3`, 
        [studentId]
    );
    const recentMealIds = historyRes.rows.map(r => r.meal_id);
    const varietyMeals = allMeals.filter(m => !recentMealIds.includes(m.id));
    const poolToUse = varietyMeals.length >= 3 ? varietyMeals : allMeals;

    const getCat = (cat) => poolToUse.filter(m => m.category === cat).sort((a,b) => parseFloat(a.price) - parseFloat(b.price));
    const breakfasts = getCat('Breakfast');
    const lunches = getCat('Lunch');
    const dinners = getCat('Dinner');
    const treats = allMeals.filter(m => m.category === 'Snack' || m.category === 'Drink' || parseFloat(m.price) < 20);

    const pickRandom = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;
    const pickExpensive = (arr) => arr.length > 0 ? arr[arr.length - 1] : null; 
    const pickCheap = (arr) => arr.length > 0 ? arr[0] : null;
    const getSum = (arr) => arr.reduce((sum, item) => sum + (item ? parseFloat(item.price) : 0), 0);

    let plan = [];

    if (dailyBudget >= 80) {
        plan = [pickExpensive(breakfasts), pickExpensive(lunches), pickExpensive(dinners)].filter(Boolean);
        if (getSum(plan) > dailyBudget) {
            plan = [pickRandom(breakfasts), pickRandom(lunches), pickRandom(dinners)].filter(Boolean);
        }
        if (dailyBudget >= 120 && includeTreats) {
            const remaining = dailyBudget - getSum(plan);
            const extra = treats.find(t => parseFloat(t.price) <= remaining && !plan.some(p => p.id === t.id));
            if (extra) plan.push({ ...extra, category: 'Extra Treat' });
        }
    } else {
        plan = [pickRandom(breakfasts), pickRandom(lunches), pickRandom(dinners)].filter(Boolean);
    }

    if (getSum(plan) > dailyBudget) plan = [pickCheap(breakfasts), pickCheap(lunches), pickCheap(dinners)].filter(Boolean);
    if (getSum(plan) > dailyBudget) plan = [pickCheap(lunches), pickCheap(dinners)].filter(Boolean);
    if (getSum(plan) > dailyBudget) plan = [pickCheap(lunches)].filter(Boolean);

    if (logging) {
        await pool.query('DELETE FROM student_schema.meal_logs WHERE student_id = $1 AND log_date = CURRENT_DATE', [studentId]);
        for (const meal of plan) {
            if(meal && meal.id) {
                await pool.query('INSERT INTO student_schema.meal_logs (student_id, meal_id) VALUES ($1, $2)', [studentId, meal.id]);
                await pool.query('UPDATE catalog_schema.menu_items SET popularity_score = popularity_score + 1 WHERE id = $1', [meal.id]);
            }
        }
    }

    res.json({ financialStatus: { dailySafeBudget: dailyBudget }, suggestions: plan });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server Error' }); }
});

router.get('/history', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT log_date, name, category, price, calories 
            FROM student_schema.meal_logs 
            JOIN catalog_schema.menu_items ON student_schema.meal_logs.meal_id = catalog_schema.menu_items.id
            WHERE student_id = 'test_user' ORDER BY log_date DESC
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: 'Server Error' }); }
});

module.exports = router;