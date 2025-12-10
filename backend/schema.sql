-- ==========================================
-- Campus Eats AUI - Comprehensive Data Seed
-- ==========================================

DROP SCHEMA IF EXISTS catalog_schema CASCADE;
DROP SCHEMA IF EXISTS student_schema CASCADE;

CREATE SCHEMA catalog_schema;
CREATE SCHEMA student_schema;

-- 1. USERS TABLE (New Authentication System)
CREATE TABLE student_schema.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'restaurant')),
    -- For students: stores "First Last"
    -- For restaurants: stores "Restaurant Name"
    display_name VARCHAR(100) NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENT WALLETS (Linked to users logically via email/id if needed later)
CREATE TABLE student_schema.demo_wallets (
    student_id VARCHAR(50) PRIMARY KEY,
    balance DECIMAL(10, 2) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO student_schema.demo_wallets (student_id, balance) 
VALUES ('student-123', 1500.00);

-- 3. MEAL LOGS
CREATE TABLE student_schema.meal_logs (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL,
    meal_id INT NOT NULL,
    log_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. MENU ITEMS
CREATE TABLE catalog_schema.menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50), 
    ingredients TEXT,
    calories INT,
    is_vegan BOOLEAN DEFAULT FALSE,
    contains_gluten BOOLEAN DEFAULT FALSE,
    contains_peanuts BOOLEAN DEFAULT FALSE,
    contains_dairy BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    popularity_score INT DEFAULT 0,
    restaurant_name VARCHAR(100) NOT NULL
);

-- Seed Data (Same as before...)
INSERT INTO catalog_schema.menu_items (name, price, category, calories, ingredients, is_vegan, contains_gluten, contains_dairy, contains_peanuts, popularity_score, restaurant_name) VALUES 
('Spicy Chicken Sandwich', 35.00, 'Lunch', 550, 'Chicken, Bun, Spicy Mayo, Lettuce', FALSE, TRUE, TRUE, FALSE, 0, 'Proxy'),
('Cheese Panini', 25.00, 'Snack', 320, 'Mozzarella, Tomato, Pesto, Bread', FALSE, TRUE, TRUE, FALSE, 0, 'Proxy'),
('Caesar Salad', 30.00, 'Lunch', 280, 'Romaine, Croutons, Parmesan, Caesar Dressing', FALSE, TRUE, TRUE, FALSE, 0, 'Proxy'),
('Blueberry Muffin', 15.00, 'Breakfast', 350, 'Flour, Blueberries, Sugar, Butter', FALSE, TRUE, TRUE, FALSE, 0, 'Cossa'),
('Iced Latte', 20.00, 'Drink', 120, 'Espresso, Milk, Ice', FALSE, FALSE, TRUE, FALSE, 0, 'Cossa'),
('Classic Cheeseburger', 45.00, 'Dinner', 700, 'Beef Patty, Cheddar, Bun, Pickles', FALSE, TRUE, TRUE, FALSE, 0, 'American'),
('Margherita Pizza', 50.00, 'Dinner', 800, 'Dough, Tomato Sauce, Mozzarella, Basil', FALSE, TRUE, TRUE, FALSE, 0, 'Pizzeria'),
('Grilled Chicken & Rice', 55.00, 'Lunch', 450, 'Chicken Breast, White Rice, Steamed Vegetables', FALSE, FALSE, FALSE, FALSE, 0, 'Cafette');