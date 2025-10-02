# backend.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import redis, math, datetime, json

# --------------------------
# Helpers
# --------------------------
def haversine_km(a_lat, a_lng, b_lat, b_lng):
    # returns kilometers (digit-by-digit safe)
    R = 6371.0
    from math import radians, sin, cos, sqrt, atan2
    rlat1, rlon1, rlat2, rlon2 = map(radians, (a_lat, a_lng, b_lat, b_lng))
    dlat = rlat2 - rlat1
    dlon = rlon2 - rlon1
    A = sin(dlat/2)**2 + cos(rlat1)*cos(rlat2)*sin(dlon/2)**2
    C = 2 * atan2(sqrt(A), sqrt(1-A))
    return R * C

# --------------------------
# Config (replace with env/secrets)
# --------------------------
REDIS_URL = "redis://localhost:6379/0"
rconn = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# --------------------------
# FastAPI / request schemas
# --------------------------
app = FastAPI(title="NOMAD Planner")

class PlanRequest(BaseModel):
    origin_name: str              # e.g. "New Delhi"
    origin_lat: Optional[float]
    origin_lng: Optional[float]
    destination_name: str         # e.g. "Shimla"
    destination_lat: Optional[float]
    destination_lng: Optional[float]
    start_date: str               # ISO date "2025-10-15"
    days: int
    vibe: Optional[str] = "calm"  # adventurous, calm, cultural, party
    preferences: Optional[List[str]] = None # e.g., ["no-hikes", "budget"]
    max_daily_travel_km: Optional[float] = 100.0

class PromptRequest(BaseModel):
    prompt: str
    origin_name: Optional[str] = "Sahibzada Ajit Singh Nagar" # Default origin
    origin_lat: Optional[float] = 30.7046
    origin_lng: Optional[float] = 76.7179

# --------------------------
# Stubs: replace with your Pathway RAG retrieval & connectors
# --------------------------
def rag_retrieve(query: str, k: int = 10) -> List[Dict[str,Any]]:
    """
    Query Pathway dynamic RAG retriever and return up to k docs.
    """
    # --------- MOCKED SAMPLE (replace me) ----------
    return [
        {
            "place_id":"place_blue_lake",
            "name":"The Ridge Park",
            "description":"Scenic open area with Himalayan views, gentle walks.",
            "type":"place",
            "lat":31.1048,
            "lng":77.1734,
            "opening_hours":"24/7",
            "avg_rating":4.4
        },
        {
            "place_id":"place_hanuman",
            "name":"Hanuman Mandir",
            "description":"Popular temple in the town center, good for evening visits.",
            "type":"place",
            "lat":31.1045,
            "lng":77.1710,
            "opening_hours":"6:00-21:00",
            "avg_rating":4.3
        },
        {
            "place_id":"place_jhakri",
            "name":"Jakhoo Hill (short trek)",
            "description":"Short trek to panoramic viewpoint; adventurous option.",
            "type":"place",
            "lat":31.1039,
            "lng":77.1766,
            "opening_hours":"6:00-18:00",
            "avg_rating":4.2
        },
    ][:k]

def find_transports(origin_name, destination_name, date_iso):
    """
    Find transport options (flights/trains) for the requested date.
    """
    # --------- MOCKED SAMPLE (replace me) ----------
    return [
        {
            "mode":"train",
            "provider":"Shatabdi (mock)",
            "id":"12345",
            "depart_time":date_iso + "T06:00:00",
            "arrive_time":date_iso + "T11:30:00",
            "depart_station":"New Delhi Railway Station",
            "arrive_station":"Kalka Railway Station",
            "duration_min":330,
            "price_est":"₹800 - ₹1500"
        },
        {
            "mode":"toy_train",
            "provider":"Kalka–Shimla Toy Train",
            "id":"toy-001",
            "depart_time":date_iso + "T13:00:00",
            "arrive_time":date_iso + "T16:30:00",
            "depart_station":"Kalka",
            "arrive_station":"Shimla",
            "duration_min":210,
            "price_est":"₹200 - ₹400"
        }
    ]

def get_hotels(destination_name, vibe, limit=3):
    """
    Return hotel suggestions
    """
    return [
        {"name":"Hotel calm vista","price_band":"mid","distance_km":0.6,"rating":4.4,"id":"hotel_1"},
        {"name":"Heritage Stay Shimla","price_band":"premium","distance_km":0.9,"rating":4.6,"id":"hotel_2"},
        {"name":"Budget Lodge Shimla","price_band":"budget","distance_km":1.2,"rating":4.0,"id":"hotel_3"},
    ][:limit]

def get_weather_for_place(place_id):
    """
    Read weather from Redis (written by your weather connector).
    """
    raw = rconn.get(f"weather:{place_id}")
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        return None

# --------------------------
# NLU / Prompt Processing
# --------------------------
def parse_prompt_with_llm(prompt: str) -> Dict[str, Any]:
    """
    Uses an LLM to parse a natural language prompt into structured entities.
    This is a mock that simulates an LLM's function-calling capability.
    TODO: Replace with a real call to an LLM API (e.g., Gemini, OpenAI).
    """
    print(f"Parsing prompt with LLM: '{prompt}'")
    # In a real implementation, you would format a request to an LLM API
    # and ask it to extract parameters for a "plan_trip" function.

    # --- MOCKED LLM RESPONSE (replace me) ---
    # The LLM would analyze the prompt and generate this structured output.
    # It can handle misspellings ("shima" -> "Shimla") and relative dates.
    prompt_lower = prompt.lower()
    if "shima" in prompt_lower or "shimla" in prompt_lower:
        return {
            "destination_name": "Shimla",
            "days": 2,
            "start_date": None,
            "vibe": "calm"
        }
    elif "goa" in prompt_lower:
        return {
            "destination_name": "Goa",
            "days": 2, # "weekend" implies 2 days
            "start_date": "next weekend", # The LLM extracts the relative date term
            "vibe": "party"
        }
    return {}

def resolve_relative_date(date_str: Optional[str]) -> Optional[str]:
    """
    Converts a relative date string into an ISO date format.
    """
    if not date_str:
        return None

    today = datetime.date.today()
    
    if date_str.lower() == "next weekend":
        # Days until next Saturday: (5 - today.weekday() + 7) % 7
        days_to_saturday = (5 - today.weekday() + 7) % 7
        if days_to_saturday == 0: # If today is Sat, get next Sat
            days_to_saturday = 7
        next_saturday = today + datetime.timedelta(days=days_to_saturday)
        return next_saturday.isoformat()

    # Add more rules here for "tomorrow", "in 3 days", etc.
    try:
        datetime.date.fromisoformat(date_str)
        return date_str
    except (ValueError, TypeError):
        return None

# --------------------------
# Itinerary generator (high-level planner)
# --------------------------
def build_plan(req: PlanRequest):
    # 1. fetch candidate places (RAG)
    vibe_query = f"{req.destination_name} best places for {req.vibe} travel"
    candidate_places = rag_retrieve(vibe_query, k=30)

    # 2. rank/filter by vibe & opening hours & distances
    selected = candidate_places[:8]

    # attach distances and weather
    origin_lat = req.origin_lat
    origin_lng = req.origin_lng
    for p in selected:
        if p.get("lat") and origin_lat:
            p["distance_from_origin_km"] = round(haversine_km(origin_lat, origin_lng or req.origin_lng or 0.0, p["lat"], p["lng"]), 2)
        else:
            p["distance_from_origin_km"] = None
        p["weather"] = get_weather_for_place(p.get("place_id"))

    # 3. find trains/flights
    transports = find_transports(req.origin_name, req.destination_name, req.start_date)

    # 4. allocate places to days with times
    days = []
    idx = 0
    start_dt = datetime.date.fromisoformat(req.start_date)
    for d in range(req.days):
        day_date = start_dt + datetime.timedelta(days=d)
        day_slots = []
        if idx < len(selected):
            p = selected[idx]; idx += 1
            day_slots.append({"time":"09:00-11:30", "place": p, "activity": "Sightseeing / Walk"})
        day_slots.append({"time":"12:00-13:30", "place": {"name":"Local cafe/restaurant", "place_id":"local_rest"}, "activity":"Lunch"})
        if idx < len(selected):
            p = selected[idx]; idx += 1
            day_slots.append({"time":"14:00-17:00", "place": p, "activity": "Visit / Experience"})
        day_slots.append({"time":"18:00-20:00", "place":{"name":"Evening stroll / Market"}, "activity":"Evening"})
        days.append({"date": day_date.isoformat(), "slots": day_slots})

    # 5. hotels
    hotels = get_hotels(req.destination_name, req.vibe, limit=3)

    # 6. compose result
    result = {
        "origin": {"name": req.origin_name, "lat": req.origin_lat, "lng": req.origin_lng},
        "destination": {"name": req.destination_name, "lat": req.destination_lat, "lng": req.destination_lng},
        "start_date": req.start_date,
        "days": days,
        "transports": transports,
        "hotels": hotels,
        "notes": "This itinerary is assembled from retrieved place info, local schedules, and suggested transport. For live bookings and exact times/prices please confirm with the transport provider / booking API."
    }
    return result

# --------------------------
# API endpoints
# --------------------------
@app.post("/plan-trip")
def plan_trip(req: PlanRequest):
    """Processes a structured request to plan a trip."""
    plan = build_plan(req)
    # Optionally, call LLM to polish the plan into natural language summary
    # summary = call_llm_system(plan)  # TODO
    return plan

@app.post("/plan-trip-from-prompt")
def plan_trip_from_prompt(prompt_req: PromptRequest):
    """Processes a natural language prompt to plan a trip."""
    # 1. Parse the unstructured prompt to get structured entities
    extracted_entities = parse_prompt_with_llm(prompt_req.prompt)

    if not extracted_entities.get("destination_name"):
        return {"error": "Could not determine a destination from the prompt."}

    # 2. Resolve any relative dates
    iso_start_date = resolve_relative_date(extracted_entities.get("start_date"))

    # 3. Create the structured PlanRequest object, filling in defaults
    plan_request_data = {
        "origin_name": prompt_req.origin_name,
        "origin_lat": prompt_req.origin_lat,
        "origin_lng": prompt_req.origin_lng,
        "destination_name": extracted_entities.get("destination_name"),
        "start_date": iso_start_date or (datetime.date.today() + datetime.timedelta(days=1)).isoformat(), # Default to tomorrow
        "days": extracted_entities.get("days") or 2, # Default to 2 days
        "vibe": extracted_entities.get("vibe") or "calm" # Default vibe
    }
    
    # Create a Pydantic model instance for validation and to pass to the planner
    structured_request = PlanRequest(**plan_request_data)

    # 4. Call your existing build_plan function with the structured data
    final_plan = build_plan(structured_request)
    
    return final_plan