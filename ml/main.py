from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
import os

app = FastAPI(title="FIXNOW ML Service")

# Load model on startup
MODEL_PATH = 'ml/models/technician_recommender.json'
model = None

if os.path.exists(MODEL_PATH):
    model = xgb.XGBClassifier()
    model.load_model(MODEL_PATH)
    print("SUCCESS: ML Model loaded successfully.")
else:
    print("WARNING: ML Model not found. Deployment pending training.")

class RecommendationRequest(BaseModel):
    user_id: str
    booking_category: str
    available_technicians: list[dict] # List of technician features

@app.get("/")
def read_root():
    return {"status": "online", "model_loaded": model is not None}

@app.post("/recommend")
async def recommend(request: RecommendationRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded. Please train the model first.")
    
    # Convert incoming technicians list to DataFrame
    # Note: In a real scenario, you'd need to ensure columns match training features
    tech_df = pd.DataFrame(request.available_technicians)
    
    # Predict probabilities
    try:
        probs = model.predict_proba(tech_df)[:, 1]
        
        # Add scores to technicians
        results = []
        for i, tech in enumerate(request.available_technicians):
            results.append({
                "technician_id": tech.get("id", "unknown"),
                "match_score": float(probs[i])
            })
        
        # Sort by score descending
        results.sort(key=lambda x: x["match_score"], reverse=True)
        return {"recommendations": results}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
