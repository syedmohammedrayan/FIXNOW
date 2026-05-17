import pandas as pd
import numpy as np
import os
import math
import json

def haversine(lat1, lon1, lat2, lon2):
    # Calculate distance between two lat/lng coordinates in km
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def preprocess_data():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    raw_dir = os.path.join(base_dir, 'data', 'raw')
    processed_dir = os.path.join(base_dir, 'data')
    os.makedirs(processed_dir, exist_ok=True)

    print("Loading raw data...")
    try:
        bookings = pd.read_csv(os.path.join(raw_dir, 'bookings.csv'))
        technicians = pd.read_csv(os.path.join(raw_dir, 'technicians.csv'))
        subs = pd.read_csv(os.path.join(raw_dir, 'technician_subscriptions.csv'))
        users = pd.read_csv(os.path.join(raw_dir, 'users.csv'))
    except FileNotFoundError:
        print("[ERR] CSV files not found. Run export_firestore.py first.")
        return

    # Filter only completed or reasonably finished bookings to learn from
    # Actually, we want to learn from all assigned bookings. If it was cancelled by tech, maybe it's a failure.
    # Let's focus on bookings that have a technician assigned.
    bookings = bookings[bookings['technicianId'].notna() & (bookings['technicianId'] != 'broadcast')]
    
    if len(bookings) == 0:
        print("[!] No assigned bookings found to train on. Model needs historical data.")
        # We will create a dummy df to allow the pipeline to succeed, but training will use synthetic fallback if needed
        features = pd.DataFrame(columns=['skill_match', 'distance', 'rating', 'experience', 'budget_fit', 'visibility_promotion', 'quota_used_percentage', 'success'])
        features.to_csv(f'{processed_dir}/training_data.csv', index=False)
        return

    features_list = []

    for _, b in bookings.iterrows():
        tech_id = b['technicianId']
        
        # Get technician info
        tech_info = technicians[technicians['_doc_id'] == tech_id]
        user_info = users[users['_doc_id'] == tech_id]
        
        if tech_info.empty and user_info.empty:
            continue
            
        t_data = tech_info.iloc[0] if not tech_info.empty else user_info.iloc[0]
        u_data = user_info.iloc[0] if not user_info.empty else pd.Series()

        # 1. Distance
        t_lat = t_data.get('lat') or t_data.get('location', {}).get('lat') if isinstance(t_data.get('location'), dict) else 0
        t_lng = t_data.get('lng') or t_data.get('location', {}).get('lng') if isinstance(t_data.get('location'), dict) else 0
        
        # Clean locations
        try:
            if isinstance(t_lat, str) and "lat" in t_lat:
                loc_dict = eval(t_lat)
                t_lat, t_lng = loc_dict.get('lat', 0), loc_dict.get('lng', 0)
        except:
            pass

        c_lat = b.get('customerLat', 0)
        c_lng = b.get('customerLng', 0)
        
        try:
            t_lat, t_lng = float(t_lat), float(t_lng)
            c_lat, c_lng = float(c_lat), float(c_lng)
            distance = haversine(c_lat, c_lng, t_lat, t_lng) if c_lat and t_lat else 5.0
        except:
            distance = 5.0
            
        # 2. Skill Match
        req_cat = str(b.get('category', '')).lower()
        tech_cat = str(t_data.get('category', '')).lower()
        tech_skills = str(t_data.get('skills', '[]')).lower()
        
        skill_match = 0.0
        if req_cat in tech_cat or tech_cat in req_cat:
            skill_match = 1.0
        elif req_cat in tech_skills:
            skill_match = 0.8
        else:
            skill_match = 0.2

        # 3. Rating & Experience
        rating = float(u_data.get('rating', t_data.get('rating', 4.5)))
        experience = float(u_data.get('experience', t_data.get('experience', 2)))

        # 4. Budget Fit
        # Mocking budget fit as 0.8 for now unless we have base prices
        budget_fit = 0.8

        # 5. Visibility Promotion & Quota
        sub_info = subs[subs['_doc_id'] == tech_id]
        if not sub_info.empty:
            s_data = sub_info.iloc[0]
            plan = str(s_data.get('planId', 'free')).lower()
            visibility_promotion = 0.2 if plan == 'elite' else (0.1 if plan == 'pro' else 0.0)
            
            limit = float(s_data.get('bookingLimit', 5))
            used = float(s_data.get('bookingsUsed', 0))
            quota_used_percentage = min(used / limit, 1.0) if limit > 0 else 0.0
        else:
            visibility_promotion = 0.0
            quota_used_percentage = 0.1

        # 6. Target (Success)
        # Success = Completed and (no rating or rating >= 3)
        b_status = str(b.get('status', ''))
        b_rating = b.get('rating')
        
        success = 0
        if b_status == 'Completed':
            if pd.isna(b_rating) or float(b_rating) >= 3.0:
                success = 1

        features_list.append({
            'skill_match': float(skill_match),
            'distance': float(distance),
            'rating': float(rating),
            'experience': float(experience),
            'budget_fit': float(budget_fit),
            'visibility_promotion': float(visibility_promotion),
            'quota_used_percentage': float(quota_used_percentage),
            'success': int(success)
        })

    features_df = pd.DataFrame(features_list)
    output_path = os.path.join(processed_dir, 'training_data.csv')
    features_df.to_csv(output_path, index=False)
    print(f"[OK] Preprocessing complete! Processed {len(features_df)} records. Saved to {output_path}")

if __name__ == '__main__':
    preprocess_data()
