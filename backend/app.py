
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
import json
import os
from datetime import datetime, timezone

app = Flask(__name__)
CORS(app)

BASE = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE, "model")
DATA_DIR = os.path.join(BASE, "data")

os.makedirs(DATA_DIR, exist_ok=True)

model = joblib.load(
    os.path.join(MODEL_DIR, "bank_subscription_model.joblib")
)

with open(os.path.join(MODEL_DIR, "model_info.json")) as f:
    info = json.load(f)

FEATURES = info["input_features"]
HISTORY = os.path.join(DATA_DIR, "predictions.csv")

OPTIONS = {
    "job": ["admin.", "blue-collar", "entrepreneur", "housemaid",
            "management", "retired", "self-employed", "services",
            "student", "technician", "unemployed", "unknown"],
    "marital": ["married", "single", "divorced"],
    "education": ["primary", "secondary", "tertiary", "unknown"],
    "housing": ["yes", "no"],
    "loan": ["yes", "no"],
    "contact": ["cellular", "telephone", "unknown"]
}

@app.route("/")
def home():
    return jsonify({"message": "Bank Prediction API is running"})

@app.route("/model-info")
def model_info():
    return jsonify(info)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(silent=True) or {}

        missing = [f for f in FEATURES if f not in data]
        if missing:
            return jsonify({"error": "Missing fields: " + ", ".join(missing)}), 400

        row = {f: data[f] for f in FEATURES}

        row["age"] = int(row["age"])
        row["balance"] = float(row["balance"])

        if not 18 <= row["age"] <= 120:
            return jsonify({"error": "Age must be between 18 and 120"}), 400

        if not -10000000 <= row["balance"] <= 100000000:
            return jsonify({"error": "Invalid balance"}), 400

        for field, allowed in OPTIONS.items():
            if row[field] not in allowed:
                return jsonify({"error": "Invalid " + field}), 400

        customer = pd.DataFrame([row], columns=FEATURES)

        result = str(model.predict(customer)[0])
        classes = list(model.classes_)
        yes_index = classes.index("yes")

        probability = float(
            model.predict_proba(customer)[0][yes_index] * 100
        )

        timestamp = datetime.now(timezone.utc).isoformat()

        output = {
            "prediction": result.upper(),
            "yes_probability": round(probability, 2),
            "timestamp": timestamp
        }

        record = {**row, **output}

        pd.DataFrame([record]).to_csv(
            HISTORY,
            mode="a",
            header=not os.path.exists(HISTORY),
            index=False
        )

        return jsonify(output)

    except (ValueError, TypeError):
        return jsonify({"error": "Please enter valid customer details"}), 400
    except Exception:
        app.logger.exception("Prediction error")
        return jsonify({"error": "Prediction failed"}), 500

@app.route("/history")
def history():
    if not os.path.exists(HISTORY):
        return jsonify([])

    df = pd.read_csv(HISTORY)
    return jsonify(df.fillna("").to_dict(orient="records"))

@app.route("/dashboard")
def dashboard():
    if not os.path.exists(HISTORY):
        return jsonify({"total": 0, "yes": 0, "no": 0})

    df = pd.read_csv(HISTORY)
    return jsonify({
        "total": len(df),
        "yes": int((df["prediction"] == "YES").sum()),
        "no": int((df["prediction"] == "NO").sum())
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
