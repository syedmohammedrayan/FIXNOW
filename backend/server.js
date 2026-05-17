const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.set('io', io);

// Serve uploaded files as static assets
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const aiRoutes = require('./routes/ai');
const bookingsRoutes = require('./routes/bookings');
const toolsRoutes = require('./routes/tools');
const usersRoutes = require('./routes/users');
const subscriptionsRoutes = require('./routes/subscriptions');
const { getRealETA } = require('./services/etaService');
const { notifyUser } = require('./services/notifications');
const { runReminderEngine } = require('./services/reminderEngine');
const { db } = require('./config/firebaseAdmin');
const uploadRoute = require('./routes/upload');
const complaintsRoutes = require('./routes/complaints');
app.use('/api/ai', aiRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/tools', toolsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/upload', uploadRoute);
app.use('/api/complaints', complaintsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'firebase', timestamp: new Date().toISOString() });
});

// ===== SOCKET.IO - Real-time Events =====
const activeRooms = new Map();
const activeSimulations = new Map(); // Track intervals by room ID
const connectedTechnicians = new Map(); // socketId -> { techId, category, categories }

io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Admin joins the fleet tracking room for real-time global view
  socket.on('admin_join_fleet', () => {
    socket.join('admin_fleet');
    console.log(`🗺️ Admin ${socket.id} joined fleet tracking room`);
  });

  // Join a booking room for live tracking
  socket.on('join_booking', (data) => {
    if (!data.bookingId) return;
    const room = `booking_${data.bookingId}`;
    socket.join(room);
    console.log(`📍 Socket ${socket.id} joined tracking room ${room}`);
  });

  // Technician joins their service category room(s) for targeted broadcasts
  socket.on('tech_join_category', (data) => {
    const { techId, category, categories } = data || {};
    if (!techId) return;

    // Store technician info for this socket
    connectedTechnicians.set(socket.id, { techId, category, categories: categories || [category] });

    // Join category-specific rooms
    const cats = categories || [category];
    cats.forEach(cat => {
      if (cat) {
        const catRoom = `category_${cat.toLowerCase().trim()}`;
        socket.join(catRoom);
        console.log(`🏷️ Tech ${techId} joined category room: ${catRoom}`);
      }
    });

    // Also join a general technicians room
    socket.join('technicians_online');

    // Join a private technician room for targeted notifications
    socket.join(`tech_${techId}`);

    console.log(`🟢 Tech ${techId} registered online with categories: ${cats.join(', ')}`);
  });

  // Throttled DB update for location to save quota
  const lastLocationUpdates = new Map(); // id -> timestamp

  // Technician sends manual location update
  socket.on('update_location', async (data) => {
    const { bookingId, location, techId } = data || {};
    const room = (bookingId && typeof bookingId === 'string' && bookingId !== 'idle') ? `booking_${bookingId}` : null;

    // Emit raw location to room if not idle (REAL-TIME UI)
    if (room) {
      io.to(room).emit('location_update', location);
    }

    // Broadcast to admin fleet room for live map (UNTHROTTLED)
    if (techId && location) {
      io.to('admin_fleet').emit('fleet_tech_location', { techId, location, bookingId, timestamp: Date.now() });
    }

    // Update technician document in Firestore (THROTTLED)
    if (techId) {
      const now = Date.now();
      const lastUpdate = lastLocationUpdates.get(techId) || 0;

      if (now - lastUpdate > 10000) { // Update DB only every 10s
        lastLocationUpdates.set(techId, now);

        try {
          await db.collection('technicians').doc(techId).update({
            location,
            lat: location?.lat,
            lng: location?.lng,
            // Add camelCase fallbacks for frontend consumers
            techLocation: location,
            techLat: location?.lat,
            techLng: location?.lng,
            last_updated: new Date().toISOString()
          });
        } catch (err) {
          console.error('Tech Location Update Error:', err.message);
        }

        // Also update booking if active
        if (room && bookingId) {
          try {
            const docRef = await db.collection('bookings').doc(bookingId).get();
            const bookingDoc = docRef.exists ? { id: docRef.id, ...docRef.data() } : null;

            if (bookingDoc) {
              // Robust check for both snake_case and camelCase
              const cLoc = bookingDoc.customer_location || bookingDoc.customerLocation ||
                (bookingDoc.customer_lat ? { lat: bookingDoc.customer_lat, lng: bookingDoc.customer_lng } :
                  bookingDoc.customerLat ? { lat: bookingDoc.customerLat, lng: bookingDoc.customerLng } : null);

              if (cLoc) {
                const eta = await getRealETA(location, cLoc);
                io.to(room).emit('eta_update', eta);
                runReminderEngine(bookingDoc, eta);

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

  // Customer sends manual location update
  socket.on('customer_update_location', async (data) => {
    const { bookingId, location, customerId } = data || {};
    if (!bookingId) return;
    const room = `booking_${bookingId}`;
    io.to(room).emit('customer_location_update', location);

    // Broadcast to admin fleet room for live map (UNTHROTTLED)
    if (location) {
      io.to('admin_fleet').emit('fleet_customer_location', { customerId, bookingId, location, timestamp: Date.now() });
    }

    // Also persist customer location in booking document (THROTTLED)
    const idKey = customerId || bookingId;
    const now = Date.now();
    const lastUpdate = lastLocationUpdates.get(idKey) || 0;

    if (now - lastUpdate > 10000) {
      lastLocationUpdates.set(idKey, now);
      try {
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

  // Technician sends status update
  socket.on('update_status', async (data) => {
    const { bookingId, status } = data || {};
    if (!bookingId) return;
    const room = `booking_${bookingId}`;
    io.to(room).emit('status_update', { status });
    console.log(`📢 Status Update in ${room}: ${status}`);
  });

  // Customer broadcasts a booking request to all technicians
  socket.on('broadcast_booking', (data) => {
    // data contains { bookingId, category, customerLocation, address, urgency, estimatedCostRange, customerName, issueDescription }
    console.log(`📡 Broadcasting new booking request: ${data.bookingId} for category ${data.category}`);

    // Broadcast to ALL connected clients — technician client-side filters by category
    io.emit('new_broadcast', data);
  });

  // Technician accepts a broadcast booking
  socket.on('broadcast_accepted', (data) => {
    // data contains { bookingId, technicianId, technicianName, technicianAvatar, technicianPhone, technicianRating }
    console.log(`✅ Broadcast ${data.bookingId} accepted by tech ${data.technicianId} (${data.technicianName})`);

    // 1. Emit to the booking room so the customer gets notified immediately
    const room = `booking_${data.bookingId}`;
    io.to(room).emit('broadcast_accepted', data);

    // 2. Notify ALL clients that this broadcast is closed (other technicians remove it + show "missed")
    io.emit('broadcast_closed', {
      bookingId: data.bookingId,
      acceptedBy: data.technicianName,
      acceptedByTechId: data.technicianId
    });
  });

  // Technician explicitly goes offline
  socket.on('tech_go_offline', (data) => {
    const { techId } = data || {};
    connectedTechnicians.delete(socket.id);
    socket.leave('technicians_online');
    console.log(`🔴 Tech ${techId || socket.id} went offline`);
  });

  socket.on('disconnect', () => {
    // Clean up technician tracking
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
    const groqKey = process.env.GROQ_API_KEY || 'gsk_...';
    const isMockKey = groqKey.startsWith('gsk_...') || groqKey === '';
    console.log(`\n🚀 FIXNOW Backend Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO ready for real-time connections`);
    console.log(`🗄️  Database: Firebase Firestore`);
    console.log(`🤖 AI Engine: Meta-Llama 4 Scout via Groq`);
    console.log(`🔑 Key Status: ${isMockKey ? 'FALLBACK/MOCK' : 'ACTIVE POOL'}\n`);
  });

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


// Only start the server if this file is run directly (not required as a module)
if (require.main === module) {
  startServer();

  // Create a graceful shutdown function to prevent EADDRINUSE port conflicts
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);
    server.close(() => {
      console.log('✅ Server closed. Releasing Port ' + PORT);
      process.exit(0);
    });

    // Force close if it takes too long (e.g. stalled database connections)
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 3000);
  };

  // Listen for termination signals to properly clean up ports
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // specifically used by Nodemon for restarts
}

// Export the app for Vercel
module.exports = app;
