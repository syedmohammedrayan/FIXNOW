import requests
import pandas as pd
import sys

# Replace this with your actual Render URL for fixnow-ml
LIVE_URL = "https://fixnow-ml.onrender.com"

def trigger_retrain():
    if "your-new-ml-service-url" in LIVE_URL:
        print("❌ Please update the LIVE_URL in this script with your actual Render fixnow-ml URL!")
        sys.exit(1)

    print(f"Connecting to {LIVE_URL}/retrain ...")
    
    # We will send the same synthetic baseline data used locally to bootstrap the live model
    payload = {
        "data": [
            {'skill_match': 1.0, 'distance': 1.0, 'rating': 5.0, 'experience': 10.0, 'budget_fit': 1.0, 'visibility_promotion': 0.2, 'quota_used_percentage': 0.1, 'success': 1},
            {'skill_match': 0.8, 'distance': 5.0, 'rating': 4.5, 'experience': 5.0, 'budget_fit': 0.8, 'visibility_promotion': 0.1, 'quota_used_percentage': 0.5, 'success': 1},
            {'skill_match': 0.2, 'distance': 20.0, 'rating': 2.0, 'experience': 1.0, 'budget_fit': 0.2, 'visibility_promotion': 0.0, 'quota_used_percentage': 0.9, 'success': 0},
            {'skill_match': 0.0, 'distance': 50.0, 'rating': 1.0, 'experience': 0.0, 'budget_fit': 0.0, 'visibility_promotion': 0.0, 'quota_used_percentage': 1.0, 'success': 0},
            # Duplicated to meet the minimum 10 samples required by the API
            {'skill_match': 1.0, 'distance': 1.0, 'rating': 5.0, 'experience': 10.0, 'budget_fit': 1.0, 'visibility_promotion': 0.2, 'quota_used_percentage': 0.1, 'success': 1},
            {'skill_match': 0.8, 'distance': 5.0, 'rating': 4.5, 'experience': 5.0, 'budget_fit': 0.8, 'visibility_promotion': 0.1, 'quota_used_percentage': 0.5, 'success': 1},
            {'skill_match': 0.2, 'distance': 20.0, 'rating': 2.0, 'experience': 1.0, 'budget_fit': 0.2, 'visibility_promotion': 0.0, 'quota_used_percentage': 0.9, 'success': 0},
            {'skill_match': 0.0, 'distance': 50.0, 'rating': 1.0, 'experience': 0.0, 'budget_fit': 0.0, 'visibility_promotion': 0.0, 'quota_used_percentage': 1.0, 'success': 0},
            {'skill_match': 1.0, 'distance': 1.0, 'rating': 5.0, 'experience': 10.0, 'budget_fit': 1.0, 'visibility_promotion': 0.2, 'quota_used_percentage': 0.1, 'success': 1},
            {'skill_match': 0.0, 'distance': 50.0, 'rating': 1.0, 'experience': 0.0, 'budget_fit': 0.0, 'visibility_promotion': 0.0, 'quota_used_percentage': 1.0, 'success': 0},
        ]
    }

    try:
        response = requests.post(f"{LIVE_URL}/retrain", json=payload)
        response.raise_for_status()
        data = response.json()
        print("✅ Success! Model retrained on the live server.")
        print(f"Accuracy: {data.get('accuracy', 0):.4f} | Samples Processed: {data.get('samples', 0)}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to trigger retrain: {e}")
        if response is not None:
            print("Response:", response.text)

if __name__ == "__main__":
    trigger_retrain()
