🎓 Campus Eats AUI

Smart Dining & Budgeting for University Students.

Campus Eats is a full-stack mobile application designed to help students manage their dining budget on campus. It suggests meal plans based on a daily budget limit, tracks dietary preferences (Vegan, Gluten-Free), and enforces variety in diet while helping campus restaurants manage their menus.

✨ Features

💰 Smart Budgeting: Set a daily limit (e.g., 60 MAD) and get a calculated 3-meal plan.

🥗 Dietary Filters: Filter by Vegan, Gluten, Peanuts, Dairy, or custom allergies.

📊 Analytics: Dashboard for students to track spending history.

🏪 Restaurant Portal: Dedicated interface for restaurants to add/edit menu items.

🧠 Persistence: "Remember Me" session handling and auto-login.

🔊 Accessibility: Text-to-Speech and Large Text modes support.

🛠️ Tech Stack

Frontend: React Native (Expo), TypeScript

Backend: Node.js, Express.js

Database: PostgreSQL (Neon Tech / Local)

Testing: Jest

🚀 Getting Started

Prerequisites

Node.js & npm

PostgreSQL installed locally or a Neon.tech connection string.

Expo Go app on your phone.

1. Backend Setup

cd backend
npm install
# Set up your database using schema.sql
# Run the server
node server.js



2. Frontend Setup

cd frontend
npm install
# Start the app
npx expo start



🧪 Running Tests

The backend includes a suite of unit tests for the meal planning algorithm.

cd backend
npm test

