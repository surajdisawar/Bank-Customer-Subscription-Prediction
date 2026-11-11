# Bank Customer Subscription Prediction
Roll Number: 33

## Selected ML Algorithm
Logistic Regression

## Setup
1. Install Python.
2. Open terminal in backend.
3. Run: pip install -r requirements.txt
4. Run: python app.py
5. Open frontend/index.html in a browser.

## Backend API
POST /predict
GET /dashboard
GET /history
GET /model-info

## Important
The frontend API URL is configured for local testing.
Change API_URL in frontend/script.js after backend deployment.

Prediction history is stored in backend/data/predictions.csv.
Local file storage may not persist on temporary cloud hosting.