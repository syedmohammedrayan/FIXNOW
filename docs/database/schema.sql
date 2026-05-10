-- =============================================
-- FIXNOW Supabase Schema (Production-Ready)
-- =============================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'customer',
  avatar TEXT,
  address TEXT,
  emergency_contact TEXT,
  password_hint TEXT,
  category TEXT,
  skills TEXT[],
  bio TEXT,
  online BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT true,
  verification_status TEXT DEFAULT 'verified',
  rejection_reason TEXT,
  gov_id_url TEXT,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Technicians Table (mirrors users with role=technician for fast queries)
CREATE TABLE IF NOT EXISTS technicians (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  category TEXT,
  skills TEXT[],
  rating NUMERIC DEFAULT 5.0,
  total_jobs INTEGER DEFAULT 0,
  earnings NUMERIC DEFAULT 0,
  avatar TEXT,
  bio TEXT,
  address TEXT,
  online BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  gov_id_url TEXT,
  password_hint TEXT,
  lat NUMERIC,
  lng NUMERIC,
  location JSONB,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pending Technicians (awaiting admin approval)
CREATE TABLE IF NOT EXISTS pending_technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'technician',
  category TEXT,
  skills TEXT[],
  password TEXT,
  password_hint TEXT,
  gov_id_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  approved BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  technician_id TEXT,
  technician_name TEXT,
  customer_name TEXT,
  category TEXT,
  status TEXT DEFAULT 'Pending',
  payment_status TEXT DEFAULT 'Unpaid',
  payment_mode TEXT,
  otp TEXT,
  address TEXT,
  customer_lat NUMERIC,
  customer_lng NUMERIC,
  customer_location JSONB,
  tech_location JSONB,
  last_eta TEXT,
  issue_description TEXT,
  urgency TEXT DEFAULT 'Standard',
  estimated_cost_range TEXT,
  contact_number TEXT,
  services_done TEXT,
  accessories JSONB,
  total_amount NUMERIC,
  final_amount NUMERIC,
  eligible_tech_ids TEXT[],
  accepted_at TIMESTAMPTZ,
  accepted_by_tech_name TEXT,
  declined_at TIMESTAMPTZ,
  service_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_at TIMESTAMPTZ
);

-- 5. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT 'NOTIF_' || extract(epoch from now())::bigint::text,
  user_id TEXT,
  type TEXT,
  title TEXT,
  message TEXT NOT NULL,
  booking_id TEXT,
  order_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Notification Logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  type TEXT,
  booking_id TEXT,
  channels JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tool Catalog
CREATE TABLE IF NOT EXISTS tool_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  icon TEXT,
  image TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tool Orders
CREATE TABLE IF NOT EXISTS tool_orders (
  id TEXT PRIMARY KEY,
  technician_id TEXT,
  technician_name TEXT,
  items JSONB,
  custom_tool JSONB,
  total_amount NUMERIC NOT NULL,
  payment_method TEXT DEFAULT 'deduct_from_earnings',
  payment_status TEXT DEFAULT 'Awaiting Approval',
  status TEXT DEFAULT 'Pending',
  delivery_estimate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT,
  order_id TEXT,
  booking_id TEXT,
  technician_id TEXT,
  technician_name TEXT,
  customer_name TEXT,
  category TEXT,
  amount NUMERIC,
  status TEXT DEFAULT 'Pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Reminders Table
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  booking_id TEXT,
  next_service_date TIMESTAMPTZ,
  category TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Live Tracking Table (for Supabase Realtime)
CREATE TABLE IF NOT EXISTS live_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id TEXT UNIQUE NOT NULL,
  technician_id TEXT,
  tech_lat NUMERIC,
  tech_lng NUMERIC,
  customer_lat NUMERIC,
  customer_lng NUMERIC,
  eta TEXT,
  status TEXT DEFAULT 'tracking',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Enable Realtime on key tables
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE live_tracking;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE technicians;
ALTER PUBLICATION supabase_realtime ADD TABLE tool_orders;

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_tracking ENABLE ROW LEVEL SECURITY;

-- Allow service_role to bypass RLS (backend uses service_role key)
-- Frontend anon key policies:
CREATE POLICY "Public read technicians" ON technicians FOR SELECT USING (true);
CREATE POLICY "Technicians update own" ON technicians FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users read own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Read own bookings" ON bookings FOR SELECT USING (
  customer_id = auth.uid()::text OR technician_id = auth.uid()::text
);
CREATE POLICY "Read broadcast bookings" ON bookings FOR SELECT USING (
  technician_id = 'broadcast' AND status = 'Pending'
);

CREATE POLICY "Read own notifications" ON notifications FOR SELECT USING (
  user_id = auth.uid()::text
);

CREATE POLICY "Read own live tracking" ON live_tracking FOR SELECT USING (true);
CREATE POLICY "Update live tracking" ON live_tracking FOR UPDATE USING (true);
CREATE POLICY "Insert live tracking" ON live_tracking FOR INSERT WITH CHECK (true);

-- =============================================
-- Storage Buckets (run via Supabase Dashboard or API)
-- =============================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ids', 'ids', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tools', 'tools', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ai-analysis', 'ai-analysis', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('services', 'services', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bookings', 'bookings', false);

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_technician ON bookings(technician_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_technicians_category ON technicians(category);
CREATE INDEX IF NOT EXISTS idx_technicians_online ON technicians(online);
CREATE INDEX IF NOT EXISTS idx_live_tracking_booking ON live_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_technician ON transactions(technician_id);
