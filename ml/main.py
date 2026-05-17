"""
FIXNOW ML Service — FastAPI
Endpoints:
  GET  /           → health check
  POST /predict    → XGBoost success probability
  POST /recommend  → ranked technician recommendations (legacy)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import xgboost as xgb
import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score
from pathlib import Path
from pathlib import Path

app = FastAPI(
    title="FIXNOW ML Service",
    description="AI-powered technician success prediction API",
    version="2.0.0"
)

# Allow Next.js frontend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Model Loading ────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent
MODEL_PATH = ROOT / "models" / "technician_recommender.json"
model = None

def load_model():
    global model
    if MODEL_PATH.exists():
        model = xgb.XGBClassifier()
        model.load_model(str(MODEL_PATH))
        print(f"✅ ML Model loaded from {MODEL_PATH}")
    else:
        print(f"⚠️  ML Model not found at {MODEL_PATH}. Run: python ml/scripts/train_model.py")

load_model()


# ─── Request/Response Models ──────────────────────────────────────────────────

class PredictRequest(BaseModel):
    skill_match: float = Field(..., ge=0.0, le=1.0, description="Semantic skill similarity 0-1")
    distance: float = Field(..., ge=0.0, description="Distance in km")
    rating: float = Field(..., ge=0.0, le=5.0, description="Technician average rating")
    experience: float = Field(..., ge=0.0, description="Years of experience")
    budget_fit: float = Field(..., ge=0.0, le=1.0, description="Budget compatibility 0-1")
    visibility_promotion: float = Field(default=0.0, ge=0.0, le=1.0, description="Visibility promotion bonus 0-1")
    quota_used_percentage: float = Field(default=0.0, ge=0.0, le=1.0, description="Percentage of bookings limit used 0-1")

class PredictResponse(BaseModel):
    success_probability: float
    confidence: str  # "High" | "Medium" | "Low"
    model_loaded: bool

class BatchPredictRequest(BaseModel):
    technicians: List[PredictRequest]

class BatchPredictResponse(BaseModel):
    results: List[dict]

# Legacy recommend schema
class RecommendationRequest(BaseModel):
    user_id: str
    booking_category: str
    available_technicians: list

class TrainingDataRow(BaseModel):
    skill_match: float
    distance: float
    rating: float
    experience: float
    budget_fit: float
    visibility_promotion: float
    quota_used_percentage: float
    success: int

class RetrainRequest(BaseModel):
    data: List[TrainingDataRow]

class RetrainResponse(BaseModel):
    message: str
    accuracy: float
    roc_auc: float
    samples: int


# ─── Helper ───────────────────────────────────────────────────────────────────

FEATURES = ["skill_match", "distance", "rating", "experience", "budget_fit", "visibility_promotion", "quota_used_percentage"]

def predict_single(data: dict) -> float:
    """Return success probability for a single technician feature dict."""
    if model is None:
        # Fallback: heuristic formula when model not loaded
        score = (
            data.get("skill_match", 0.5) * 0.35 +
            max(0, 1 - data.get("distance", 5) / 20) * 0.2 +
            data.get("rating", 3.5) / 5.0 * 0.2 +
            min(data.get("experience", 2) / 10, 1) * 0.1 +
            data.get("budget_fit", 0.5) * 0.05 +
            data.get("visibility_promotion", 0.0) * 0.1
        )
        if data.get("quota_used_percentage", 0.0) >= 1.0:
            score = 0.0
        else:
            score -= (data.get("quota_used_percentage", 0.0) * 0.1)
        return float(np.clip(score, 0.0, 1.0))

    df = pd.DataFrame([{k: data.get(k, 0) for k in FEATURES}])
    prob = float(model.predict_proba(df)[0, 1])
    return prob


def confidence_label(prob: float) -> str:
    if prob >= 0.75:
        return "High"
    elif prob >= 0.50:
        return "Medium"
    return "Low"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def health():
    return {
        "status": "online",
        "service": "FIXNOW ML Service",
        "version": "2.0.0",
        "model_loaded": model is not None,
        "model_path": str(MODEL_PATH)
    }


@app.post("/predict", tags=["Prediction"])
async def predict(req: PredictRequest):
    """
    Predict technician success probability for a single technician.
    Returns value between 0.0 (low confidence) and 1.0 (high confidence).
    Falls back to heuristic scoring if model is not loaded.
    """
    try:
        data = req.model_dump()
        print("Incoming request:", data)
        prob = predict_single(data)
        return {
            "success": True,
            "success_probability": round(prob, 4),
            "confidence": confidence_label(prob),
            "model_loaded": model is not None
        }
    except Exception as e:
        print("PREDICTION ERROR:", str(e))
        return {
            "success": False,
            "error": str(e)
        }


@app.post("/predict/batch", response_model=BatchPredictResponse, tags=["Prediction"])
async def predict_batch(req: BatchPredictRequest):
    """
    Predict success probability for multiple technicians at once.
    Returns results sorted by success_probability descending.
    """
    try:
        results = []
        for i, tech in enumerate(req.technicians):
            data = tech.model_dump()
            prob = predict_single(data)
            results.append({
                "index": i,
                "success_probability": round(prob, 4),
                "confidence": confidence_label(prob),
                **data
            })
        results.sort(key=lambda x: x["success_probability"], reverse=True)
        return BatchPredictResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@app.post("/retrain", response_model=RetrainResponse, tags=["Admin"])
def retrain_model(req: RetrainRequest):
    """
    Retrains the XGBoost model using live production data from Firebase.
    Saves the new artifact and hot-reloads it into memory.
    """
    global model
    
    if len(req.data) < 10:
        raise HTTPException(status_code=400, detail="Not enough data to train. Need at least 10 samples.")
        
    df = pd.DataFrame([row.model_dump() for row in req.data])
    
    X = df[FEATURES]
    y = df["success"]
    
    # If all classes are the same, we can't train properly
    if len(y.unique()) < 2:
        # Inject synthetic counter-examples to stabilize training temporarily
        synthetic_X = X.copy().iloc[:5]
        synthetic_X["distance"] = 999.0 # Guaranteed failure
        synthetic_y = pd.Series([0 if y.iloc[0] == 1 else 1] * len(synthetic_X))
        X = pd.concat([X, synthetic_X])
        y = pd.concat([y, synthetic_y])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    new_model = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=4,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        verbosity=0
    )
    
    new_model.fit(X_train, y_train)
    
    y_pred = new_model.predict(X_test)
    y_prob = new_model.predict_proba(X_test)[:, 1]
    
    accuracy = float(accuracy_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_prob)) if len(y_test.unique()) > 1 else 0.5
    
    # Save Model
    os.makedirs(MODEL_PATH.parent, exist_ok=True)
    new_model.save_model(str(MODEL_PATH))
    
    # Hot-reload in memory
    model = new_model
    print(f"✅ ML Model retrained & reloaded. Acc: {accuracy:.4f}, AUC: {auc:.4f}")
    
    return RetrainResponse(
        message="Model retrained successfully",
        accuracy=accuracy,
        roc_auc=auc,
        samples=len(df)
    )

@app.post("/reload-model", tags=["Admin"])
async def reload_model():
    """Hot-reload the model after retraining."""
    load_model()
    return {"model_loaded": model is not None, "model_path": str(MODEL_PATH)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
