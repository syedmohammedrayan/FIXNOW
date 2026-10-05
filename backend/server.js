// Express is the HTTP framework; http.createServer wraps it so Socket.IO can share the port.
const express = require('express');
const http = require('http');
// Server is Socket.IO's server class — provides the real-time WebSocket layer.
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
// Wrap the Express app in a raw HTTP server so Socket.IO and Express share port 5050.
const server = http.createServer(app);

// Create the Socket.IO instance attached to the HTTP server.
// CORS is open (*) because the frontend may be on a different domain (Vercel vs Render).
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Standard Express middleware: parse JSON bodies, allow cross-origin requests.
app.use(cors());
app.use(express.json());
// Attach the io instance to the Express app so route handlers can emit socket events.
app.set('io', io);

// Serve uploaded files as static assets (e.g. technician photos at /uploads/avatar-123.jpg).
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Route imports ──
const aiRoutes = require('./routes/ai');
const bookingsRoutes = require('./routes/bookings');
const toolsRoutes = require('./routes/tools');
const usersRoutes = require('./routes/users');
const subscriptionsRoutes = require('./routes/subscriptions');
const { getRealETA } = require('./services/etaService');
const { notifyUser } = require('./services/notifications');
const { runReminderEngine } = require('./services/reminderEngine');
// Firestore db is needed inside socket handlers for throttled location persistence.
const { db } = require('./config/firebaseAdmin');
const uploadRoute = require('./routes/upload');
const complaintsRoutes = require('./routes/complaints');
const paymentRoutes = require('./routes/payment');
const profileRoutes = require('./routes/profile');

// ── Mount REST API routes — all prefixed with /api ──
app.use('/api/ai', aiRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/upload', uploadRoute);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/profile', profileRoutes);

// Health check used by Render's uptime monitoring and the frontend connectivity check.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'firebase', timestamp: new Date().toISOString() });
});

// ===== SOCKET.IO - Real-time Events =====

// Tracks which Socket.IO rooms are alive (used to prevent duplicate simulations).
const activeRooms = new Map();
// Maps room IDs to setInterval handles so simulations can be cancelled on disconnect.
const activeSimulations = new Map();
// Maps socketId → { techId, category, categories } for cleanup on disconnect.
const connectedTechnicians = new Map();

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Admin joins the fleet tracking room for real-time global view of all technicians.
  socket.on('admin_join_fleet', () => {
    socket.join('admin_fleet');
    console.log(`🗺️ Admin ${socket.id} joined fleet tracking room`);
  });

  // Customer (or technician) joins a booking-specific room to receive live tracking updates.
  socket.on('join_booking', (data) => {
    if (!data.bookingId) return;
    const room = `booking_${data.bookingId}`;
    socket.join(room);
    console.log(`📍 Socket ${socket.id} joined tracking room ${room}`);
  });

  // Technician registers their service categories so they receive only relevant job broadcasts.
  socket.on('tech_join_category', (data) => {
    const { techId, category, categories } = data || {};
    if (!techId) return;

    // Persist tech info mapped to socket ID so we can clean up on disconnect.
    connectedTechnicians.set(socket.id, { techId, category, categories: categories || [category] });

    // Join one Socket.IO room per service category for targeted booking broadcasts.
    const cats = categories || [category];
    cats.forEach(cat => {
      if (cat) {
        const catRoom = `category_${cat.toLowerCase().trim()}`;
        socket.join(catRoom);
        console.log(`🏷️ Tech ${techId} joined category room: ${catRoom}`);
      }
    });

    // General presence room — useful for "X technicians online" counts.
    socket.join('technicians_online');

    // Private room so the server can send targeted notifications to this technician only.
    socket.join(`tech_${techId}`);

    console.log(`🟢 Tech ${techId} registered online with categories: ${cats.join(', ')}`);
  });

  // Rate-limits Firestore writes for location updates; UI updates are still real-time.
  const lastLocationUpdates = new Map(); // id → timestamp of last DB write

  // Technician pushes a GPS coordinate; this handler fans it out to the booking room
  // and, every 10 s, persists it to Firestore and recalculates ETA.
  socket.on('update_location', async (data) => {
    const { bookingId, location, techId } = data || {};
    // Only create a booking room reference when the tech has an active booking (not idle).
    const room = (bookingId && typeof bookingId === 'string' && bookingId !== 'idle') ? `booking_${bookingId}` : null;

    // Always forward raw coordinates to the booking room for instant map updates.
    if (room) {
      io.to(room).emit('location_update', location);
    }

    // Forward to admin fleet room so the live fleet map stays current (unthrottled).
    if (techId && location) {
      io.to('admin_fleet').emit('fleet_tech_location', { techId, location, bookingId, timestamp: Date.now() });
    }

    // Throttle Firestore writes to once every 10 s to stay within quota limits.
    if (techId) {
      const now = Date.now();
      const lastUpdate = lastLocationUpdates.get(techId) || 0;

      if (now - lastUpdate > 10000) { // Update DB only every 10 s
        lastLocationUpdates.set(techId, now);

        try {
          // Persist technician's current coordinates to their Firestore profile.
          // Both snake_case and camelCase fields are written for frontend compatibility.
          await db.collection('technicians').doc(techId).update({
            location,
            lat: location?.lat,
            lng: location?.lng,
            // CamelCase fallbacks so the frontend can use either naming convention.
            techLocation: location,
            techLat: location?.lat,
            techLng: location?.lng,
            last_updated: new Date().toISOString()
          });
        } catch (err) {
          console.error('Tech Location Update Error:', err.message);
        }

        // If there's an active booking, recalculate ETA from tech's new position to customer.
        if (room && bookingId) {
          try {
            const docRef = await db.collection('bookings').doc(bookingId).get();
            const bookingDoc = docRef.exists ? { id: docRef.id, ...docRef.data() } : null;

            if (bookingDoc) {
              // Support both snake_case and camelCase field names stored in Firestore.
              const cLoc = bookingDoc.customer_location || bookingDoc.customerLocation ||
                (bookingDoc.customer_lat ? { lat: bookingDoc.customer_lat, lng: bookingDoc.customer_lng } :
                  bookingDoc.customerLat ? { lat: bookingDoc.customerLat, lng: bookingDoc.customerLng } : null);

              if (cLoc) {
                // Call Google Maps Distance Matrix to get live ETA with traffic data.
                const eta = await getRealETA(location, cLoc);
                // Push ETA to the customer's tracking screen in real-time.
                io.to(room).emit('eta_update', eta);
                // Check if ETA warrants sending a notification reminder (e.g. "5 min away").
                runReminderEngine(bookingDoc, eta);

                // Persist updated tech location and ETA inside the booking document.
                await db.collection('bookings').doc(bookingId).update({
                  tech_location: location,
                  techLocation: location, // CamelCase fallback
                  last_eta: eta.duration,
                  lastEta: eta.duration, // CamelCase fallback
                  updated_at: new Date().toISOString()
                });
              }
            }
          } catch (e) { console.error('Booking sync error in socket:', e.message); }
        }
      }
    }
  });

  // Customer shares their location so the technician's map can show where to go.
  socket.on('customer_update_location', async (data) => {
    const { bookingId, location, customerId } = data || {};
    if (!bookingId) return;
    const room = `booking_${bookingId}`;
    // Instantly broadcast to everyone in the booking room (technician and admin).
    io.to(room).emit('customer_location_update', location);

    // Forward to admin fleet map (unthrottled).
    if (location) {
      io.to('admin_fleet').emit('fleet_customer_location', { customerId, bookingId, location, timestamp: Date.now() });
    }

    // Throttle Firestore writes to once every 10 s (same strategy as tech location above).
    const idKey = customerId || bookingId;
    const now = Date.now();
    const lastUpdate = lastLocationUpdates.get(idKey) || 0;

    if (now - lastUpdate > 10000) {
      lastLocationUpdates.set(idKey, now);
      try {
        // Persist customer location in the booking document for ETA calculations.
        await db.collection('bookings').doc(bookingId).update({
          customer_location: location,
          customerLocation: location, // CamelCase fallback
          updated_at: new Date().toISOString()
        });
      } catch (err) {
        console.error('Customer Location Sync Error:', err.message);
      }
    }
  });

  // Technician updates the booking status (e.g. "arrived", "in_progress", "completed").
  socket.on('update_status', async (data) => {
    const { bookingId, status } = data || {};
    if (!bookingId) return;
    const room = `booking_${bookingId}`;
    // Broadcast the new status to the customer's tracking UI immediately.
    io.to(room).emit('status_update', { status });
    console.log(`📢 Status Update in ${room}: ${status}`);
  });

  // Customer's booking is broadcast to all online technicians so any nearby one can accept.
  socket.on('broadcast_booking', (data) => {
    // data contains: bookingId, category, customerLocation, address, urgency, estimatedCostRange, customerName, issueDescription
    console.log(`📡 Broadcasting new booking request: ${data.bookingId} for category ${data.category}`);

    // Emit to ALL connected clients — technician client-side filters by their own service category.
    io.emit('new_broadcast', data);
  });

  // A technician accepts a previously broadcast booking request.
  socket.on('broadcast_accepted', (data) => {
    // data contains: bookingId, technicianId, technicianName, technicianAvatar, technicianPhone, technicianRating
    console.log(`✅ Broadcast ${data.bookingId} accepted by tech ${data.technicianId} (${data.technicianName})`);

    // 1. Notify the customer immediately — they're waiting in the booking room.
    const room = `booking_${data.bookingId}`;
    io.to(room).emit('broadcast_accepted', data);

    // 2. Tell ALL other technicians this job is taken so they remove it from their queue.
    io.emit('broadcast_closed', {
      bookingId: data.bookingId,
      acceptedBy: data.technicianName,
      acceptedByTechId: data.technicianId
    });
  });

  // Technician explicitly marks themselves offline (e.g. end of shift).
  socket.on('tech_go_offline', (data) => {
    const { techId } = data || {};
    connectedTechnicians.delete(socket.id);
    socket.leave('technicians_online');
    console.log(`🔴 Tech ${techId || socket.id} went offline`);
  });

  // Clean up state when any client disconnects (browser close, network drop, etc.).
  socket.on('disconnect', () => {
    const techInfo = connectedTechnicians.get(socket.id);
    if (techInfo) {
      console.log(`❌ Tech ${techInfo.techId} disconnected`);
      connectedTechnicians.delete(socket.id);
    } else {
      console.log('❌ Client disconnected');
    }
  });
});

const PORT = process.env.PORT || 5000;
const { exec } = require('child_process');

function startServer() {
  server.listen(PORT, () => {
    const groqKey = process.env.GROQ_API_KEY || '';
    const isMockKey = !groqKey || groqKey.startsWith('gsk_...');
    console.log(`\n🚀 FIXNOW Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready for real-time connections`);
    console.log(`🗄️  Database: Firebase Firestore`);
    console.log(`🤖 AI Engine: Gemini 3.5 Flash Lite (primary) + NVIDIA (fallback)`);
    console.log(`🔑 NVIDIA Key: ${isMockKey ? 'NOT CONFIGURED' : 'ACTIVE (single key)'}`);
    console.log(`🔑 Gemini Key: ${process.env.GEMINI_API_KEY ? 'ACTIVE' : 'NOT CONFIGURED'}\n`);
  });

  // Exit immediately on port conflict so nodemon can restart cleanly.
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n❌ PORT ${PORT} OCCUPIED! Please clear it manually or pick a different port.`);
      process.exit(1);
    } else {
      console.error('SERVER CRITICAL ERROR:', e);
      process.exit(1);
    }
  });
}


// Only start the server if this file is run directly (not required as a module).
// This pattern allows the file to be imported by tests or Vercel without starting a listener.
if (require.main === module) {
  startServer();

  // Graceful shutdown releases the port before the process exits, preventing EADDRINUSE on restart.
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);
    server.close(() => {
      console.log('✅ Server closed. Releasing Port ' + PORT);
      process.exit(0);
    });

    // Force exit after 3 s if existing connections stall the close() callback.
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 3000);
  };

  // SIGTERM: sent by hosting platforms (Render, Railway) during deploys.
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  // SIGINT: Ctrl+C in terminal during development.
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  // SIGUSR2: specifically used by Nodemon to signal a restart.
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2'));
}

// Export the app so Vercel's serverless adapter can wrap it.
module.exports = app;
