import pandas as pd
import numpy as np
import os

def preprocess_data():
    raw_dir = 'ml/data/raw'
    processed_dir = 'ml/data/processed'
    os.makedirs(processed_dir, exist_ok=True)

    print("Loading data...")
    try:
        bookings = pd.read_csv(f'{raw_dir}/bookings.csv')
        technicians = pd.read_csv(f'{raw_dir}/technicians.csv')
        reviews = pd.read_csv(f'{raw_dir}/reviews.csv')
    except FileNotFoundError:
        print("❌ CSV files not found. Run export_firestore.py first.")
        return

    print("Cleaning and merging...")
    # Example: Merge reviews with bookings to get labels
    # Assuming 'bookingId' is the common field
    df = bookings.merge(reviews[['bookingId', 'rating']], left_on='_doc_id', right_on='bookingId', how='left')
    
    # Define Target: 1 for highly rated/successful job, 0 otherwise
    df['target'] = (df['rating'] >= 4).astype(int)
    
    # Feature Engineering
    # 1. Skill Match (Mockup logic)
    # df['skill_match'] = df.apply(lambda x: x['category'] in x['technician_skills'], axis=1)
    
    # Drop IDs and non-numeric columns for training
    features = df.select_dtypes(include=[np.number])
    
    output_path = f'{processed_dir}/training_data.csv'
    features.to_csv(output_path, index=False)
    print(f"✅ Preprocessing complete! Saved to {output_path}")

if __name__ == '__main__':
    preprocess_data()
