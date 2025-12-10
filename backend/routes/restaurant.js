const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET STATS (Filtered by Restaurant)
router.get('/stats', async (req, res) => {
  const { restaurant } = req.query; // e.g. ?restaurant=American
  try {
    let query = 'SELECT * FROM catalog_schema.menu_items';
    let params = [];
    
    if (restaurant) {
        query += ' WHERE restaurant_name = $1';
        params.push(restaurant);
    }
    
    query += ' ORDER BY popularity_score DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Server Error' }); }
});

// ADD MEAL
router.post('/add', async (req, res) => {
  try {
    const { name, price, category, ingredients, calories, is_vegan, contains_gluten, contains_peanuts, contains_dairy, restaurant_name } = req.body;
    await pool.query(
      `INSERT INTO catalog_schema.menu_items 
(name, price, category, ingredients, calories, is_vegan, contains_gluten, contains_peanuts, contains_dairy, restaurant_name, popularity_score, is_available)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, TRUE)`,
      [name, price, category, ingredients || '', calories || 0, is_vegan, contains_gluten, contains_peanuts, contains_dairy, restaurant_name || 'Campus Kitchen']
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to add meal' }); }
});

// DELETE MEAL (New Feature)
router.delete('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM catalog_schema.menu_items WHERE id = $1', [id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete meal' }); }
});

module.exports = router;