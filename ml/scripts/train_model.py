"""
FIXNOW — XGBoost Technician Success Predictor Training Script
Run: python ml/scripts/train_model.py
"""
import os
import sys
import pandas as pd
import numpy as np
from pathlib import Path

# Ensure we can import from root
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

try:
    import xgboost as xgb
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score, roc_auc_score, classification_report
except ImportError:
    print("ERROR: Missing dependencies. Run: pip install xgboost scikit-learn pandas")
    sys.exit(1)

DATA_PATH = ROOT / "ml" / "data" / "training_data.csv"
MODEL_DIR = ROOT / "ml" / "models"
MODEL_PATH = MODEL_DIR / "technician_recommender.json"


def train():
    print("=" * 60)
    print("FIXNOW ML — Technician Success Predictor Training")
    print("=" * 60)

    # Load data
    if not DATA_PATH.exists():
        print(f"ERROR: Training data not found at {DATA_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df)} training samples")
    
    # We no longer mock features, we use real data from preprocess.py!
    
    print(f"   Class distribution:\n{df['success'].value_counts().to_string()}")
    
    if len(df) < 10:
        print("[!] Not enough real data to train properly. Injecting synthetic baseline data to stabilize the model for now.")
        # Create a synthetic baseline dataset so the API doesn't crash on an empty model
        synthetic_data = pd.DataFrame([
            {'skill_match': 1.0, 'distance': 1.0, 'rating': 5.0, 'experience': 10, 'budget_fit': 1.0, 'visibility_promotion': 0.2, 'quota_used_percentage': 0.1, 'success': 1},
            {'skill_match': 0.8, 'distance': 5.0, 'rating': 4.5, 'experience': 5, 'budget_fit': 0.8, 'visibility_promotion': 0.1, 'quota_used_percentage': 0.5, 'success': 1},
            {'skill_match': 0.2, 'distance': 20.0, 'rating': 2.0, 'experience': 1, 'budget_fit': 0.2, 'visibility_promotion': 0.0, 'quota_used_percentage': 0.9, 'success': 0},
            {'skill_match': 0.0, 'distance': 50.0, 'rating': 1.0, 'experience': 0, 'budget_fit': 0.0, 'visibility_promotion': 0.0, 'quota_used_percentage': 1.0, 'success': 0},
        ] * 5)
        df = pd.concat([df, synthetic_data], ignore_index=True)

    # Features and target
    features = ["skill_match", "distance", "rating", "experience", "budget_fit", "visibility_promotion", "quota_used_percentage"]
    X = df[features]
    y = df["success"]

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"   Train size: {len(X_train)}, Test size: {len(X_test)}")

    # XGBoost Classifier
    model = xgb.XGBClassifier(
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

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )

    # Evaluate
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    print(f"\nModel Performance:")
    print(f"   Accuracy: {accuracy:.4f} ({accuracy*100:.1f}%)")
    print(f"   ROC-AUC:  {auc:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['Fail', 'Success'])}")

    # Feature importance
    importances = dict(zip(features, model.feature_importances_))
    print("Feature Importances:")
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
        bar = "=" * int(imp * 40)
        print(f"   {feat:<15} {bar} {imp:.4f}")

    # Save model
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model.save_model(str(MODEL_PATH))
    print(f"\nModel saved to: {MODEL_PATH}")
    print(f"   File size: {MODEL_PATH.stat().st_size / 1024:.1f} KB")
    print("\nTraining complete! ML service is ready.")

    return model


if __name__ == "__main__":
    train()
