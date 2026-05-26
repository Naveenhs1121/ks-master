# =======================
# backend/app.py
# Main Flask backend for the Kisan AI project.
# This file is divided into clear functional chunks:
#   • ENV LOADING            - load environment variables from .env
#   • GEMINI CONFIG          - set up Google Gemini AI client
#   • FLASK APP              - initialize Flask app and CORS
#   • DATABASE CONNECTION    - helper to connect to MySQL
#   • AI LOGIC               - construct prompts and parse AI answers
#   • ROUTES                 - HTTP endpoints for signup, login, ask, session, history, etc.
#   • RUN SERVER             - start the development server
# Comments throughout mark each section so developers can quickly jump to the right area.
# =======================
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import json
import os

# ------------------ ENV LOADING ------------------
from dotenv import load_dotenv, dotenv_values

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ENV_PATH = os.path.join(BASE_DIR, '.env')
load_dotenv(ENV_PATH)
print("ENV PATH:", ENV_PATH)
print("KEY:", os.environ.get("GEMINI_API_KEY"))
ENV = dotenv_values(ENV_PATH)

# ------------------ GEMINI CONFIG (NEW SDK) ------------------
from google import genai

GEMINI_API_KEY = ENV.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in .env")

client = genai.Client(api_key=GEMINI_API_KEY)

print("[backend] Gemini API configured: YES (google.genai)")

# ------------------ FLASK APP ------------------
app = Flask(__name__)
CORS(app)

# ---------- TEST DB CONNECTION ----------
@app.route("/test-db")
def test_db():
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("SELECT 1")
        return jsonify({"success": True, "message": "✅ Database connected successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": f"❌ DB Connection failed: {str(e)}"}), 500

# ------------------ DATABASE CONNECTION ------------------
def get_db():
    return mysql.connector.connect(
        unix_socket="/tmp/mysql.sock",
        user="root",
        password="root",  # add password if needed
        database="ks"
    )

# ------------------ AI LOGIC (UPDATED GEMINI) ------------------
def ai_answer(question, language="English"):
    # Map language names to language codes
    lang_map = {
        'English': 'English',
        'Kannada': 'Kannada',
        'en': 'English',
        'kn': 'Kannada'
    }
    
    target_language = lang_map.get(language, 'English')
    
    prompt = f"""
You are an agriculture assistant for Indian farmers.

IMPORTANT: Respond ONLY in {target_language}.

Rules:
- Use simple language appropriate for Indian farmers
- Do NOT give pesticide dosage, chemical quantities, or medical advice
- If unsure, suggest consulting a local agriculture officer
- ALL response text must be in {target_language}

Return ONLY valid JSON with these fields:
- fertilizers: array of objects, each with "name" (fertilizer type) and "quantity_per_acre" (amount needed per acre in kg or liters)
- overall_analysis: string (general recommendation summary in {target_language})
- soil_analysis_and_tips: array of strings with soil-specific tips (each tip in {target_language})

Example format:
{{
  "fertilizers": [
    {{"name": "DAP", "quantity_per_acre": "50 kg"}},
    {{"name": "Urea", "quantity_per_acre": "100 kg"}}
  ],
  "overall_analysis": "Based on soil pH and nutrient levels...",
  "soil_analysis_and_tips": ["Tip 1", "Tip 2", "Tip 3"]
}}

Question:
{question}
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )

        raw = response.text.strip()

        if raw.startswith("```"):
            raw = raw.replace("```json", "").replace("```", "").strip()

        try:
            return json.loads(raw)
        except Exception:
            return {"overall_analysis": raw}

    except Exception as e:
        print("Gemini API error:", e)
        return {"overall_analysis": "AI service temporarily unavailable."}

# ------------------ ROUTES ------------------

@app.route("/")
def home():
    return "Kisan AI Backend Running (Gemini – Updated)"

@app.route("/ping", methods=["GET", "POST"])
def ping():
    print("🔥 PING HIT")
    return {"status": "ok"}

# ---------- SIGNUP ----------
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute(
            "INSERT INTO farmers (name, phone, password, village) VALUES (%s,%s,%s,%s)",
            (data["name"], data["phone"], data["password"], data.get("village"))
        )
        db.commit()
        return jsonify({"success": True})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "message": "Phone already registered"}), 400

# ---------- LOGIN ----------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT id, name FROM farmers WHERE phone=%s AND password=%s",
        (data["phone"], data["password"])
    )

    farmer = cursor.fetchone()

    if farmer:
        return jsonify({
            "success": True,
            "farmer_id": farmer["id"],
            "name": farmer["name"]
        })
    else:
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# ---------- ASK QUESTION ----------
@app.route("/ask", methods=["POST"])
def ask():
    data = request.json

    farmer_id = data.get("farmer_id")
    question = data.get("question", "").strip()
    language = data.get("language", "en")

    if not farmer_id or not question:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    answer_obj = ai_answer(question, language)

    db = get_db()
    cursor = db.cursor()

    cursor.execute(
        "INSERT INTO queries (farmer_id, question, answer, language) VALUES (%s,%s,%s,%s)",
        (farmer_id, question, json.dumps(answer_obj), language)
    )
    db.commit()

    return jsonify({"success": True, "answer": answer_obj})

import base64
from google.genai import types

# ---------- DETECT DISEASE (IMAGE + TEXT) ----------
@app.route("/detect-disease", methods=["POST"])
def detect_disease():
    data = request.json
    farmer_id = data.get("farmer_id")
    question = data.get("question", "Analyze this crop image").strip()
    language = data.get("language", "en")
    image_base64 = data.get("image")

    if not farmer_id or not image_base64:
        return jsonify({"success": False, "message": "Missing fields"}), 400

    lang_map = {
        'English': 'English',
        'Kannada': 'Kannada',
        'en': 'English',
        'kn': 'Kannada'
    }
    target_language = lang_map.get(language, 'English')

    prompt = f"""
    You are an agriculture expert for Indian farmers.
    Analyze the provided image of a crop/plant.
    User's question: {question}

    IMPORTANT: Respond ONLY in {target_language}.
    Use simple language appropriate for Indian farmers.
    Do NOT give precise pesticide dosage or medical advice.

    Return ONLY valid JSON with these fields:
    - overall_analysis: string (Identification of the disease/issue and general recommendation in {target_language})
    - soil_analysis_and_tips: array of strings (Actionable tips for treatment, prevention, or care in {target_language})
    - fertilizers: array of objects (Suggested generic treatments/fertilizers with "name" and "quantity_per_acre")

    Example format:
    {{
      "overall_analysis": "The plant appears to have...",
      "soil_analysis_and_tips": ["Remove infected leaves", "Spray neem oil"],
      "fertilizers": []
    }}
    """

    try:
        image_bytes = base64.b64decode(image_base64)
        
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type="image/jpeg"
                )
            ]
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.replace("```json", "").replace("```", "").strip()

        try:
            answer_obj = json.loads(raw)
        except Exception:
            answer_obj = {"overall_analysis": raw}
            
        # Log to DB
        db = get_db()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO queries (farmer_id, question, answer, language) VALUES (%s,%s,%s,%s)",
            (farmer_id, "[IMAGE] " + question, json.dumps(answer_obj), language)
        )
        db.commit()

        return jsonify({"success": True, "answer": answer_obj})

    except Exception as e:
        print("Gemini Vision API error:", e)
        return jsonify({"success": False, "message": "AI service temporarily unavailable."}), 500


# ---------- SESSION (FARM DATA + RECOMMENDATIONS) ----------
@app.route("/session", methods=["POST"])
def session():
    data = request.json

    farmer_id = data.get("farmer_id")
    crop = data.get("crop", "").strip()
    soil_type = data.get("soil_type", "").strip()
    ph = data.get("ph")
    nitrogen_ppm = data.get("nitrogen_ppm")
    phosphorus_ppm = data.get("phosphorus_ppm")
    potassium_ppm = data.get("potassium_ppm")
    water_availability = data.get("water_availability", "").strip()
    budget_range = data.get("budget_range", "").strip()
    language = data.get("language", "en")

    # Validation
    if not farmer_id or not crop or not soil_type or ph is None:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    # Compose recommendation question for AI
    farm_details = f"Crop: {crop}; Soil type: {soil_type}; Soil pH: {ph}; Nitrogen (ppm): {nitrogen_ppm}; Phosphorus (ppm): {phosphorus_ppm}; Potassium (ppm): {potassium_ppm}; Water availability: {water_availability}; Budget: {budget_range}"
    
    recommendation_question = f"Provide fertilizer recommendations per acre for the following farm: {farm_details}. Return recommended N-P-K amounts per acre, suggested fertilizer products, application timing, and a short justification. Keep result concise."

    # Get AI recommendation in selected language
    recommendation_obj = ai_answer(recommendation_question, language)

    # Save session to database
    db = get_db()
    cursor = db.cursor()

    try:
        # Save to sessions table
        cursor.execute(
            """INSERT INTO sessions 
            (farmer_id, crop, soil_type, ph, nitrogen_ppm, phosphorus_ppm, potassium_ppm, water_availability, budget_range, recommendation) 
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (farmer_id, crop, soil_type, float(ph), int(nitrogen_ppm or 0), int(phosphorus_ppm or 0), int(potassium_ppm or 0), water_availability, budget_range, json.dumps(recommendation_obj))
        )
        
        # Also save to queries table so it shows up in history
        cursor.execute(
            "INSERT INTO queries (farmer_id, question, answer, language) VALUES (%s,%s,%s,%s)",
            (farmer_id, recommendation_question, json.dumps(recommendation_obj), language)
        )
        
        db.commit()
        return jsonify({"success": True, "answer": recommendation_obj})
    except Exception as e:
        print("Session error:", e)
        return jsonify({"success": False, "message": str(e)}), 400

# ---------- HISTORY ----------
@app.route("/history/<int:farmer_id>", methods=["GET"])
def history(farmer_id):
    db = get_db()
    cursor = db.cursor(dictionary=True)

    cursor.execute(
        "SELECT question, answer, created_at FROM queries WHERE farmer_id=%s ORDER BY created_at DESC",
        (farmer_id,)
    )

    rows = cursor.fetchall()

    for r in rows:
        try:
            r["answer"] = json.loads(r["answer"])
        except Exception:
            pass

    return jsonify(rows)

# ---------- AI-POWERED TIPS ----------
from datetime import datetime

@app.route("/tips", methods=["GET"])
def tips():
    language = request.args.get("language", "English")
    
    lang_map = {
        'English': 'English',
        'Kannada': 'Kannada',
        'en': 'English',
        'kn': 'Kannada'
    }
    target_language = lang_map.get(language, 'English')
    
    # Get current month for seasonal context
    current_month = datetime.now().strftime("%B")
    current_season = ""
    month_num = datetime.now().month
    if month_num in [6, 7, 8, 9, 10]:
        current_season = "Kharif (monsoon)"
    elif month_num in [11, 12, 1, 2, 3]:
        current_season = "Rabi (winter)"
    else:
        current_season = "Zaid (summer)"
    
    prompt = f"""
You are an agriculture expert for Indian farmers (especially Karnataka region).
Current month: {current_month}, Season: {current_season}

IMPORTANT: Respond ONLY in {target_language}.

Generate practical, actionable farming tips organized into these 5 categories.
Return ONLY valid JSON with this exact structure:

{{
  "seasonal_tips": {{
    "title": "Seasonal Farming Tips - {current_month}",
    "tips": ["tip1", "tip2", "tip3", "tip4"]
  }},
  "soil_health": {{
    "title": "Soil Health Management",
    "tips": ["tip1", "tip2", "tip3", "tip4"]
  }},
  "water_management": {{
    "title": "Water Management",
    "tips": ["tip1", "tip2", "tip3", "tip4"]
  }},
  "government_schemes": {{
    "title": "Government Schemes",
    "tips": ["scheme1 with brief description", "scheme2", "scheme3", "scheme4"]
  }},
  "emergency_contacts": {{
    "title": "Important Contacts",
    "tips": ["contact1", "contact2", "contact3", "contact4"]
  }}
}}

Make tips specific to the current season ({current_season}) and relevant to Karnataka/South Indian farmers.
Keep each tip concise (1-2 sentences max).
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt
        )

        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.replace("```json", "").replace("```", "").strip()

        try:
            tips_data = json.loads(raw)
            return jsonify({"success": True, "tips": tips_data})
        except Exception:
            return jsonify({"success": True, "tips": {"raw": raw}})

    except Exception as e:
        print("Tips AI error:", e)
        return jsonify({"success": False, "message": "AI service temporarily unavailable."}), 500

# ------------------ RUN SERVER ------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)