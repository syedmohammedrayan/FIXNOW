import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def train_model():
    data_path = 'ml/data/processed/training_data.csv'
    model_dir = 'ml/models'
    os.makedirs(model_dir, exist_ok=True)

    if not os.path.exists(data_path):
        print(f"❌ No training data found at {data_path}. Run preprocess.py first.")
        return

    print("Loading training data...")
    df = pd.read_csv(data_path)
    
    if 'target' not in df.columns:
        print("❌ 'target' column missing in training data.")
        return

    X = df.drop('target', axis=1)
    y = df['target']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print(f"Training on {len(X_train)} samples...")
    model = xgb.XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        objective='binary:logistic',
        random_state=42
    )

    model.fit(X_train, y_train)

    # Evaluate
    preds = model.predict(X_test)
    print("\nModel Evaluation:")
    print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
    print(classification_report(y_test, preds))

    # Save model
    model_path = f'{model_dir}/technician_recommender.json'
    model.save_model(model_path)
    print(f"✅ Model saved to {model_path}")

if __name__ == '__main__':
    train_model()
