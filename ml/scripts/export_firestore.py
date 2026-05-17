"""
FIXNOW — Firestore Data Exporter
Exports bookings, technicians, users, and reviews from Firestore to CSV for ML training.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import pandas as pd
import json
import os
from datetime import datetime

# Path to service account key (relative to ml/ directory)
SERVICE_ACCOUNT_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'backend', 'serviceAccountKey.json')

def init_firebase():
    """Initialize Firebase Admin SDK."""
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
    return firestore.client()

def export_collection(db, collection_name: str, output_dir: str) -> pd.DataFrame:
    """Export a Firestore collection to CSV."""
    print(f"  Exporting '{collection_name}'...")
    docs = []
    for doc in db.collection(collection_name).stream():
        record = doc.to_dict()
        record['_doc_id'] = doc.id
        docs.append(record)
    
    if not docs:
        print(f"    [!] No documents found in '{collection_name}'")
        return pd.DataFrame()
    
    df = pd.DataFrame(docs)
    output_path = os.path.join(output_dir, f'{collection_name}.csv')
    df.to_csv(output_path, index=False)
    print(f"    [OK] Exported {len(df)} records -> {output_path}")
    return df

def main():
    print("=" * 50)
    print("FIXNOW — Firestore Data Export")
    print(f"Timestamp: {datetime.now().isoformat()}")
    print("=" * 50)
    
    output_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')
    os.makedirs(output_dir, exist_ok=True)
    
    db = init_firebase()
    
    # Export core collections
    collections = ['bookings', 'technicians', 'users', 'reviews', 'toolCatalog', 'technician_subscriptions']
    
    results = {}
    for col in collections:
        try:
            results[col] = export_collection(db, col, output_dir)
        except Exception as e:
            print(f"    [ERR] Error exporting '{col}': {e}")
    
    # Summary
    print("\n" + "=" * 50)
    print("Export Summary:")
    for name, df in results.items():
        print(f"  {name}: {len(df)} records, {len(df.columns)} columns")
    print("=" * 50)
    print(f"\nFiles saved to: {os.path.abspath(output_dir)}")

if __name__ == '__main__':
    main()
