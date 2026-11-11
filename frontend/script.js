
// For local testing, run Flask at http://127.0.0.1:5000
// Change this URL after deploying your backend.
const API_URL = "http://127.0.0.1:5000";

function showPage(id) {
  document.querySelectorAll(".page").forEach(
    p => p.classList.add("hidden")
  );
  document.getElementById(id).classList.remove("hidden");

  if (id === "dashboard") refreshDashboard();
  if (id === "history") loadHistory();
  if (id === "model") loadModelInfo();
}

async function refreshDashboard() {
  try {
    const r = await fetch(API_URL + "/dashboard");
    if (!r.ok) throw new Error("API error");
    const d = await r.json();
    document.getElementById("total").textContent = d.total;
    document.getElementById("yes").textContent = d.yes;
    document.getElementById("no").textContent = d.no;
  } catch(e) {
    console.error(e);
  }
}

document.getElementById("predictionForm").addEventListener(
  "submit", async function(e) {
    e.preventDefault();

    const btn = document.getElementById("predictBtn");
    const resultBox = document.getElementById("result");
    btn.disabled = true;
    btn.textContent = "Predicting...";

    const form = new FormData(this);
    const data = Object.fromEntries(form.entries());
    data.age = Number(data.age);
    data.balance = Number(data.balance);

    try {
      const response = await fetch(API_URL + "/predict", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Prediction failed");

      resultBox.className =
        "result " + result.prediction.toLowerCase();

      resultBox.innerHTML = `
        <h2>Prediction: ${result.prediction}</h2>
        <h3>YES Probability: ${result.yes_probability}%</h3>
        <p>Prediction generated successfully.</p>
      `;

      refreshDashboard();
    } catch(err) {
      resultBox.className = "result";
      resultBox.textContent = err.message +
        ". Check that the backend is running.";
    } finally {
      resultBox.classList.remove("hidden");
      btn.disabled = false;
      btn.textContent = "Predict Subscription";
    }
  }
);

let historyRecords = [];

async function loadHistory() {
  try {
    const r = await fetch(API_URL + "/history");
    if (!r.ok) throw new Error("History unavailable");

    historyRecords = await r.json();

    document.getElementById("historyBody").innerHTML =
      historyRecords.map(x => `
        <tr>
          <td>${x.age}</td>
          <td>${x.job}</td>
          <td>${x.prediction}</td>
          <td>${x.yes_probability}%</td>
          <td>${x.timestamp}</td>
        </tr>
      `).join("");
  } catch(e) {
    document.getElementById("historyBody").innerHTML =
      "<tr><td colspan='5'>Backend connection unavailable</td></tr>";
  }
}

function downloadHistory() {
  if (!historyRecords.length) {
    alert("No prediction records available");
    return;
  }

  const keys = Object.keys(historyRecords[0]);
  const csv = [
    keys.join(","),
    ...historyRecords.map(row =>
      keys.map(k =>
        '"' + String(row[k] ?? "").replace(/"/g, '""') + '"'
      ).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], {type: "text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bank_prediction_history.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function loadModelInfo() {
  try {
    const r = await fetch(API_URL + "/model-info");
    const d = await r.json();

    document.getElementById("algorithm").textContent = d.algorithm;
    document.getElementById("accuracy").textContent =
      (d.accuracy * 100).toFixed(2) + "%";
    document.getElementById("f1").textContent =
      (d.f1_score * 100).toFixed(2) + "%";
    document.getElementById("features").textContent =
      d.input_features.join(", ");
  } catch(e) {
    document.getElementById("algorithm").textContent =
      "Backend unavailable";
  }
}

refreshDashboard();
