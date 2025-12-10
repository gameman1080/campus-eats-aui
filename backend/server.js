const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const plannerService = require('./plannerService');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'campus_eats_secret_key_123';

app.use(cors());
app.use(bodyParser.json());

// === AUTH ===
app.post('/auth/register', async (req, res) => {
  const { password, role, displayName, firstName, lastName, email: providedEmail } = req.body;
  
  // Basic validation
  if (role === 'restaurant' && !providedEmail.endsWith('@aui.ma')) {
      return res.status(400).json({ error: 'Only @aui.ma emails are allowed.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    let finalEmail = providedEmail;
    let result;

    if (role === 'student' && firstName && lastName) {
        // === SMART EMAIL GENERATION LOGIC ===
        // Try prefixes from length 1 up to full first name length
        let registered = false;
        
        // Clean inputs
        const fName = firstName.trim().toLowerCase();
        const lName = lastName.trim().toLowerCase();

        for (let i = 1; i <= fName.length; i++) {
            const prefix = fName.substring(0, i);
            const candidateEmail = `${prefix}.${lName}@aui.ma`;

            try {
                result = await db.query(
                    `INSERT INTO student_schema.users (email, password_hash, role, display_name) 
                     VALUES ($1, $2, $3, $4) RETURNING id, email, role, display_name`,
                    [candidateEmail, hash, role, displayName]
                );
                finalEmail = candidateEmail;
                registered = true;
                break; // Success! Exit loop.
            } catch (err) {
                // If error is NOT a unique violation (code 23505), throw it
                if (err.code !== '23505') throw err;
                // If it IS a collision, loop continues to next prefix (y -> ya -> yas...)
            }
        }

        if (!registered) {
            // Fallback: If even the full name is taken (yassin.messaoudi), append a random number
            const randomNum = Math.floor(Math.random() * 1000);
            finalEmail = `${fName}.${lName}${randomNum}@aui.ma`;
            result = await db.query(
                `INSERT INTO student_schema.users (email, password_hash, role, display_name) 
                 VALUES ($1, $2, $3, $4) RETURNING id, email, role, display_name`,
                [finalEmail, hash, role, displayName]
            );
        }

    } else {
        // === STANDARD REGISTRATION (Restaurants) ===
        try {
            result = await db.query(
                `INSERT INTO student_schema.users (email, password_hash, role, display_name) 
                 VALUES ($1, $2, $3, $4) RETURNING id, email, role, display_name`,
                [providedEmail, hash, role, displayName]
            );
        } catch (err) {
            if (err.code === '23505') return res.status(400).json({ error: 'Email already registered' });
            throw err;
        }
    }
    
    res.json({ success: true, user: result.rows[0] });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM student_schema.users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found. Please register first.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password. Please try again.' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.display_name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { email: user.email, role: user.role, name: user.display_name } });
  } catch (error) { res.status(500).json({ error: 'Login failed' }); }
});

// === STUDENT ===
app.post('/api/student/plan', async (req, res) => {
  try {
    const { studentId, daysRemaining, preferences } = req.body;
    const plan = await plannerService.generateMealPlan(studentId || 'guest', daysRemaining, preferences);
    res.json(plan);
  } catch (error) { res.status(500).json({ error: 'Failed to generate plan' }); }
});

app.get('/api/student/plan/today', async (req, res) => {
    try {
        const plan = await plannerService.getTodayPlan('student-123');
        res.json(plan);
    } catch (error) { res.status(500).json({ error: 'Failed to restore plan' }); }
});

app.get('/api/student/history', async (req, res) => {
  try {
    const history = await plannerService.getStudentHistory('student-123');
    res.json(history);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch history' }); }
});

// === RESTAURANT ===
app.get('/api/restaurant/stats', async (req, res) => {
  try {
    const { restaurant } = req.query; 
    const menu = await plannerService.getRestaurantMenu(restaurant);
    res.json(menu);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch menu' }); }
});

app.post('/api/restaurant/add', async (req, res) => {
  try {
    const result = await plannerService.addMealItem(req.body, req.body.restaurant_name);
    res.json(result);
  } catch (error) { res.status(500).json({ error: 'Failed to add item' }); }
});

app.put('/api/restaurant/item/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await plannerService.updateMealItem(id, req.body, req.body.restaurant_name);
        res.json(result);
    } catch (error) { res.status(500).json({ error: 'Failed to update item' }); }
});

app.delete('/api/restaurant/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurant_name } = req.body; 
    const success = await plannerService.deleteMealItem(id, restaurant_name);
    if (success) res.json({ message: 'Deleted' });
    else res.status(404).json({ error: 'Item not found' });
  } catch (error) { res.status(500).json({ error: 'Failed to delete' }); }
});

app.listen(PORT, () => { console.log(`GoBudget Backend running on port ${PORT}`); });